"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const statusTag: Record<string, string> = {
  normal: "sf-tag-green", needs_check: "sf-tag-amber", broken: "sf-tag-red", disposed: "sf-tag-gray"
}
const statusLabel: Record<string, string> = {
  normal: "正常", needs_check: "要確認", broken: "故障", disposed: "廃棄"
}

export default function EquipmentClient({ equipment, supplies, properties }: { equipment: any[], supplies: any[], properties: any[] }) {
  const router = useRouter()
  const [tab, setTab] = useState<"equipment" | "supplies">("equipment")
  const [modal, setModal] = useState(false)
  const [supplyModal, setSupplyModal] = useState(false)
  const [form, setForm] = useState({ property_id: "", name: "", brand: "", model_number: "", status: "normal", notes: "" })
  const [supplyForm, setSupplyForm] = useState({ property_id: "", item_name: "", unit: "本", current_stock: 0, warning_level: 10 })
  const [saving, setSaving] = useState(false)

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const setSup = (k: string, v: any) => setSupplyForm(f => ({ ...f, [k]: v }))

  const saveEquipment = async () => {
    if (!form.name || !form.property_id) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from("stayflow_equipment").insert(form)
    setSaving(false); setModal(false); router.refresh()
  }

  const saveSupply = async () => {
    if (!supplyForm.item_name || !supplyForm.property_id) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from("stayflow_supply_inventory").upsert({ ...supplyForm, current_stock: Number(supplyForm.current_stock), warning_level: Number(supplyForm.warning_level) }, { onConflict: "property_id,item_name" })
    setSaving(false); setSupplyModal(false); router.refresh()
  }

  const lowSupplies = supplies.filter(s => s.current_stock <= s.warning_level)

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {(["equipment", "supplies"] as const).map(t => (
          <button key={t} className={`sf-btn ${tab === t ? "" : "sf-btn-outline"}`}
            style={tab === t ? { background: "var(--sf-sakura)", color: "var(--sf-sakura4)", border: "0.5px solid var(--sf-sakura2)" } : {}}
            onClick={() => setTab(t)}>
            {t === "equipment" ? "家電設備" : "消耗品在庫"}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button className="sf-btn sf-btn-primary" onClick={() => tab === "equipment" ? setModal(true) : setSupplyModal(true)}>
          ＋ {tab === "equipment" ? "設備を登録" : "消耗品を追加"}
        </button>
      </div>

      {tab === "equipment" && (
        <div className="sf-card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="sf-table-wrap">
            <table className="sf-table">
              <thead><tr><th>設備名</th><th>物件</th><th>ブランド</th><th>型番</th><th>ステータス</th></tr></thead>
              <tbody>
                {equipment.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: 32, color: "var(--sf-ink3)" }}>設備が登録されていません</td></tr>
                ) : equipment.map(e => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 500 }}>{e.name}</td>
                    <td style={{ fontSize: 12, color: "var(--sf-ink2)" }}>{e.stayflow_properties?.name}{e.stayflow_rooms ? ` · ${e.stayflow_rooms.room_number}` : ""}</td>
                    <td style={{ fontSize: 12 }}>{e.brand ?? "—"}</td>
                    <td style={{ fontSize: 12, fontFamily: "monospace" }}>{e.model_number ?? "—"}</td>
                    <td><span className={`sf-tag ${statusTag[e.status]}`}>{statusLabel[e.status]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "supplies" && (
        <div className="sf-grid2">
          <div className="sf-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "0.5px solid var(--sf-ink4)" }}>
              <div className="sf-sec-title">消耗品在庫一覧</div>
            </div>
            <div className="sf-table-wrap">
              <table className="sf-table">
                <thead><tr><th>品目</th><th>物件</th><th>在庫</th><th>警告基準</th><th>状態</th></tr></thead>
                <tbody>
                  {supplies.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: "center", padding: 32, color: "var(--sf-ink3)" }}>消耗品が登録されていません</td></tr>
                  ) : supplies.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 500 }}>{s.item_name}</td>
                      <td style={{ fontSize: 12 }}>{s.stayflow_properties?.name}</td>
                      <td>{s.current_stock}{s.unit}</td>
                      <td style={{ fontSize: 12, color: "var(--sf-ink3)" }}>{s.warning_level}{s.unit}</td>
                      <td><span className={`sf-tag ${s.current_stock <= s.warning_level ? "sf-tag-red" : "sf-tag-green"}`}>{s.current_stock <= s.warning_level ? "要補充" : "正常"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="sf-card">
            <div className="sf-sec-head"><div className="sf-sec-title">補充が必要な品目</div></div>
            {lowSupplies.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: "var(--sf-ink3)", fontSize: 13 }}>補充が必要な品目なし ✓</div>
            ) : lowSupplies.map(s => (
              <div key={s.id} className="sf-reminder">
                <div className="sf-reminder-dot" style={{ background: "var(--sf-red2)" }} />
                <div>
                  <div className="sf-reminder-title">{s.item_name}</div>
                  <div className="sf-reminder-date">{s.stayflow_properties?.name} — 残り {s.current_stock}{s.unit}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 設備追加Modal */}
      {modal && (
        <div className="sf-modal-overlay">
            <div className="sf-modal">
            <div className="sf-modal-head">
              <div className="sf-modal-title">設備を登録</div>
              <button className="sf-modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="sf-modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ gridColumn: "1/-1" }}>
                  <label className="sf-label">物件 *</label>
                  <select className="sf-select" style={{ width: "100%" }} value={form.property_id} onChange={e => set("property_id", e.target.value)}>
                    <option value="">選択してください</option>
                    {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: "1/-1" }}>
                  <label className="sf-label">設備名 *</label>
                  <input className="sf-input" value={form.name} onChange={e => set("name", e.target.value)} placeholder="例: 洗濯機" />
                </div>
                <div>
                  <label className="sf-label">ブランド</label>
                  <input className="sf-input" value={form.brand} onChange={e => set("brand", e.target.value)} placeholder="例: Panasonic" />
                </div>
                <div>
                  <label className="sf-label">型番</label>
                  <input className="sf-input" value={form.model_number} onChange={e => set("model_number", e.target.value)} placeholder="例: NA-FA8H3" />
                </div>
                <div>
                  <label className="sf-label">ステータス</label>
                  <select className="sf-select" style={{ width: "100%" }} value={form.status} onChange={e => set("status", e.target.value)}>
                    <option value="normal">正常</option>
                    <option value="needs_check">要確認</option>
                    <option value="broken">故障</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="sf-modal-foot">
              <button className="sf-btn sf-btn-outline" onClick={() => setModal(false)}>キャンセル</button>
              <button className="sf-btn sf-btn-primary" onClick={saveEquipment} disabled={saving}>
                {saving ? "保存中..." : "登録する"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 消耗品追加Modal */}
      {supplyModal && (
        <div className="sf-modal-overlay" onClick={() => setSupplyModal(false)}>
          <div className="sf-modal" onClick={e => e.stopPropagation()}>
            <div className="sf-modal-head">
              <div className="sf-modal-title">消耗品を追加</div>
              <button className="sf-modal-close" onClick={() => setSupplyModal(false)}>✕</button>
            </div>
            <div className="sf-modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ gridColumn: "1/-1" }}>
                  <label className="sf-label">物件 *</label>
                  <select className="sf-select" style={{ width: "100%" }} value={supplyForm.property_id} onChange={e => setSup("property_id", e.target.value)}>
                    <option value="">選択してください</option>
                    {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: "1/-1" }}>
                  <label className="sf-label">品目名 *</label>
                  <input className="sf-input" value={supplyForm.item_name} onChange={e => setSup("item_name", e.target.value)} placeholder="例: シャンプー" />
                </div>
                <div>
                  <label className="sf-label">単位</label>
                  <input className="sf-input" value={supplyForm.unit} onChange={e => setSup("unit", e.target.value)} placeholder="本/枚/個" />
                </div>
                <div>
                  <label className="sf-label">現在庫数</label>
                  <input className="sf-input" type="number" value={supplyForm.current_stock} onChange={e => setSup("current_stock", e.target.value)} />
                </div>
                <div>
                  <label className="sf-label">警告基準数</label>
                  <input className="sf-input" type="number" value={supplyForm.warning_level} onChange={e => setSup("warning_level", e.target.value)} />
                </div>
              </div>
            </div>
            <div className="sf-modal-foot">
              <button className="sf-btn sf-btn-outline" onClick={() => setSupplyModal(false)}>キャンセル</button>
              <button className="sf-btn sf-btn-primary" onClick={saveSupply} disabled={saving}>
                {saving ? "保存中..." : "追加する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}