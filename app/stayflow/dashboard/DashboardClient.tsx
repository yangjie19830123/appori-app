"use client"

import Link from "next/link"

interface Props {
  stats: { monthRevenue: number; checkinToday: number; checkoutToday: number; cleaningPending: number }
  properties: any[]
  recentOrders: any[]
  expiringContracts: any[]
  lowSupplies: any[]
  events: any[]
}

const seasonColor: Record<string, string> = {
  super_peak: "var(--sf-amber3)",
  peak:       "var(--sf-sakura3)",
  off_peak:   "var(--sf-blue2)",
}
const seasonTag: Record<string, string> = {
  super_peak: "sf-tag-amber",
  peak:       "sf-tag-sakura",
  off_peak:   "sf-tag-blue",
}
const seasonLabel: Record<string, string> = {
  super_peak: "最旺シーズン",
  peak:       "旺シーズン",
  off_peak:   "閑散期",
}

export default function DashboardClient({ stats, properties, recentOrders, expiringContracts, lowSupplies, events }: Props) {
  const fmt = (n: number) => "¥" + n.toLocaleString()

  return (
    <div>
      {/* Stats */}
      <div className="sf-grid4" style={{ marginBottom: 20 }}>
        <div className="sf-stat">
          <div className="sf-stat-label">今月の売上</div>
          <div className="sf-stat-value">{fmt(stats.monthRevenue)}</div>
        </div>
        <div className="sf-stat">
          <div className="sf-stat-label">本日チェックイン</div>
          <div className="sf-stat-value sf-up">{stats.checkinToday}件</div>
        </div>
        <div className="sf-stat">
          <div className="sf-stat-label">本日チェックアウト</div>
          <div className="sf-stat-value" style={{ color: "var(--sf-amber3)" }}>{stats.checkoutToday}件</div>
        </div>
        <div className="sf-stat">
          <div className="sf-stat-label">清掃待ち</div>
          <div className="sf-stat-value" style={{ color: stats.cleaningPending > 0 ? "var(--sf-red2)" : "var(--sf-ink)" }}>
            {stats.cleaningPending}件
          </div>
        </div>
      </div>

      <div className="sf-grid2" style={{ marginBottom: 20 }}>
        {/* Recent orders */}
        <div className="sf-card">
          <div className="sf-sec-head">
            <div className="sf-sec-title">直近の予約</div>
            <Link href="/stayflow/orders" className="sf-sec-link">すべて見る →</Link>
          </div>
          {recentOrders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: "var(--sf-ink3)", fontSize: 13 }}>予約データなし</div>
          ) : (
            <div className="sf-table-wrap">
              <table className="sf-table">
                <thead><tr><th>チェックイン</th><th>泊数</th><th>金額</th><th>プラットフォーム</th><th>状態</th></tr></thead>
                <tbody>
                  {recentOrders.map(o => {
                    const nights = Math.ceil((new Date(o.checkout_date).getTime() - new Date(o.checkin_date).getTime()) / 86400000)
                    return (
                      <tr key={o.id}>
                        <td>{o.checkin_date}</td>
                        <td>{nights}泊</td>
                        <td style={{ fontWeight: 500 }}>{fmt(Number(o.amount))}</td>
                        <td><span className={`sf-tag ${o.platform === "booking" ? "sf-tag-blue" : "sf-tag-green"}`}>{o.platform}</span></td>
                        <td><span className={`sf-tag ${o.status === "confirmed" ? "sf-tag-green" : o.status === "cancelled" ? "sf-tag-red" : "sf-tag-amber"}`}>{o.status}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Alerts */}
        <div className="sf-card">
          <div className="sf-sec-head">
            <div className="sf-sec-title">通知・アラート</div>
            <Link href="/stayflow/reminders" className="sf-sec-link">すべて見る →</Link>
          </div>

          {expiringContracts.map(c => {
            const days = Math.ceil((new Date(c.end_date).getTime() - Date.now()) / 86400000)
            return (
              <div className="sf-reminder" key={c.id}>
                <div className="sf-reminder-dot" style={{ background: days <= 7 ? "var(--sf-red2)" : "var(--sf-amber2)" }} />
                <div>
                  <div className="sf-reminder-title">契約期限間近: {c.company_name}</div>
                  <div className="sf-reminder-date">{c.end_date} まで（残り{days}日）</div>
                </div>
              </div>
            )
          })}

          {lowSupplies.map(s => (
            <div className="sf-reminder" key={s.item_name}>
              <div className="sf-reminder-dot" style={{ background: "var(--sf-amber2)" }} />
              <div>
                <div className="sf-reminder-title">消耗品補充推奨: {s.item_name}</div>
                <div className="sf-reminder-date">現在 {s.current_stock}{s.unit ?? ""} / 警告基準 {s.warning_level}</div>
              </div>
            </div>
          ))}

          {expiringContracts.length === 0 && lowSupplies.length === 0 && (
            <div style={{ textAlign: "center", padding: "24px 0", color: "var(--sf-ink3)", fontSize: 13 }}>現在アラートなし ✓</div>
          )}
        </div>
      </div>

      {/* Properties + Events */}
      <div className="sf-grid2">
        <div className="sf-card">
          <div className="sf-sec-head">
            <div className="sf-sec-title">物件一覧</div>
            <Link href="/stayflow/properties" className="sf-sec-link">管理する →</Link>
          </div>
          {properties.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: "var(--sf-ink3)", fontSize: 13 }}>
              物件が登録されていません
              <div style={{ marginTop: 10 }}>
                <Link href="/stayflow/properties" className="sf-btn sf-btn-primary" style={{ fontSize: 12 }}>＋ 物件を追加</Link>
              </div>
            </div>
          ) : (
            properties.map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "0.5px solid var(--sf-bg3)" }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "var(--sf-ink3)", marginTop: 2 }}>
                    {(p.platform ?? []).map((pl: string) => pl).join(" · ")}
                  </div>
                </div>
                <span className={`sf-tag ${p.ownership === "owned" ? "sf-tag-green" : "sf-tag-amber"}`}>
                  {p.ownership === "owned" ? "自有" : "賃貸"}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="sf-card">
          <div className="sf-sec-head">
            <div className="sf-sec-title">観光イベントカレンダー</div>
            <Link href="/stayflow/reminders" className="sf-sec-link">詳細 →</Link>
          </div>
          {events.map(e => (
            <div key={e.id} className="sf-card-sm" style={{ marginBottom: 8, borderLeft: `3px solid ${seasonColor[e.season_type ?? ""] ?? "var(--sf-ink4)"}`, borderRadius: "0 8px 8px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{e.title}</div>
                  <div style={{ fontSize: 11, color: "var(--sf-ink3)", marginTop: 2 }}>{e.start_date} 〜 {e.end_date ?? ""}</div>
                </div>
                {e.season_type && (
                  <span className={`sf-tag ${seasonTag[e.season_type]}`}>{seasonLabel[e.season_type]}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}