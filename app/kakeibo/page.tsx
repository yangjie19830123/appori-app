"use client";

import { useState, useMemo } from "react";
import ApporiLogo from "@/components/kakeibo/ApporiLogo";
import RingChart from "@/components/kakeibo/RingChart";
import BarChart from "@/components/kakeibo/BarChart";
import AddModal from "@/components/kakeibo/AddModal";
import {
  EXPENSE_CATS,
  INCOME_CATS,
  MEMBERS,
  MONTHS_JP,
  ALL_CATS,
  SEED_DATA,
  formatYen,
  formatDate,
} from "@/lib/kakeibo/constants";
import { Entry, CatTotal, MemberTotal, MonthData } from "@/lib/kakeibo/types";

type Tab = "home" | "stats" | "family";

export default function KakeiboPage() {
  const [entries, setEntries] = useState<Entry[]>(SEED_DATA);
  const [tab, setTab] = useState<Tab>("home");
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [memberFilter, setMemberFilter] = useState("all");
  const [budget, setBudget] = useState(350000);
  const [editBudget, setEditBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState("350000");

  const now = new Date();
  const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // ── Derived ──
  const filtered = memberFilter === "all" ? entries : entries.filter((e) => e.member === memberFilter);
  const thisMonth = filtered.filter((e) => e.date.startsWith(curMonth));
  const totalIncome = thisMonth.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0);
  const totalExpense = thisMonth.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0);
  const balance = totalIncome - totalExpense;
  const budgetPct = budget ? Math.round((totalExpense / budget) * 100) : 0;

  const expByCat: CatTotal[] = useMemo(() => {
    const map: Record<string, number> = {};
    thisMonth.filter((e) => e.type === "expense").forEach((e) => {
      map[e.cat] = (map[e.cat] || 0) + e.amount;
    });
    return EXPENSE_CATS.map((c) => ({ ...c, amount: map[c.id] || 0 }))
      .filter((c) => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [thisMonth]);

  const monthlyData: MonthData[] = useMemo(() => {
    const months: MonthData[] = [];
    for (let m = 0; m < 4; m++) {
      const d = new Date(now.getFullYear(), now.getMonth() - 3 + m, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const mE = filtered.filter((e) => e.date.startsWith(key));
      months.push({
        label: MONTHS_JP[d.getMonth()],
        income: mE.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0),
        expense: mE.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0),
      });
    }
    return months;
  }, [filtered]);

  const memberTotals: MemberTotal[] = useMemo(
    () =>
      MEMBERS.map((m) => ({
        ...m,
        expense: thisMonth.filter((e) => e.type === "expense" && e.member === m.id).reduce((s, e) => s + e.amount, 0),
        income: thisMonth.filter((e) => e.type === "income" && e.member === m.id).reduce((s, e) => s + e.amount, 0),
      })),
    [thisMonth]
  );

  const grouped = useMemo(() => {
    const g: Record<string, Entry[]> = {};
    [...thisMonth].sort((a, b) => b.date.localeCompare(a.date)).forEach((e) => {
      if (!g[e.date]) g[e.date] = [];
      g[e.date].push(e);
    });
    return g;
  }, [thisMonth]);

  // ── Actions ──
  const fire = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  const addEntry = (data: Omit<Entry, "id">) => {
    setEntries([{ ...data, id: Date.now() }, ...entries]);
    setShowModal(false);
    fire("記録しました ✓");
  };

  const deleteEntry = (id: number) => {
    setEntries(entries.filter((e) => e.id !== id));
    fire("削除しました");
  };

  const saveBudget = () => {
    const v = parseInt(tempBudget);
    if (v > 0) setBudget(v);
    setEditBudget(false);
  };

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "home", label: "履歴", icon: "📋" },
    { id: "stats", label: "統計", icon: "📊" },
    { id: "family", label: "家族", icon: "👨‍👩‍👧" },
  ];

  return (
    <div className="mx-auto min-h-screen max-w-[420px] bg-slate-50 relative">

      {/* ═══ Header ═══ */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white px-4 pb-3 pt-3.5">
        <div className="flex items-center justify-between">
          <ApporiLogo size={28} />
          <div className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-500">
            {now.getFullYear()}年{MONTHS_JP[now.getMonth()]}
          </div>
        </div>
        <p className="mt-1.5 text-[11px] tracking-wider text-slate-400">家計簿</p>
        <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-0.5">
          {[{ id: "all", name: "全員", avatar: "👪", color: "#3B82F6" }, ...MEMBERS].map((m) => (
            <button
              key={m.id}
              onClick={() => setMemberFilter(m.id)}
              className={`flex-shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold transition-all ${
                memberFilter === m.id ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              {m.avatar} {m.name}
            </button>
          ))}
        </div>
      </header>

      {/* ═══ Summary ═══ */}
      <div className="flex gap-2 px-4 pt-3">
        <div className="flex-1 rounded-2xl bg-emerald-50 px-3.5 py-3">
          <p className="text-[10px] font-semibold text-emerald-500">収入</p>
          <p className="mt-0.5 text-lg font-bold text-emerald-700">{formatYen(totalIncome)}</p>
        </div>
        <div className="flex-1 rounded-2xl bg-red-50 px-3.5 py-3">
          <p className="text-[10px] font-semibold text-red-500">支出</p>
          <p className="mt-0.5 text-lg font-bold text-red-700">{formatYen(totalExpense)}</p>
        </div>
        <div className="flex-1 rounded-2xl bg-blue-50 px-3.5 py-3">
          <p className="text-[10px] font-semibold text-blue-500">残高</p>
          <p className={`mt-0.5 text-lg font-bold ${balance >= 0 ? "text-blue-700" : "text-red-600"}`}>
            {formatYen(balance)}
          </p>
        </div>
      </div>

      {/* ═══ Budget ═══ */}
      <div className="mx-4 mt-2.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-400">予算 {formatYen(budget)}</span>
          {!editBudget ? (
            <button
              onClick={() => { setEditBudget(true); setTempBudget(String(budget)); }}
              className="text-[11px] font-semibold text-blue-500"
            >
              変更
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <input
                value={tempBudget}
                onChange={(e) => setTempBudget(e.target.value.replace(/\D/g, ""))}
                className="w-20 rounded-lg border border-slate-200 px-1.5 py-0.5 text-right text-xs"
              />
              <button
                onClick={saveBudget}
                className="rounded-lg bg-blue-500 px-2.5 py-1 text-[11px] font-semibold text-white"
              >
                OK
              </button>
            </div>
          )}
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(budgetPct, 100)}%`,
              background: budgetPct > 90
                ? "linear-gradient(90deg, #EF4444, #DC2626)"
                : "linear-gradient(90deg, #60A5FA, #3B82F6)",
            }}
          />
        </div>
        <p className={`mt-1 text-right text-[10px] font-semibold ${budgetPct > 90 ? "text-red-500" : "text-slate-400"}`}>
          {budgetPct}%
        </p>
      </div>

      {/* ═══ Tabs ═══ */}
      <div className="mx-4 mt-3 flex gap-0.5 rounded-xl bg-slate-100 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2 text-[11px] font-semibold transition-all ${
              tab === t.id ? "bg-white text-blue-500 shadow-sm" : "text-slate-400"
            }`}
          >
            <span className="text-[15px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ Content ═══ */}
      <div className="px-4 pb-28 pt-2.5">

        {/* ─── History ─── */}
        {tab === "home" && (
          <div>
            {Object.keys(grouped).length === 0 && (
              <div className="py-10 text-center text-slate-400">
                <p className="mb-2 text-4xl">📝</p>まだ記録がありません
              </div>
            )}
            {Object.entries(grouped).map(([date, items]) => (
              <div key={date} className="mb-3.5">
                <div className="mb-1.5 flex justify-between px-0.5">
                  <span className="text-[11px] font-semibold text-slate-400">{formatDate(date)}</span>
                  <span className="text-[11px] text-slate-400">
                    {formatYen(items.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0))}
                  </span>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  {items.map((entry, idx) => {
                    const cat = ALL_CATS.find((c) => c.id === entry.cat) || ALL_CATS[ALL_CATS.length - 1];
                    const mem = MEMBERS.find((m) => m.id === entry.member);
                    const isInc = entry.type === "income";
                    return (
                      <div
                        key={entry.id}
                        className={`flex items-center px-3.5 py-2.5 ${idx < items.length - 1 ? "border-b border-slate-50" : ""}`}
                      >
                        <div
                          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] text-[17px]"
                          style={{ background: cat.color + "14" }}
                        >
                          {cat.icon}
                        </div>
                        <div className="ml-2.5 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-[13px] font-medium text-slate-900">{entry.note}</span>
                            {mem && (
                              <span
                                className="flex-shrink-0 rounded-md px-1.5 py-px text-[9px] font-semibold"
                                style={{ background: mem.color + "14", color: mem.color }}
                              >
                                {mem.avatar}
                              </span>
                            )}
                          </div>
                          <p className="mt-px text-[10px] text-slate-400">{cat.label}</p>
                        </div>
                        <span className={`flex-shrink-0 text-sm font-bold ${isInc ? "text-emerald-500" : "text-slate-900"}`}>
                          {isInc ? "+" : "-"}{formatYen(entry.amount)}
                        </span>
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          className="ml-1.5 text-slate-200 transition-colors hover:text-red-400"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── Stats ─── */}
        {tab === "stats" && (
          <div>
            <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">月次推移</span>
                <div className="flex gap-3 text-[10px]">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-sm bg-blue-500" />収入
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-sm bg-red-500" />支出
                  </span>
                </div>
              </div>
              <BarChart data={monthlyData} height={120} />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="mb-3.5 text-sm font-bold text-slate-900">カテゴリ内訳</p>
              <div className="mb-4 flex justify-center">
                <RingChart segments={expByCat} total={totalExpense} />
              </div>
              {expByCat.map((cat, i) => (
                <div key={cat.id} className={`flex items-center py-2.5 ${i > 0 ? "border-t border-slate-50" : ""}`}>
                  <div
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[9px] text-[15px]"
                    style={{ background: cat.color + "14" }}
                  >
                    {cat.icon}
                  </div>
                  <div className="ml-2.5 flex-1">
                    <div className="mb-1 flex justify-between">
                      <span className="text-xs font-medium text-slate-900">{cat.label}</span>
                      <span className="text-xs font-bold text-slate-900">{formatYen(cat.amount)}</span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ background: cat.color, width: `${(cat.amount / (expByCat[0]?.amount || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="ml-2.5 w-8 text-right text-[11px] text-slate-400">
                    {totalExpense ? Math.round((cat.amount / totalExpense) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Family ─── */}
        {tab === "family" && (
          <div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="mb-3.5 text-sm font-bold text-slate-900">メンバー別</p>
              {memberTotals.map((m, i) => {
                const mpct = totalExpense ? Math.round((m.expense / totalExpense) * 100) : 0;
                return (
                  <div key={m.id} className={`py-3.5 ${i > 0 ? "border-t border-slate-50" : ""}`}>
                    <div className="mb-2.5 flex items-center">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
                        style={{ background: m.color + "14" }}
                      >
                        {m.avatar}
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-semibold text-slate-900">{m.name}</p>
                        <p className="text-[11px] text-slate-400">支出の{mpct}%</p>
                      </div>
                    </div>
                    <div className="ml-[52px] flex gap-2">
                      {m.income > 0 && (
                        <div className="flex-1 rounded-xl bg-emerald-50 px-3 py-2">
                          <p className="text-[9px] font-semibold text-emerald-500">収入</p>
                          <p className="mt-0.5 text-sm font-bold text-emerald-700">+{formatYen(m.income)}</p>
                        </div>
                      )}
                      {m.expense > 0 && (
                        <div className="flex-1 rounded-xl bg-red-50 px-3 py-2">
                          <p className="text-[9px] font-semibold text-red-500">支出</p>
                          <p className="mt-0.5 text-sm font-bold text-red-700">-{formatYen(m.expense)}</p>
                        </div>
                      )}
                      {m.income === 0 && m.expense === 0 && (
                        <div className="flex-1 rounded-xl bg-slate-50 px-3 py-2">
                          <p className="text-[11px] text-slate-400">記録なし</p>
                        </div>
                      )}
                    </div>
                    {m.expense > 0 && (
                      <div className="ml-[52px] mt-1.5 flex h-1 overflow-hidden rounded-full bg-slate-100">
                        {EXPENSE_CATS.map((cat) => {
                          const amt = thisMonth
                            .filter((e) => e.type === "expense" && e.member === m.id && e.cat === cat.id)
                            .reduce((s, e) => s + e.amount, 0);
                          return amt > 0 ? (
                            <div
                              key={cat.id}
                              className="transition-all duration-500"
                              style={{ width: `${(amt / m.expense) * 100}%`, background: cat.color }}
                            />
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-3 rounded-2xl border border-dashed border-blue-300 bg-blue-50 px-4 py-3.5">
              <p className="mb-1 text-[13px] font-semibold text-blue-500">💡 共有のヒント</p>
              <p className="text-xs leading-relaxed text-slate-500">
                家族メンバーごとに記録すると、誰がいくら使ったか一目でわかります。「家族共通」は家賃や光熱費など共同の支出に。
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ═══ FAB ═══ */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-16 left-1/2 z-10 flex h-[52px] w-[52px] -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-500 shadow-lg shadow-blue-500/30 transition-transform hover:scale-110 active:scale-95"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* ═══ Modal ═══ */}
      {showModal && <AddModal onAdd={addEntry} onClose={() => setShowModal(false)} />}

      {/* ═══ Toast ═══ */}
      {toast && (
        <div className="animate-fade-in fixed left-1/2 top-4 z-[300] -translate-x-1/2 rounded-xl bg-slate-900 px-5 py-2.5 text-[13px] font-semibold text-white shadow-xl">
          {toast}
        </div>
      )}

      {/* ═══ Footer ═══ */}
      <footer className="fixed bottom-0 left-1/2 z-[5] w-full max-w-[420px] -translate-x-1/2 border-t border-slate-200 bg-white py-1.5 text-center">
        <a
          href="https://appori.app"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[9px] text-slate-400 transition-colors hover:text-blue-500"
        >
          © 2026 Appori — appori.app
        </a>
      </footer>
    </div>
  );
}
