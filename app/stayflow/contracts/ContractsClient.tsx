"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const typeLabel: Record<string, string> = { equipment_full: "設備全委託", cleaning: "清掃会社", lease: "賃貸", other: "その他" }
const typeTag:   Record<string, string> = { equipment_full: "sf-tag-blue", cleaning: "sf-tag-green", lease: "sf-tag-amber", other: "sf-tag-gray" }

function getDaysUntil(dateStr: string | null) {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

export default function ContractsClient({ contracts, properties }: { contracts: any[], properties: any[] }) {
  const router = useRouter()
  const [modal, setModal] = useState(false)
  const [filter, setFilter] = useState("all")
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    contract_type: "equipment_full", company_name: "", property_id: "",
    target_rooms: "", monthly_fee: "", per_visit_fee: "",
    start_date: "", end_date: "", auto_renew: false, alert_days: 30, notes: ""
  })
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const filtered = contracts.filter(c => filter === "all" || c.contract_type === filter)

  const save = async () => {
    if (!form.company_name || !form.start_date) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from("stayflow_contracts").insert({
      ...form,
      property_id: form.property_id || null,
      monthly_fee: form.monthly_fee ? Number(form.monthly_fee) : null,
      per_visit_fee: form.per_visit_fee ? Number(form.per_visit_fee) : null,
      alert_days: Number(form.alert_days),
    })
    setSaving(false); setModal(false); router.refresh()
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {[["all","すべて"],["equipment_full","設備全委託"],["cleaning","清掃会社"],["lease","賃貸"]].map(([v, l]) => (
          <button key={v} className={`sf-btn ${filter === v ? "" : "sf-btn-outline"}`}
            style={filter === v ? { background: "var(--sf-sakura)", color: "var(--sf-sakura4)", border: "0.5px solid var(--sf-sakura2)" } : {}}
            onClick={() => setFilter(v)}>{l}</button>
        ))}
        <div style={{ flex: 1 }} />
        <button className="sf-btn sf-btn-primary" onClick={() => setModal(true)}>＋ 契約を追加</button>
      </div>

      <div className="sf-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="sf-table-wrap">
          <table className="sf-table">
            <thead><tr><th>契約名</th><th>種別</th><th>対象物件</th><th>費用</th><th>契約期間</th><th>残日数</th><th>ステータス</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "var(--sf-ink3)" }}>契約データなし</td></tr>
              ) : filtered.map(c => {
                const days = getDaysUntil(c.end_date)
                const expiring = days !== null && days <= 30 && days >= 0
                const expired  = days !== null && days < 0
                return (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{c.company_name}</div>
                      {c.target_rooms && <div style={{ fontSize: 11, color: "var(--sf-ink3)" }}>{c.target_rooms}</div>}
                    </td>
                    <td><span className={`sf-tag ${typeTag[c.contract_type]}`}>{typeLabel[c.contract_type]}</span></td>
                    <td style={{ fontSize: 12 }}>{c.stayflow_properties?.name ?? "—"}</td>
                    <td style={{ fontSize: 12 }}>
                      {c.monthly_fee ? `¥${Number(c.monthly_fee).toLocaleString()}/月` : ""}
                      {c.per_visit_fee ? `¥${Number(c.per_visit_fee).toLocaleString()}/回` : ""}
                      {!c.monthly_fee && !c.per_visit_fee ? "—" : ""}
                    </td>
                    <td style={{ fontSize: 12 }}>
                      <div>{c.start_date}</div>
                      <div style={{ color: expired ? "var(--sf-red2)" : expiring ? "var(--sf-amber3)" : "var(--sf-ink3)" }}>
                        〜 {c.end_date ?? "未定"}
                      </div>
                    </td>
                    <td>
                      {days === null ? "—" :
                        <span className={`sf-tag ${expired ? "sf-tag-red" : expiring ? "sf-tag-amber" : "sf-tag-green"}`}>
                          {expired ? "期限切れ" : `残${days}日`}
                        </span>
                      }
                    </td>
                    <td><span className={`sf-tag ${expired ? "sf-tag-red" : expiring ? "sf-tag-amber" : "sf-tag-green"}`}>
                      {expired ? "期限切れ" : expiring ? "期限間近" : "有効"}
                    </span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="sf-modal-overlay">
            <div className="sf-modal">
            <div className="sf-modal-head">
              <div className="sf-modal-title">契約を追加</div>
              <button className="sf-modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="sf-modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ gridColumn: "1/-1" }}>
                  <label className="sf-label">会社名 *</label>
                  <input className="sf-input" value={form.company_name} onChange={e => set("company_name", e.target.value)} placeholder="例: ABC設備サービス" />
                </div>
                <div>
                  <label className="sf-label">契約種別</label>
                  <select className="sf-select" style={{ width: "100%" }} value={form.contract_type} onChange={e => set("contract_type", e.target.value)}>
                    <option value="equipment_full">設備全委託</option>
                    <option value="cleaning">清掃会社</option>
                    <option value="lease">賃貸</option>
                    <option value="other">その他</option>
                  </select>
                </div>
                <div>
                  <label className="sf-label">対象物件</label>
                  <select className="sf-select" style={{ width: "100%" }} value={form.property_id} onChange={e => set("property_id", e.target.value)}>
                    <option value="">全物件 / 未指定</option>
                    {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="sf-label">月額費用（円）</label>
                  <input className="sf-input" type="number" value={form.monthly_fee} onChange={e => set("monthly_fee", e.target.value)} placeholder="例: 85000" />
                </div>
                <div>
                  <label className="sf-label">1回あたり費用（円）</label>
                  <input className="sf-input" type="number" value={form.per_visit_fee} onChange={e => set("per_visit_fee", e.target.value)} placeholder="例: 3500" />
                </div>
                <div>
                  <label className="sf-label">開始日 *</label>
                  <input className="sf-input" type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} />
                </div>
                <div>
                  <label className="sf-label">終了日</label>
                  <input className="sf-input" type="date" value={form.end_date} onChange={e => set("end_date", e.target.value)} />
                </div>
                <div>
                  <label className="sf-label">アラート（何日前）</label>
                  <input className="sf-input" type="number" value={form.alert_days} onChange={e => set("alert_days", e.target.value)} />
                </div>
                <div style={{ gridColumn: "1/-1" }}>
                  <label className="sf-label">備考</label>
                  <textarea className="sf-input" rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} style={{ resize: "vertical" }} />
                </div>
              </div>
            </div>
            <div className="sf-modal-foot">
              <button className="sf-btn sf-btn-outline" onClick={() => setModal(false)}>キャンセル</button>
              <button className="sf-btn sf-btn-primary" onClick={save} disabled={saving}>
                {saving ? "保存中..." : "追加する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}