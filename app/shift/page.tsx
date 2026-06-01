"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";

/* ─── Types ─── */
interface Job {
  id: string;
  name: string;
  hourlyWage: number;
  nightWage: number; // 深夜割増率 (e.g. 1.25)
  color: string;
}

interface Shift {
  id: string;
  jobId: string;
  date: string; // YYYY-MM-DD
  startHour: number;
  startMin: number;
  endHour: number;
  endMin: number;
  breakMin: number;
}

type Tab = "home" | "calendar" | "income" | "settings";

const JOB_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

const MONTHS_JA = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
const WEEKDAYS_JA = ["日","月","火","水","木","金","土"];

/* ─── Helpers ─── */
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function calcShiftPay(shift: Shift, job: Job): { hours: number; pay: number; nightHours: number } {
  let startTotal = shift.startHour * 60 + shift.startMin;
  let endTotal = shift.endHour * 60 + shift.endMin;
  // 翌日対応
  if (endTotal <= startTotal) endTotal += 24 * 60;
  const workMin = endTotal - startTotal - shift.breakMin;
  if (workMin <= 0) return { hours: 0, pay: 0, nightHours: 0 };

  const totalHours = workMin / 60;

  // 深夜時間計算 (22:00～5:00)
  let nightMin = 0;
  const NIGHT_START = 22 * 60;
  const NIGHT_END_NEXT = 29 * 60; // 5:00 next day
  for (let m = startTotal; m < endTotal; m++) {
    if (m >= startTotal + shift.breakMin || shift.breakMin === 0) {
      // simplify: break is at the start (rough approximation)
    }
    const mNorm = m % (24 * 60);
    if (mNorm >= NIGHT_START || mNorm < 5 * 60) {
      nightMin++;
    }
  }
  // Remove break from night (approximate)
  const nightHours = Math.max(0, nightMin / 60 - (shift.breakMin > 0 ? Math.min(shift.breakMin / 60, nightMin / 60) * 0.3 : 0));
  const normalHours = totalHours - nightHours;

  const pay = normalHours * job.hourlyWage + nightHours * job.hourlyWage * job.nightWage;

  return { hours: totalHours, pay: Math.round(pay), nightHours: Math.round(nightHours * 100) / 100 };
}

