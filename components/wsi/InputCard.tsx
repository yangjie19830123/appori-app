"use client";

import { useEffect, useRef } from "react";
import type { CountryConfig } from "@/lib/wsi/types";
import { formatWageCompact } from "@/lib/wsi/countries";
import { localToCny, formatCny, type FXRates } from "@/lib/wsi/rates";

type Props = {
  country: CountryConfig;
  hourlyWage: number;
  weeklyHours: number;
  isStudent: boolean;
  rates: FXRates;
  onWageChange: (v: number) => void;
  onHoursChange: (v: number) => void;
  onStudentChange: (v: boolean) => void;
  onSubmit: () => void;
};

export default function InputCard({
  country,
  hourlyWage,
  weeklyHours,
  isStudent,
  rates,
  onWageChange,
  onHoursChange,
  onStudentChange,
  onSubmit,
}: Props) {
  const hoursRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (hoursRef.current) {
      const pct = (weeklyHours / 60) * 100;
      hoursRef.current.style.setProperty("--progress", `${pct}%`);
      hoursRef.current.style.setProperty("--accent", country.accentColor);
    }
  }, [weeklyHours, country.accentColor]);

  const wagePresets = [country.minWage, country.goodWage, country.topWage];
  const isWageBelowMin = hourlyWage > 0 && hourlyWage < country.minWage;
  const wageCny = hourlyWage > 0 ? localToCny(hourlyWage, country.code, rates) : 0;

  return (
    <div className="rounded-3xl bg-white border-[3px] border-ink shadow-stamp-lg p-6 space-y-6 animate-fade-up relative overflow-hidden">
      {/* Decorative country tape */}
      <div
        className="absolute -top-2 -right-3 px-3 py-1 border-[3px] border-ink shadow-stamp-sm rotate-6 font-display text-xs whitespace-nowrap"
        style={{ background: country.accentColor }}
      >
        {country.emoji} {country.name}
      </div>

      {/* 时薪 */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <label className="text-sm font-bold text-ink">⚡ 时薪</label>
          <span className="text-[11px] text-ink-mute">
            最低 <span className="font-mono font-bold">{formatWageCompact(country.minWage, country)}</span>
          </span>
        </div>

        {/* 用 flex 替代 absolute，多字符货币（HK$/A$）也不会挤 */}
        <div className="flex items-center bg-cream-100 rounded-2xl border-[3px] border-ink shadow-stamp-sm focus-within:bg-pop-yellow focus-within:shadow-stamp transition px-4">
          <span className="text-2xl font-display text-ink-mute mr-2 flex-shrink-0">
            {country.currencySymbol}
          </span>
          <input
            type="number"
            inputMode="decimal"
            value={hourlyWage || ""}
            onChange={(e) => onWageChange(Number(e.target.value) || 0)}
            placeholder={String(country.defaultWage)}
            className="flex-1 min-w-0 py-4 text-3xl font-display tracking-wide bg-transparent focus:outline-none placeholder:text-ink-mute/50"
          />
          {wageCny > 0 && (
            <span className="text-[11px] text-ink-mute font-medium flex-shrink-0 ml-2">
              ≈ {formatCny(wageCny)}
            </span>
          )}
        </div>

        {isWageBelowMin && (
          <div className="mt-2 text-xs text-country-jp font-bold animate-shake">
            ⚠️ 低于{country.name}最低时薪
          </div>
        )}

        {/* Wage chips */}
        <div className="mt-3 flex flex-wrap gap-2">
          {wagePresets.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onWageChange(v)}
              className={`press-stamp px-3.5 py-1.5 rounded-full text-xs font-bold border-2 border-ink transition ${
                hourlyWage === v
                  ? "shadow-stamp-sm"
                  : "bg-white shadow-stamp-sm hover:bg-cream-100"
              }`}
              style={hourlyWage === v ? { background: country.accentColor } : undefined}
            >
              {formatWageCompact(v, country)}
            </button>
          ))}
        </div>
      </div>

      {/* 周工时 */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <label className="text-sm font-bold text-ink">⏱ 每周工时</label>
          <span className="font-display text-2xl text-ink leading-none">
            {weeklyHours}<span className="text-ink-mute text-sm font-sans ml-1">h</span>
          </span>
        </div>
        <input
          ref={hoursRef}
          type="range"
          min={0}
          max={60}
          step={1}
          value={weeklyHours}
          onChange={(e) => onHoursChange(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between mt-2 text-[10px] text-ink-mute font-mono">
          <span>0h</span>
          {isStudent && (
            <span
              className="font-bold"
              style={{ color: weeklyHours > country.studentHourLimit ? "#FF6B6B" : "#1A1A1A" }}
            >
              ↑ {country.studentHourLimit}h 学生上限
            </span>
          )}
          <span>60h</span>
        </div>
      </div>

      {/* 留学生身份 */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-cream-100 border-[3px] border-ink shadow-stamp-sm">
        <div className="min-w-0 mr-3">
          <div className="text-sm font-bold text-ink">🎓 留学生身份</div>
          <div className="text-[11px] text-ink-mute mt-0.5 leading-snug">{country.studentHourNote}</div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isStudent}
          onClick={() => onStudentChange(!isStudent)}
          className={`relative w-14 h-8 rounded-full border-[3px] border-ink transition-colors flex-shrink-0 ${
            isStudent ? "" : "bg-white"
          }`}
          style={isStudent ? { background: country.accentColor } : undefined}
        >
          <span
            className="absolute w-5 h-5 bg-white rounded-full border-2 border-ink transition-transform duration-200"
            style={{
              top: "50%",
              left: "2px",
              transform: `translateY(-50%) translateX(${isStudent ? "26px" : "0px"})`,
            }}
          />
        </button>
      </div>

      {/* 提交 */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={!hourlyWage || !weeklyHours}
        className="press-stamp w-full py-4 rounded-2xl bg-ink text-cream-100 font-display text-lg shadow-stamp disabled:opacity-40 disabled:shadow-stamp-sm transition"
      >
        测一下我的 WSI →
      </button>
    </div>
  );
}
