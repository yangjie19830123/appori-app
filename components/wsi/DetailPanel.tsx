"use client";

import type { WSIResult, CountryConfig } from "@/lib/wsi/types";
import { localToCny, formatCny, formatRateTime, type FXRates } from "@/lib/wsi/rates";

type Props = {
  result: WSIResult;
  country: CountryConfig;
  hourlyWage: number;
  rates: FXRates;
};

export default function DetailPanel({ result, country, hourlyWage, rates }: Props) {
  const wageCny = localToCny(hourlyWage, country.code, rates);
  const monthlyCny = localToCny(result.monthlyIncome, country.code, rates);
  const annualCny = localToCny(result.annualIncome, country.code, rates);

  return (
    <div className="space-y-3 animate-fade-up">
      {/* 评分构成 */}
      <div className="rounded-2xl bg-white border-[3px] border-ink shadow-stamp p-5">
        <div className="text-xs font-display tracking-wider mb-3 flex items-center justify-between">
          <span>📊 评分构成</span>
          <span className="text-ink-mute text-[10px] font-sans">SCORE BREAKDOWN</span>
        </div>
        <BreakdownRow label="时薪水平" value={result.breakdown.wage} max={40} color={country.accentColor} />
        <BreakdownRow label="月度收入" value={result.breakdown.income} max={30} color="#FFE66D" />
        <BreakdownRow label="合规安全" value={result.breakdown.safety} max={30} color="#98E2C6" />
      </div>

      {/* 人民币换算 */}
      <div className="rounded-2xl bg-pop-mint border-[3px] border-ink shadow-stamp p-5">
        <div className="text-xs font-display tracking-wider mb-3 flex items-center justify-between">
          <span>💱 人民币换算</span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-ink text-cream-100">
            {rates.fallback ? "参考汇率" : `更新于 ${formatRateTime(rates.updatedAt)}`}
          </span>
        </div>
        <div className="space-y-2">
          <CnyRow label="时薪" cny={formatCny(wageCny)} />
          <CnyRow label="月收入" cny={formatCny(monthlyCny)} />
          <CnyRow label="年收入" cny={formatCny(annualCny)} />
        </div>
      </div>

      {/* 建议 */}
      {result.suggestions.length > 0 && (
        <div className="rounded-2xl bg-pop-yellow border-[3px] border-ink shadow-stamp p-5">
          <div className="text-xs font-display tracking-wider mb-3">💡 给你的建议</div>
          <ul className="space-y-2.5">
            {result.suggestions.map((s, i) => (
              <li key={i} className="flex gap-2.5 items-start">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-ink text-cream-100 text-xs font-display flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm text-ink leading-relaxed font-medium">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 趣味事实 */}
      <div className="rounded-2xl bg-cream-200 border-[3px] border-ink shadow-stamp p-5">
        <div className="text-xs font-display tracking-wider mb-2">🎯 {country.name}打工小知识</div>
        <p className="text-sm text-ink leading-relaxed">{country.funFact}</p>
      </div>

      <details className="rounded-2xl bg-white border-[3px] border-ink shadow-stamp p-5">
        <summary className="text-xs font-display tracking-wider cursor-pointer list-none flex items-center justify-between">
          <span>📐 计算口径</span>
          <span className="text-ink-mute">▾</span>
        </summary>
        <div className="mt-3 text-xs text-ink-soft leading-relaxed space-y-1.5">
          <p>· 月收入 = 时薪 × 周工时 × 4.33</p>
          <p>· 时薪分（40）：以{country.name}本地基准评分</p>
          <p>· 月收分（30）：归一化跨国可比</p>
          <p>· 安全分（30）：超{country.studentHourLimit}h{country.annualWall ? ` / 超${country.wallName}` : ""}扣分</p>
          <p>· 人民币：实时汇率（open.er-api.com）</p>
          <p className="text-ink-mute pt-1">仅作参考，不构成法律 / 税务建议。</p>
        </div>
      </details>
    </div>
  );
}

function BreakdownRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = (value / max) * 100;
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between text-sm mb-1.5">
        <span className="font-medium text-ink">{label}</span>
        <span className="font-display text-ink">
          {value}<span className="text-ink-mute text-xs"> / {max}</span>
        </span>
      </div>
      <div className="h-2.5 bg-cream-200 rounded-full overflow-hidden border-2 border-ink">
        <div
          className="h-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

function CnyRow({ label, cny }: { label: string; cny: string }) {
  return (
    <div className="flex items-center justify-between text-sm bg-white/70 rounded-xl px-3 py-2 border-2 border-ink">
      <span className="font-medium">{label}</span>
      <span className="font-display">{cny}</span>
    </div>
  );
}
