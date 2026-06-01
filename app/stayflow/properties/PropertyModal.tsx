"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface Props {
  mode: "add" | "edit"
  initialData: any
  onClose: () => void
  onSaved: () => void
}

export default function PropertyModal({ mode, initialData, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    name:          initialData?.name          ?? "",
    address:       initialData?.address       ?? "",
    prefecture:    initialData?.prefecture    ?? "東京都",
    district:      initialData?.district      ?? "",
    property_type: initialData?.property_type ?? "minpaku",
    ownership:     initialData?.ownership     ?? "owned",
    platform:      initialData?.platform      ?? [],
    total_rooms:   initialData?.total_rooms   ?? 1,
    description:   initialData?.description   ?? "",
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState("")

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const togglePlatform = (pl: string) => {
    set("platform", form.platform.includes(pl)
      ? form.platform.filter((p: string) => p !== pl)
      : [...form.platform, pl])
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.address.trim()) { setErr("物件名と住所は必須です"); return }
    setSaving(true); setErr("")
    const supabase = createClient()
    const payload = { ...form, total_rooms: Number(form.total_rooms) }

    const { error } = mode === "add"
      ? await supabase.from("stayflow_properties").insert(payload)
      : await supabase.from("stayflow_properties").update(payload).eq("id", initialData.id)

    if (error) { setErr(error.message); setSaving(false) }
    else onSaved()
  }

  return (
    <div className="sf-modal-overlay">
        <div className="sf-modal">
        <div className="sf-modal-head">
          <div className="sf-modal-title">{mode === "add" ? "物件を追加" : "物件を編集"}</div>
          <button className="sf-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="sf-modal-body">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <label className="sf-label">物件名 *</label>
              <input className="sf-input" value={form.name} onChange={e => set("name", e.target.value)} placeholder="例: 渋谷マンション" />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label className="sf-label">住所 *</label>
              <input className="sf-input" value={form.address} onChange={e => set("address", e.target.value)} placeholder="例: 東京都渋谷区桜丘町5-21" />
            </div>
            <div>
              <label className="sf-label">都道府県</label>
              <input className="sf-input" value={form.prefecture} onChange={e => set("prefecture", e.target.value)} />
            </div>
            <div>
              <label className="sf-label">区市町村</label>
              <input className="sf-input" value={form.district} onChange={e => set("district", e.target.value)} placeholder="例: 渋谷区" />
            </div>
            <div>
              <label className="sf-label">物件タイプ</label>
              <select className="sf-select" style={{ width: "100%" }} value={form.property_type} onChange={e => set("property_type", e.target.value)}>
                <option value="minpaku">民泊</option>
                <option value="hotel">ホテル</option>
                <option value="apartment">アパート</option>
              </select>
            </div>
            <div>
              <label className="sf-label">保有形態</label>
              <select className="sf-select" style={{ width: "100%" }} value={form.ownership} onChange={e => set("ownership", e.target.value)}>
                <option value="owned">自有</option>
                <option value="lease">賃貸</option>
              </select>
            </div>
            <div>
              <label className="sf-label">部屋数</label>
              <input className="sf-input" type="number" min={1} value={form.total_rooms} onChange={e => set("total_rooms", e.target.value)} />
            </div>
            <div>
              <label className="sf-label">プラットフォーム</label>
              <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
                {["booking", "airbnb"].map(pl => (
                  <label key={pl} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                    <input type="checkbox" checked={form.platform.includes(pl)} onChange={() => togglePlatform(pl)} />
                    {pl === "booking" ? "Booking" : "Airbnb"}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label className="sf-label">備考</label>
              <textarea className="sf-input" rows={2} value={form.description} onChange={e => set("description", e.target.value)} style={{ resize: "vertical" }} />
            </div>
          </div>
          {err && <div style={{ color: "var(--sf-red2)", fontSize: 12, marginTop: 4 }}>{err}</div>}
        </div>
        <div className="sf-modal-foot">
          <button className="sf-btn sf-btn-outline" onClick={onClose}>キャンセル</button>
          <button className="sf-btn sf-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <span className="sf-spinner" style={{ borderTopColor: "#fff", width: 14, height: 14 }} /> : null}
            {saving ? "保存中..." : mode === "add" ? "追加する" : "更新する"}
          </button>
        </div>
      </div>
    </div>
  )
}