function formatYen(n: number): string {
  return "¥" + n.toLocaleString();
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* ─── Storage ─── */
function loadData<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem("appori_shift_" + key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}
function saveData(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem("appori_shift_" + key, JSON.stringify(value));
}

/* ─── Fuyo Limits ─── */
const FUYO_LIMITS = [
  { amount: 1030000, label: "103万円の壁", desc: "所得税がかかり始めます" },
  { amount: 1060000, label: "106万円の壁", desc: "社会保険加入の可能性（条件あり）" },
  { amount: 1300000, label: "130万円の壁", desc: "扶養から外れます（社会保険）" },
  { amount: 1500000, label: "150万円の壁", desc: "配偶者特別控除が減り始めます" },
];

/* ─────────────────────────── Component ─────────────────────────── */
export default function ShiftPage() {
  const [tab, setTab] = useState<Tab>("home");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [mounted, setMounted] = useState(false);

  // Calendar state
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Income chart state
  const [incomeYear, setIncomeYear] = useState(now.getFullYear());

  // Shift editor
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [showShiftEditor, setShowShiftEditor] = useState(false);

  // Settings editor
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [showJobEditor, setShowJobEditor] = useState(false);

  // Load
  useEffect(() => {
    setJobs(loadData<Job[]>("jobs", []));
    setShifts(loadData<Shift[]>("shifts", []));
    setMounted(true);
  }, []);

  // Save
  useEffect(() => {
    if (mounted) saveData("jobs", jobs);
  }, [jobs, mounted]);
  useEffect(() => {
    if (mounted) saveData("shifts", shifts);
  }, [shifts, mounted]);

  // Derived
  const jobMap = useMemo(() => {
    const m: Record<string, Job> = {};
    jobs.forEach((j) => (m[j.id] = j));
    return m;
  }, [jobs]);

  const todayPay = useMemo(() => {
    const td = todayStr();
    return shifts
      .filter((s) => s.date === td && jobMap[s.jobId])
      .reduce((sum, s) => sum + calcShiftPay(s, jobMap[s.jobId]).pay, 0);
  }, [shifts, jobMap]);

  // ── 主页"今月"=真实当前月（不受 calendar 切换影响），跟"今日"对齐 ──
  const homePrefix = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const monthPay = useMemo(() => {
    return shifts
      .filter((s) => s.date.startsWith(homePrefix) && jobMap[s.jobId])
      .reduce((sum, s) => sum + calcShiftPay(s, jobMap[s.jobId]).pay, 0);
  }, [shifts, jobMap, homePrefix]);

  const monthHours = useMemo(() => {
    return shifts
      .filter((s) => s.date.startsWith(homePrefix) && jobMap[s.jobId])
      .reduce((sum, s) => sum + calcShiftPay(s, jobMap[s.jobId]).hours, 0);
  }, [shifts, jobMap, homePrefix]);

  const monthDays = useMemo(() => {
    return new Set(shifts.filter((s) => s.date.startsWith(homePrefix)).map((s) => s.date)).size;
  }, [shifts, homePrefix]);

  // ── Calendar tab 底部合計用：跟 calendar 选中月走 ──
  const calPrefix = useMemo(
    () => `${calYear}-${String(calMonth + 1).padStart(2, "0")}`,
    [calYear, calMonth],
  );

  const calMonthPay = useMemo(() => {
    return shifts
      .filter((s) => s.date.startsWith(calPrefix) && jobMap[s.jobId])
      .reduce((sum, s) => sum + calcShiftPay(s, jobMap[s.jobId]).pay, 0);
  }, [shifts, jobMap, calPrefix]);

  const calMonthHours = useMemo(() => {
    return shifts
      .filter((s) => s.date.startsWith(calPrefix) && jobMap[s.jobId])
      .reduce((sum, s) => sum + calcShiftPay(s, jobMap[s.jobId]).hours, 0);
  }, [shifts, jobMap, calPrefix]);

  const calMonthDays = useMemo(() => {
    return new Set(shifts.filter((s) => s.date.startsWith(calPrefix)).map((s) => s.date)).size;
  }, [shifts, calPrefix]);

  // Year total for fuyo
  const yearTotal = useMemo(() => {
    const prefix = `${incomeYear}`;
    return shifts
      .filter((s) => s.date.startsWith(prefix) && jobMap[s.jobId])
      .reduce((sum, s) => sum + calcShiftPay(s, jobMap[s.jobId]).pay, 0);
  }, [shifts, jobMap, incomeYear]);

  // Monthly income data for chart
  const monthlyIncomes = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const prefix = `${incomeYear}-${String(i + 1).padStart(2, "0")}`;
      return shifts
        .filter((s) => s.date.startsWith(prefix) && jobMap[s.jobId])
        .reduce((sum, s) => sum + calcShiftPay(s, jobMap[s.jobId]).pay, 0);
    });
  }, [shifts, jobMap, incomeYear]);

  const maxMonthlyIncome = Math.max(...monthlyIncomes, 1);

  // ─── Shift Helpers ───
  const addShift = (date: string) => {
    if (jobs.length === 0) {
      setTab("settings");
      setShowJobEditor(true);
      setEditingJob(null);
      return;
    }
    // Default to last shift times or standard
    const lastShift = shifts.length > 0 ? shifts[shifts.length - 1] : null;
    const newShift: Shift = {
      id: genId(),
      jobId: jobs[0].id,
      date,
      startHour: lastShift?.startHour ?? 9,
      startMin: lastShift?.startMin ?? 0,
      endHour: lastShift?.endHour ?? 17,
      endMin: lastShift?.endMin ?? 0,
      breakMin: lastShift?.breakMin ?? 60,
    };
    setEditingShift(newShift);
    setShowShiftEditor(true);
  };

  const saveShift = (s: Shift) => {
    setShifts((prev) => {
      const idx = prev.findIndex((x) => x.id === s.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = s;
        return next;
      }
      return [...prev, s];
    });
    setShowShiftEditor(false);
    setEditingShift(null);
  };

  const deleteShift = (id: string) => {
    setShifts((prev) => prev.filter((s) => s.id !== id));
    setShowShiftEditor(false);
    setEditingShift(null);
  };

  // ─── Job Helpers ───
  const saveJob = (j: Job) => {
    setJobs((prev) => {
      const idx = prev.findIndex((x) => x.id === j.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = j;
        return next;
      }
      return [...prev, j];
    });
    setShowJobEditor(false);
    setEditingJob(null);
  };

  const deleteJob = (id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
    setShifts((prev) => prev.filter((s) => s.jobId !== id));
    setShowJobEditor(false);
    setEditingJob(null);
  };

  if (!mounted) return null;

  // ─────────────────────── RENDER ───────────────────────

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#F8FAFC", fontFamily: "'Hiragino Sans', 'Noto Sans JP', sans-serif" }}
    >
      {/* Header */}
      <header
        style={{
          background: "#fff",
          borderBottom: "1px solid #E2E8F0",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <Image src="/logo.png" alt="Appori" width={28} height={28} style={{ borderRadius: 8 }} />
          <span style={{ fontWeight: 700, fontSize: 15, color: "#0F172A" }}>Appori</span>
        </Link>
        <span style={{ fontWeight: 800, fontSize: 16, color: "#0F172A" }}>シフト＆給料計算</span>
      </header>

      {/* Content */}
      <main style={{ flex: 1, padding: "0 0 80px", maxWidth: 480, width: "100%", margin: "0 auto" }}>
        {/* ─── HOME TAB ─── */}
        {tab === "home" && (
          <div style={{ padding: 16 }}>
            {/* Today Card */}
            <div
              style={{
                background: "linear-gradient(135deg, #3B82F6, #2563EB)",
                borderRadius: 20,
                padding: "28px 24px",
                color: "#fff",
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>今日の収入</div>
              <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1 }}>
                {formatYen(todayPay)}
              </div>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
                {todayStr().replace(/-/g, "/")}
              </div>
            </div>

            {/* Month Summary */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 10,
                marginBottom: 20,
              }}
            >
              {[
                { label: "今月の収入", value: formatYen(monthPay), color: "#2563EB" },
                { label: "勤務日数", value: `${monthDays}日`, color: "#059669" },
                { label: "総労働時間", value: `${Math.round(monthHours * 10) / 10}h`, color: "#D97706" },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    background: "#fff",
                    borderRadius: 14,
                    padding: "16px 12px",
                    textAlign: "center",
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <div style={{ fontSize: 11, color: "#64748B", marginBottom: 6 }}>{item.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Fuyo Warning */}
            {(() => {
              const nextLimit = FUYO_LIMITS.find((l) => yearTotal < l.amount);
              if (!nextLimit) return null;
              const remaining = nextLimit.amount - yearTotal;
              const percentage = (yearTotal / nextLimit.amount) * 100;
              const isClose = percentage > 80;
              return (
                <div
                  style={{
                    background: isClose ? "#FFF7ED" : "#F0F9FF",
                    border: `1px solid ${isClose ? "#FDBA74" : "#BAE6FD"}`,
                    borderRadius: 14,
                    padding: "16px 18px",
                    marginBottom: 20,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 18 }}>{isClose ? "⚠️" : "📊"}</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: "#0F172A" }}>
                      {nextLimit.label}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      background: "#E2E8F0",
                      borderRadius: 4,
                      overflow: "hidden",
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(percentage, 100)}%`,
                        background: isClose
                          ? "linear-gradient(90deg, #F59E0B, #EF4444)"
                          : "linear-gradient(90deg, #3B82F6, #2563EB)",
                        borderRadius: 4,
                        transition: "width 0.5s",
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 13, color: "#475569" }}>
                    あと <strong style={{ color: isClose ? "#EA580C" : "#2563EB" }}>{formatYen(remaining)}</strong>{" "}
                    で{nextLimit.label}に達します
                  </div>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>
                    {incomeYear}年累計: {formatYen(yearTotal)} / {nextLimit.desc}
                  </div>
                </div>
              );
            })()}

            {/* Quick Add */}
            <button
              onClick={() => addShift(todayStr())}
              style={{
                width: "100%",
                padding: "16px 0",
                borderRadius: 14,
                border: "none",
                background: "linear-gradient(135deg, #3B82F6, #2563EB)",
                color: "#fff",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: "0 4px 16px rgba(37,99,235,0.3)",
              }}
            >
              + 今日のシフトを追加
            </button>

            {/* Today's shifts */}
            {shifts
              .filter((s) => s.date === todayStr())
              .map((s) => {
                const job = jobMap[s.jobId];
                if (!job) return null;
                const { hours, pay } = calcShiftPay(s, job);
                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      setEditingShift(s);
                      setShowShiftEditor(true);
                    }}
                    style={{
                      background: "#fff",
                      borderRadius: 12,
                      padding: "14px 16px",
                      marginTop: 10,
                      border: "1px solid #E2E8F0",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 40,
                        borderRadius: 4,
                        background: job.color,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{job.name}</div>
                      <div style={{ fontSize: 12, color: "#64748B" }}>
                        {String(s.startHour).padStart(2, "0")}:{String(s.startMin).padStart(2, "0")} ~{" "}
                        {String(s.endHour).padStart(2, "0")}:{String(s.endMin).padStart(2, "0")}
                        {"　"}({Math.round(hours * 10) / 10}h)
                      </div>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#2563EB" }}>{formatYen(pay)}</div>
                  </div>
                );
              })}
          </div>
        )}

        {/* ─── CALENDAR TAB ─── */}
        {tab === "calendar" && (
          <div style={{ padding: 16 }}>
            {/* Month Nav */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <button
                onClick={() => {
                  if (calMonth === 0) {
                    setCalMonth(11);
                    setCalYear(calYear - 1);
                  } else setCalMonth(calMonth - 1);
                }}
                style={navBtnStyle}
              >
                ◀
              </button>
              <span style={{ fontWeight: 700, fontSize: 17, color: "#0F172A" }}>
                {calYear}年 {MONTHS_JA[calMonth]}
              </span>
              <button
                onClick={() => {
                  if (calMonth === 11) {
                    setCalMonth(0);
                    setCalYear(calYear + 1);
                  } else setCalMonth(calMonth + 1);
                }}
                style={navBtnStyle}
              >
                ▶
              </button>
            </div>

            {/* Weekday Headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
              {WEEKDAYS_JA.map((w, i) => (
                <div
                  key={w}
                  style={{
                    textAlign: "center",
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "6px 0",
                    color: i === 0 ? "#EF4444" : i === 6 ? "#3B82F6" : "#94A3B8",
                  }}
                >
                  {w}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
              {Array.from({ length: getFirstDayOfMonth(calYear, calMonth) }, (_, i) => (
                <div key={`e${i}`} />
              ))}
              {Array.from({ length: getDaysInMonth(calYear, calMonth) }, (_, i) => {
                const day = i + 1;
                const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayShifts = shifts.filter((s) => s.date === dateStr);
                const isToday = dateStr === todayStr();
                const dow = new Date(calYear, calMonth, day).getDay();
                return (
                  <div
                    key={day}
                    onClick={() => {
                      setSelectedDate(dateStr);
                    }}
                    style={{
                      background: isToday ? "#EFF6FF" : "#fff",
                      border: selectedDate === dateStr ? "2px solid #3B82F6" : "1px solid #F1F5F9",
                      borderRadius: 10,
                      padding: "8px 4px",
                      minHeight: 52,
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.15s",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: isToday ? 800 : 500,
                        color: dow === 0 ? "#EF4444" : dow === 6 ? "#3B82F6" : "#0F172A",
                        marginBottom: 4,
                      }}
                    >
                      {day}
                    </div>
                    {dayShifts.length > 0 && (
                      <div style={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
                        {dayShifts.map((s) => (
                          <div
                            key={s.id}
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: jobMap[s.jobId]?.color || "#94A3B8",
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Selected Date Detail */}
            {selectedDate && (
              <div style={{ marginTop: 16 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: 15, color: "#0F172A" }}>
                    {selectedDate.replace(/-/g, "/")}
                  </span>
                  <button
                    onClick={() => addShift(selectedDate)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 8,
                      border: "none",
                      background: "#2563EB",
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    + 追加
                  </button>
                </div>
                {shifts
                  .filter((s) => s.date === selectedDate)
                  .map((s) => {
                    const job = jobMap[s.jobId];
                    if (!job) return null;
                    const { hours, pay } = calcShiftPay(s, job);
                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          setEditingShift(s);
                          setShowShiftEditor(true);
                        }}
                        style={{
                          background: "#fff",
                          borderRadius: 12,
                          padding: "14px 16px",
                          marginBottom: 8,
                          border: "1px solid #E2E8F0",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{ width: 8, height: 40, borderRadius: 4, background: job.color, flexShrink: 0 }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{job.name}</div>
                          <div style={{ fontSize: 12, color: "#64748B" }}>
                            {String(s.startHour).padStart(2, "0")}:{String(s.startMin).padStart(2, "0")} ~{" "}
                            {String(s.endHour).padStart(2, "0")}:{String(s.endMin).padStart(2, "0")}
                            {"　"}({Math.round(hours * 10) / 10}h)
                          </div>
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#2563EB" }}>{formatYen(pay)}</div>
                      </div>
                    );
                  })}
                {shifts.filter((s) => s.date === selectedDate).length === 0 && (
                  <div style={{ textAlign: "center", padding: "20px 0", color: "#94A3B8", fontSize: 13 }}>
                    この日のシフトはありません
                  </div>
                )}
              </div>
            )}

            {/* Month total */}
            <div
              style={{
                marginTop: 20,
                background: "#fff",
                borderRadius: 14,
                padding: "16px 18px",
                border: "1px solid #E2E8F0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 12, color: "#64748B" }}>今月の合計</div>
                <div style={{ fontSize: 11, color: "#94A3B8" }}>
                  {calMonthDays}日 / {Math.round(calMonthHours * 10) / 10}h
                </div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#2563EB" }}>{formatYen(calMonthPay)}</div>
            </div>
          </div>
        )}

        {/* ─── INCOME TAB ─── */}
        {tab === "income" && (
          <div style={{ padding: 16 }}>
            {/* Year Nav */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <button onClick={() => setIncomeYear(incomeYear - 1)} style={navBtnStyle}>
                ◀
              </button>
              <span style={{ fontWeight: 700, fontSize: 17, color: "#0F172A" }}>{incomeYear}年</span>
              <button onClick={() => setIncomeYear(incomeYear + 1)} style={navBtnStyle}>
                ▶
              </button>
            </div>

            {/* Year Total */}
            <div
              style={{
                background: "linear-gradient(135deg, #0F172A, #1E3A5F)",
                borderRadius: 20,
                padding: "24px 20px",
                color: "#fff",
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 13, opacity: 0.7 }}>年間収入</div>
              <div style={{ fontSize: 32, fontWeight: 800, marginTop: 4 }}>{formatYen(yearTotal)}</div>
            </div>

            {/* Bar Chart */}
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: "20px 16px",
                border: "1px solid #E2E8F0",
                marginBottom: 20,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>
                月別収入
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 160 }}>
                {monthlyIncomes.map((v, i) => (
                  <div key={i} style={{ flex: 1, textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 9,
                        color: "#64748B",
                        marginBottom: 4,
                        fontWeight: 600,
                      }}
                    >
                      {v > 0 ? `${Math.round(v / 1000)}k` : ""}
                    </div>
                    <div
                      style={{
                        height: `${Math.max((v / maxMonthlyIncome) * 120, v > 0 ? 4 : 0)}px`,
                        background:
                          i === now.getMonth() && incomeYear === now.getFullYear()
                            ? "linear-gradient(180deg, #3B82F6, #2563EB)"
                            : "#E2E8F0",
                        borderRadius: 4,
                        transition: "height 0.4s",
                      }}
                    />
                    <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 4 }}>{i + 1}月</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fuyo Limits */}
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: "20px 18px",
                border: "1px solid #E2E8F0",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 14 }}>
                扶養・税金の壁
              </div>
              {FUYO_LIMITS.map((limit) => {
                const pct = Math.min((yearTotal / limit.amount) * 100, 100);
                const exceeded = yearTotal >= limit.amount;
                return (
                  <div key={limit.amount} style={{ marginBottom: 14 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: exceeded ? "#EF4444" : "#0F172A",
                        }}
                      >
                        {exceeded ? "✕ " : ""}
                        {limit.label}
                      </span>
                      <span style={{ fontSize: 11, color: "#94A3B8" }}>
                        {exceeded ? "超過" : `あと ${formatYen(limit.amount - yearTotal)}`}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 6,
                        background: "#F1F5F9",
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: exceeded
                            ? "#EF4444"
                            : pct > 80
                              ? "#F59E0B"
                              : "#3B82F6",
                          borderRadius: 3,
                          transition: "width 0.5s",
                        }}
                      />
                    </div>
                    <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>{limit.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── SETTINGS TAB ─── */}
        {tab === "settings" && (
          <div style={{ padding: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 17, color: "#0F172A" }}>お仕事の設定</span>
              <button
                onClick={() => {
                  setEditingJob(null);
                  setShowJobEditor(true);
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: "#2563EB",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                + 追加
              </button>
            </div>

            {jobs.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  color: "#94A3B8",
                  fontSize: 14,
                }}
              >
                まずお仕事を登録してください
              </div>
            )}

            {jobs.map((j) => (
              <div
                key={j.id}
                onClick={() => {
                  setEditingJob(j);
                  setShowJobEditor(true);
                }}
                style={{
                  background: "#fff",
                  borderRadius: 14,
                  padding: "16px 18px",
                  marginBottom: 10,
                  border: "1px solid #E2E8F0",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: j.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 16,
                    flexShrink: 0,
                  }}
                >
                  {j.name[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{j.name}</div>
                  <div style={{ fontSize: 12, color: "#64748B" }}>
                    時給 {formatYen(j.hourlyWage)}　深夜 ×{j.nightWage}
                  </div>
                </div>
                <span style={{ color: "#CBD5E1", fontSize: 18 }}>›</span>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ─── Bottom Tab Bar ─── */}
      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#fff",
          borderTop: "1px solid #E2E8F0",
          display: "flex",
          justifyContent: "space-around",
          padding: "8px 0 env(safe-area-inset-bottom, 8px)",
          zIndex: 50,
        }}
      >
        {(
          [
            { id: "home", icon: "🏠", label: "ホーム" },
            { id: "calendar", icon: "📅", label: "カレンダー" },
            { id: "income", icon: "📊", label: "収入" },
            { id: "settings", icon: "⚙️", label: "設定" },
          ] as { id: Tab; icon: string; label: string }[]
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              padding: "4px 12px",
              fontFamily: "inherit",
            }}
          >
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: tab === t.id ? 700 : 500,
                color: tab === t.id ? "#2563EB" : "#94A3B8",
              }}
            >
              {t.label}
            </span>
          </button>
        ))}
      </nav>

      {/* ─── Shift Editor Modal ─── */}
      {showShiftEditor && editingShift && (
        <ModalOverlay onClose={() => setShowShiftEditor(false)}>
          <ShiftEditor
            shift={editingShift}
            jobs={jobs}
            onSave={saveShift}
            onDelete={deleteShift}
            onClose={() => setShowShiftEditor(false)}
          />
        </ModalOverlay>
      )}

      {/* ─── Job Editor Modal ─── */}
      {showJobEditor && (
        <ModalOverlay onClose={() => setShowJobEditor(false)}>
          <JobEditor
            job={editingJob}
            existingCount={jobs.length}
            onSave={saveJob}
            onDelete={deleteJob}
            onClose={() => setShowJobEditor(false)}
          />
        </ModalOverlay>
      )}
    </div>
  );
}

/* ─── Shared Styles ─── */
const navBtnStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #E2E8F0",
  borderRadius: 10,
  width: 36,
  height: 36,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 14,
  cursor: "pointer",
  color: "#64748B",
};

/* ─── Modal Overlay ─── */
function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: "rgba(15,23,42,0.4)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "20px 20px 0 0",
          width: "100%",
          maxWidth: 480,
          maxHeight: "85vh",
          overflowY: "auto",
          padding: "24px 20px env(safe-area-inset-bottom, 20px)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ─── Time Selector ─── */
function TimeSelect({
  hour,
  min,
  onChangeHour,
  onChangeMin,
  label,
}: {
  hour: number;
  min: number;
  onChangeHour: (v: number) => void;
  onChangeMin: (v: number) => void;
  label: string;
}) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <select
          value={hour}
          onChange={(e) => onChangeHour(Number(e.target.value))}
          style={selectStyle}
        >
          {Array.from({ length: 24 }, (_, i) => (
            <option key={i} value={i}>
              {String(i).padStart(2, "0")}
            </option>
          ))}
        </select>
        <span style={{ fontSize: 18, color: "#64748B" }}>:</span>
        <select
          value={min}
          onChange={(e) => onChangeMin(Number(e.target.value))}
          style={selectStyle}
        >
          {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
            <option key={m} value={m}>
              {String(m).padStart(2, "0")}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1.5px solid #E2E8F0",
  fontSize: 16,
  fontWeight: 600,
  color: "#0F172A",
  background: "#fff",
  fontFamily: "inherit",
  minWidth: 70,
};

/* ─── Shift Editor ─── */
function ShiftEditor({
  shift,
  jobs,
  onSave,
  onDelete,
  onClose,
}: {
  shift: Shift;
  jobs: Job[];
  onSave: (s: Shift) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [s, setS] = useState<Shift>({ ...shift });
  const isNew = !jobs.some(() => true) ? false : true; // simplify

  const job = jobs.find((j) => j.id === s.jobId) || jobs[0];
  const preview = job ? calcShiftPay(s, job) : { hours: 0, pay: 0, nightHours: 0 };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <span style={{ fontWeight: 700, fontSize: 17, color: "#0F172A" }}>シフト編集</span>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: "#94A3B8", cursor: "pointer" }}>
          ✕
        </button>
      </div>

      {/* Job Select */}
      {jobs.length > 1 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>お仕事</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {jobs.map((j) => (
              <button
                key={j.id}
                onClick={() => setS({ ...s, jobId: j.id })}
                style={{
                  padding: "8px 16px",
                  borderRadius: 10,
                  border: s.jobId === j.id ? `2px solid ${j.color}` : "1.5px solid #E2E8F0",
                  background: s.jobId === j.id ? `${j.color}10` : "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  color: s.jobId === j.id ? j.color : "#64748B",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {j.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Time */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
        <TimeSelect
          label="開始時間"
          hour={s.startHour}
          min={s.startMin}
          onChangeHour={(v) => setS({ ...s, startHour: v })}
          onChangeMin={(v) => setS({ ...s, startMin: v })}
        />
        <TimeSelect
          label="終了時間"
          hour={s.endHour}
          min={s.endMin}
          onChangeHour={(v) => setS({ ...s, endHour: v })}
          onChangeMin={(v) => setS({ ...s, endMin: v })}
        />
      </div>

      {/* Break */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>休憩時間</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[0, 15, 30, 45, 60, 90].map((m) => (
            <button
              key={m}
              onClick={() => setS({ ...s, breakMin: m })}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: s.breakMin === m ? "2px solid #2563EB" : "1.5px solid #E2E8F0",
                background: s.breakMin === m ? "#EFF6FF" : "#fff",
                fontSize: 13,
                fontWeight: 600,
                color: s.breakMin === m ? "#2563EB" : "#64748B",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {m}分
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div
        style={{
          background: "#F8FAFC",
          borderRadius: 14,
          padding: "16px 18px",
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: "#64748B" }}>
            {Math.round(preview.hours * 10) / 10}時間{preview.nightHours > 0 ? `（深夜 ${preview.nightHours}h）` : ""}
          </div>
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#2563EB" }}>{formatYen(preview.pay)}</div>
      </div>

      {/* Actions */}
      <button
        onClick={() => onSave(s)}
        style={{
          width: "100%",
          padding: "14px 0",
          borderRadius: 12,
          border: "none",
          background: "linear-gradient(135deg, #3B82F6, #2563EB)",
          color: "#fff",
          fontSize: 15,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "inherit",
          boxShadow: "0 4px 16px rgba(37,99,235,0.3)",
          marginBottom: 10,
        }}
      >
        保存する
      </button>
      <button
        onClick={() => {
          if (confirm("このシフトを削除しますか？")) deleteShift(s.id);
        }}
        style={{
          width: "100%",
          padding: "12px 0",
          borderRadius: 12,
          border: "1px solid #FEE2E2",
          background: "#FFF",
          color: "#EF4444",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        削除
      </button>
    </div>
  );
}

/* ─── Job Editor ─── */
function JobEditor({
  job,
  existingCount,
  onSave,
  onDelete,
  onClose,
}: {
  job: Job | null;
  existingCount: number;
  onSave: (j: Job) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [j, setJ] = useState<Job>(
    job || {
      id: genId(),
      name: "",
      hourlyWage: 1100,
      nightWage: 1.25,
      color: JOB_COLORS[existingCount % JOB_COLORS.length],
    }
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <span style={{ fontWeight: 700, fontSize: 17, color: "#0F172A" }}>
          {job ? "お仕事を編集" : "お仕事を追加"}
        </span>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: "#94A3B8", cursor: "pointer" }}>
          ✕
        </button>
      </div>

      {/* Name */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
          お仕事の名前
        </label>
        <input
          type="text"
          value={j.name}
          onChange={(e) => setJ({ ...j, name: e.target.value })}
          placeholder="例: ○○カフェ"
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "12px 14px",
            border: "1.5px solid #E2E8F0",
            borderRadius: 10,
            fontSize: 15,
            color: "#0F172A",
            outline: "none",
            fontFamily: "inherit",
          }}
        />
      </div>

      {/* Wage */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
          時給（円）
        </label>
        <input
          type="number"
          value={j.hourlyWage}
          onChange={(e) => setJ({ ...j, hourlyWage: Number(e.target.value) })}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "12px 14px",
            border: "1.5px solid #E2E8F0",
            borderRadius: 10,
            fontSize: 18,
            fontWeight: 700,
            color: "#0F172A",
            outline: "none",
            fontFamily: "inherit",
          }}
        />
      </div>

      {/* Night Wage */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
          深夜割増率（22:00～5:00）
        </label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[1.0, 1.25, 1.35, 1.5].map((rate) => (
            <button
              key={rate}
              onClick={() => setJ({ ...j, nightWage: rate })}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                border: j.nightWage === rate ? "2px solid #2563EB" : "1.5px solid #E2E8F0",
                background: j.nightWage === rate ? "#EFF6FF" : "#fff",
                fontSize: 14,
                fontWeight: 700,
                color: j.nightWage === rate ? "#2563EB" : "#64748B",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              ×{rate}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 6 }}>
          ※ 法定深夜割増は ×1.25 です
        </div>
      </div>

      {/* Color */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
          カラー
        </label>
        <div style={{ display: "flex", gap: 10 }}>
          {JOB_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setJ({ ...j, color: c })}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: c,
                border: j.color === c ? "3px solid #0F172A" : "2px solid transparent",
                cursor: "pointer",
                outline: j.color === c ? "2px solid #fff" : "none",
              }}
            />
          ))}
        </div>
      </div>

      {/* Save */}
      <button
        onClick={() => {
          if (!j.name.trim()) return;
          onSave(j);
        }}
        disabled={!j.name.trim()}
        style={{
          width: "100%",
          padding: "14px 0",
          borderRadius: 12,
          border: "none",
          background: j.name.trim() ? "linear-gradient(135deg, #3B82F6, #2563EB)" : "#E2E8F0",
          color: j.name.trim() ? "#fff" : "#94A3B8",
          fontSize: 15,
          fontWeight: 700,
          cursor: j.name.trim() ? "pointer" : "default",
          fontFamily: "inherit",
          boxShadow: j.name.trim() ? "0 4px 16px rgba(37,99,235,0.3)" : "none",
          marginBottom: 10,
        }}
      >
        保存する
      </button>
      {job && (
        <button
          onClick={() => {
            if (confirm("このお仕事と関連シフトを削除しますか？")) onDelete(job.id);
          }}
          style={{
            width: "100%",
            padding: "12px 0",
            borderRadius: 12,
            border: "1px solid #FEE2E2",
            background: "#FFF",
            color: "#EF4444",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          削除
        </button>
      )}
    </div>
  );
}
