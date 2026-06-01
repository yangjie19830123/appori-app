"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const statusTag: Record<string, string> = { confirmed: "sf-tag-green", checked_in: "sf-tag-blue", checked_out: "sf-tag-gray", cancelled: "sf-tag-red" }
const statusLabel: Record<string, string> = { confirmed: "確定", checked_in: "滞在中", checked_out: "退房済", cancelled: "キャンセル" }
const cleanTag: Record<string, string> = { pending: "sf-tag-amber", scheduled: "sf-tag-blue", done: "sf-tag-green" }
const cleanLabel: Record<string, string> = { pending: "清掃待", scheduled: "予定済", done: "完了" }

export default function OrdersClient({ orders, properties, rooms, stats }: { orders: any[], properties: any[], rooms: any[], stats: any }) {
  const router = useRouter()
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterProp, setFilterProp] = useState("")
  const [form, setForm] = useState({
    property_id: "", room_id: "", platform: "booking",
    checkin_date: "", checkout_date: "", guests: 1, amount: "", status: "confirmed",
    cleaning_status: "pending", notes: "", external_id: ""
  })
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const filteredRooms = rooms.filter(r => !form.property_id || r.property_id === form.property_id)
  const filteredOrders = orders.filter(o => !filterProp || o.property_id === filterProp)

  const saveOrder = async () => {
    if (!form.room_id || !form.checkin_date || !form.checkout_date || !form.amount) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from("stayflow_orders").insert({ ...form, guests: Number(form.guests), amount: Number(form.amount) })
    setSaving(false); setModal(false); router.refresh()
  }

  const updateCleaning = async (id: string, status: string) => {
    const supabase = createClient()
    await supabase.from("stayflow_orders").update({ cleaning_status: status }).eq("id", id)
    router.refresh()
  }

  return (
    <div>
      {/* Stats */}
      <div className="sf-grid4" style={{ marginBottom: 20 }}>
        {[
          { label: "総予約数", value: `${stats.monthTotal}件` },
          { label: "本日チェックイン", value: `${stats.checkinToday}件`, color: "var(--sf-green3)" },
          { label: "本日チェックアウト", value: `${stats.checkoutToday}件`, color: "var(--sf-amber3)" },
          { label: "清掃待ち", value: `${stats.cleaningPending}件`, color: stats.cleaningPending > 0 ? "var(--sf-red2)" : undefined },
        ].map((s, i) => (
          <div className="sf-stat" key={i}>
            <div className="sf-stat-label">{s.label}</div>
            <div className="sf-stat-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <select className="sf-select" value={filterProp} onChange={e => setFilterProp(e.target.value)}>
          <option value="">全物件</option>
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <button className="sf-btn sf-btn-outline" style={{ fontSize: 12 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          CSVインポート
        </button>
        <button className="sf-btn sf-btn-primary" onClick={() => setModal(true)}>＋ 予約を追加</button>
      </div>

      {/* Table */}
      <div className="sf-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="sf-table-wrap">
          <table className="sf-table">
            <thead>
              <tr><th>物件・部屋</th><th>チェックイン</th><th>チェックアウト</th><th>泊数</th><th>金額</th><th>プラットフォーム</th><th>ステータス</th><th>清掃</th></tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 32, color: "var(--sf-ink3)" }}>予約データなし</td></tr>
              ) : filteredOrders.map(o => {
                const nights = Math.ceil((new Date(o.checkout_date).getTime() - new Date(o.checkin_date).getTime()) / 86400000)
                return (
                  <tr key={o.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{o.stayflow_properties?.name}</div>
                      <div style={{ fontSize: 11, color: "var(--sf-ink3)" }}>{o.stayflow_rooms?.room_number}</div>
                    </td>
                    <td>{o.checkin_date}</td>
                    <td>{o.checkout_date}</td>
                    <td>{nights}泊</td>
                    <td style={{ fontWeight: 500 }}>¥{Number(o.amount).toLocaleString()}</td>
                    <td><span className={`sf-tag ${o.platform === "booking" ? "sf-tag-blue" : "sf-tag-green"}`}>{o.platform}</span></td>
                    <td><span className={`sf-tag ${statusTag[o.status]}`}>{statusLabel[o.status]}</span></td>
                    <td>
                      <select className="sf-select" style={{ fontSize: 11, padding: "3px 6px" }}
                        value={o.cleaning_status} onChange={e => updateCleaning(o.id, e.target.value)}>
                        <option value="pending">清掃待</option>
                        <option value="scheduled">予定済</option>
                        <option value="done">完了</option>
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 予約追加Modal */}
      {modal && (
        <div className="sf-modal-overlay">
            <div className="sf-modal">
            <div className="sf-modal-head">
              <div className="sf-modal-title">予約を追加</div>
              <button className="sf-modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="sf-modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="sf-label">物件 *</label>
                  <select className="sf-select" style={{ width: "100%" }} value={form.property_id} onChange={e => { set("property_id", e.target.value); set("room_id", "") }}>
                    <option value="">選択</option>
                    {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="sf-label">部屋 *</label>
                  <select className="sf-select" style={{ width: "100%" }} value={form.room_id} onChange={e => set("room_id", e.target.value)}>
                    <option value="">選択</option>
                    {filteredRooms.map(r => <option key={r.id} value={r.id}>{r.room_number}</option>)}
                  </select>
                </div>
                <div>
                  <label className="sf-label">チェックイン *</label>
                  <input className="sf-input" type="date" value={form.checkin_date} onChange={e => set("checkin_date", e.target.value)} />
                </div>
                <div>
                  <label className="sf-label">チェックアウト *</label>
                  <input className="sf-input" type="date" value={form.checkout_date} onChange={e => set("checkout_date", e.target.value)} />
                </div>
                <div>
                  <label className="sf-label">プラットフォーム</label>
                  <select className="sf-select" style={{ width: "100%" }} value={form.platform} onChange={e => set("platform", e.target.value)}>
                    <option value="booking">Booking</option>
                    <option value="airbnb">Airbnb</option>
                    <option value="direct">直接予約</option>
                    <option value="other">その他</option>
                  </select>
                </div>
                <div>
                  <label className="sf-label">人数</label>
                  <input className="sf-input" type="number" min={1} value={form.guests} onChange={e => set("guests", e.target.value)} />
                </div>
                <div>
                  <label className="sf-label">金額（円） *</label>
                  <input className="sf-input" type="number" value={form.amount} onChange={e => set("amount", e.target.value)} placeholder="例: 32000" />
                </div>
                <div>
                  <label className="sf-label">外部予約ID</label>
                  <input className="sf-input" value={form.external_id} onChange={e => set("external_id", e.target.value)} placeholder="Booking/Airbnb ID" />
                </div>
              </div>
            </div>
            <div className="sf-modal-foot">
              <button className="sf-btn sf-btn-outline" onClick={() => setModal(false)}>キャンセル</button>
              <button className="sf-btn sf-btn-primary" onClick={saveOrder} disabled={saving}>
                {saving ? "保存中..." : "追加する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}