"use client"

const seasonColor: Record<string, string> = { super_peak: "var(--sf-amber3)", peak: "var(--sf-sakura3)", off_peak: "var(--sf-blue2)" }
const seasonTag:   Record<string, string> = { super_peak: "sf-tag-amber", peak: "sf-tag-sakura", off_peak: "sf-tag-blue" }
const seasonLabel: Record<string, string> = { super_peak: "最旺シーズン", peak: "旺シーズン", off_peak: "閑散期" }

function getDays(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

export default function RemindersClient({ events, contracts }: { events: any[], contracts: any[] }) {
  const expiringContracts = contracts.filter(c => {
    const days = getDays(c.end_date)
    return days <= 60
  })

  const upcomingEvents = events.filter(e => {
    const days = getDays(e.start_date)
    return days >= -7 && days <= 60
  })

  return (
    <div className="sf-grid2">
      {/* Alerts */}
      <div>
        <div className="sf-sec-head" style={{ marginBottom: 12 }}>
          <div className="sf-sec-title">アクティブな通知</div>
        </div>

        {expiringContracts.length === 0 && (
          <div style={{ textAlign: "center", padding: "24px 0", color: "var(--sf-ink3)", fontSize: 13, background: "var(--sf-bg2)", borderRadius: "var(--sf-rsm)", border: "0.5px solid var(--sf-ink4)", marginBottom: 8 }}>
            現在アクティブな通知なし ✓
          </div>
        )}

        {expiringContracts.map(c => {
          const days = getDays(c.end_date)
          const urgent = days <= 14
          return (
            <div key={c.id} className="sf-reminder" style={{ background: urgent ? "var(--sf-red)" : "var(--sf-amber)", borderLeft: `3px solid ${urgent ? "var(--sf-red2)" : "var(--sf-amber2)"}`, borderRadius: "0 8px 8px 0" }}>
              <div className="sf-reminder-dot" style={{ background: urgent ? "var(--sf-red2)" : "var(--sf-amber2)" }} />
              <div>
                <div className="sf-reminder-title">契約期限間近: {c.company_name}</div>
                <div className="sf-reminder-date">
                  {c.stayflow_properties?.name} — {c.end_date} まで
                  （残り<strong>{days}</strong>日）
                </div>
              </div>
            </div>
          )
        })}

        {/* Upcoming events as alerts */}
        {upcomingEvents.map(e => {
          const days = getDays(e.start_date)
          const started = days < 0
          return (
            <div key={e.id} className="sf-reminder" style={{ background: "var(--sf-sakura)", borderLeft: "3px solid var(--sf-sakura3)", borderRadius: "0 8px 8px 0" }}>
              <div className="sf-reminder-dot" style={{ background: "var(--sf-sakura3)" }} />
              <div>
                <div className="sf-reminder-title">{started ? "🌸 開催中: " : "📅 もうすぐ: "}{e.title}</div>
                <div className="sf-reminder-date">
                  {e.start_date} 〜 {e.end_date ?? ""}
                  {!started && <span> （あと{days}日）</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Event calendar */}
      <div>
        <div className="sf-sec-head" style={{ marginBottom: 12 }}>
          <div className="sf-sec-title">日本観光イベントカレンダー</div>
        </div>
        {events.map(e => (
          <div key={e.id} className="sf-card-sm" style={{ marginBottom: 8, borderLeft: `3px solid ${seasonColor[e.season_type ?? ""] ?? "var(--sf-ink4)"}`, borderRadius: "0 8px 8px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{e.title}</div>
                <div style={{ fontSize: 11, color: "var(--sf-ink3)", marginTop: 2 }}>
                  {e.start_date} 〜 {e.end_date ?? ""}
                  {getDays(e.start_date) > 0 && <span style={{ marginLeft: 6, color: "var(--sf-sakura3)" }}>（あと{getDays(e.start_date)}日）</span>}
                </div>
              </div>
              {e.season_type && <span className={`sf-tag ${seasonTag[e.season_type]}`}>{seasonLabel[e.season_type]}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}