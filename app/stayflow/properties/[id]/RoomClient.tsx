"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import type { Property, Room } from "@/lib/stayflow-types"

const statusTag:   Record<string, string> = { active: "sf-tag-green", maintenance: "sf-tag-amber", inactive: "sf-tag-gray" }
const statusLabel: Record<string, string> = { active: "稼働中", maintenance: "メンテ中", inactive: "停止中" }

const emptyForm = { room_number: "", floor_plan: "", area_sqm: "", capacity: 2, status: "active", description: "" }

export default function RoomClient({ property, rooms }: { property: Property; rooms: Room[] }) {
  const router = useRouter()
  const [modal, setModal]     = useState<"add" | "edit" | null>(null)
  const [editing, setEditing] = useState<Room | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [form, setForm]       = useState(emptyForm)
  const [saving, setSaving]   = useState(false)
  const [err, setErr]         = useState("")

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setErr("")
    setModal("add")
  }

  const openEdit = (r: Room) => {
    setEditing(r)
    setForm({
      room_number: r.room_number,
      floor_plan:  r.floor_plan  ?? "",
      area_sqm:    r.area_sqm?.toString() ?? "",
      capacity:    r.capacity,
      status:      r.status,
      description: r.description ?? "",
    })
    setErr("")
    setModal("edit")
  }

  const handleSave = async () => {
    if (!form.room_number.trim()) { setErr("部屋番号は必須です"); return }
    setSaving(true); setErr("")
    const supabase = createClient()
    const payload = {
      property_id: property.id,
      room_number: form.room_number.trim(),
      floor_plan:  form.floor_plan  || null,
      area_sqm:    form.area_sqm    ? Number(form.area_sqm) : null,
      capacity:    Number(form.capacity),
      status:      form.status,
      description: form.description || null,
    }
    const { error } = modal === "add"
      ? await supabase.from("stayflow_rooms").insert(payload)
      : await supabase.from("stayflow_rooms").update(payload).eq("id", editing!.id)

    if (error) { setErr(error.message); setSaving(false) }
    else { setModal(null); setSaving(false); router.refresh() }
  }

  const handleDelete = async (id: string) => {
    setSaving(true)
    const supabase = createClient()
    await supabase.from("stayflow_rooms").delete().eq("id", id)
    setDeleting(null); setSaving(false); router.refresh()
  }

  const activeCount = rooms.filter(r => r.status === "active").length

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13, color: "var(--sf-ink3)" }}>
        <Link href="/stayflow/properties" style={{ color: "var(--sf-sakura3)", textDecoration: "none" }}>物件管理</Link>
        <span>›</span>
        <span style={{ color: "var(--sf-ink)" }}>{property.name}</span>
      </div>

      {/* Property summary */}
      <div className="sf-card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{property.name}</div>
              <span className={`sf-tag ${property.ownership === "owned" ? "sf-tag-green" : "sf-tag-amber"}`}>
                {property.ownership === "owned" ? "自有" : "賃貸"}
              </span>
            </div>
            <div style={{ fontSize: 13, color: "var(--sf-ink3)", marginBottom: 8 }}>{property.address}</div>
            <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
              <span>登録部屋数: <strong>{property.total_rooms}</strong></span>
              <span>稼働中: <strong style={{ color: "var(--sf-green3)" }}>{activeCount}</strong></span>
              <span>メンテ・停止: <strong style={{ color: "var(--sf-amber3)" }}>{rooms.length - activeCount}</strong></span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {(property.platform ?? []).map((pl: string) => (
              <span key={pl} className={`sf-tag ${pl === "booking" ? "sf-tag-blue" : "sf-tag-green"}`}>{pl}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Rooms */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div className="sf-sec-title">部屋一覧（{rooms.length}室）</div>
        <button className="sf-btn sf-btn-primary" onClick={openAdd}>＋ 部屋を追加</button>
      </div>

      {rooms.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--sf-ink3)", background: "var(--sf-bg2)", borderRadius: "var(--sf-radius)", border: "0.5px solid var(--sf-ink4)" }}>
          <div style={{ fontSize: 28, marginBottom: 10, opacity: 0.3 }}>🚪</div>
          <div style={{ fontSize: 14, marginBottom: 16 }}>部屋が登録されていません</div>
          <button className="sf-btn sf-btn-primary" onClick={openAdd}>＋ 最初の部屋を追加</button>
        </div>
      ) : (
        <div className="sf-card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="sf-table-wrap">
            <table className="sf-table">
              <thead>
                <tr>
                  <th>部屋番号</th>
                  <th>間取り</th>
                  <th>面積</th>
                  <th>定員</th>
                  <th>ステータス</th>
                  <th>備考</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.room_number}</td>
                    <td>{r.floor_plan ?? "—"}</td>
                    <td>{r.area_sqm ? `${r.area_sqm}㎡` : "—"}</td>
                    <td>{r.capacity}名</td>
                    <td><span className={`sf-tag ${statusTag[r.status]}`}>{statusLabel[r.status]}</span></td>
                    <td style={{ fontSize: 12, color: "var(--sf-ink3)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.description ?? "—"}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="sf-btn sf-btn-outline" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => openEdit(r)}>編集</button>
                        <button className="sf-btn sf-btn-outline" style={{ fontSize: 11, padding: "4px 10px", color: "var(--sf-red2)" }} onClick={() => setDeleting(r.id)}>削除</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <div className="sf-modal-overlay">
          <div className="sf-modal">
            <div className="sf-modal-head">
              <div className="sf-modal-title">{modal === "add" ? "部屋を追加" : "部屋を編集"}</div>
              <button className="sf-modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="sf-modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ gridColumn: "1/-1" }}>
                  <label className="sf-label">部屋番号 *</label>
                  <input className="sf-input" value={form.room_number} onChange={e => set("room_number", e.target.value)} placeholder="例: 101号室" />
                </div>
                <div>
                  <label className="sf-label">間取り</label>
                  <input className="sf-input" value={form.floor_plan} onChange={e => set("floor_plan", e.target.value)} placeholder="例: 1K, 1LDK" />
                </div>
                <div>
                  <label className="sf-label">面積（㎡）</label>
                  <input className="sf-input" type="number" value={form.area_sqm} onChange={e => set("area_sqm", e.target.value)} placeholder="例: 25" />
                </div>
                <div>
                  <label className="sf-label">定員（名）</label>
                  <input className="sf-input" type="number" min={1} value={form.capacity} onChange={e => set("capacity", e.target.value)} />
                </div>
                <div>
                  <label className="sf-label">ステータス</label>
                  <select className="sf-select" style={{ width: "100%" }} value={form.status} onChange={e => set("status", e.target.value)}>
                    <option value="active">稼働中</option>
                    <option value="maintenance">メンテ中</option>
                    <option value="inactive">停止中</option>
                  </select>
                </div>
                <div style={{ gridColumn: "1/-1" }}>
                  <label className="sf-label">備考</label>
                  <textarea className="sf-input" rows={2} value={form.description} onChange={e => set("description", e.target.value)} style={{ resize: "vertical" }} placeholder="例: 角部屋、眺望良好" />
                </div>
              </div>
              {err && <div style={{ color: "var(--sf-red2)", fontSize: 12, marginTop: 8 }}>{err}</div>}
            </div>
            <div className="sf-modal-foot">
              <button className="sf-btn sf-btn-outline" onClick={() => setModal(null)}>キャンセル</button>
              <button className="sf-btn sf-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <span className="sf-spinner" style={{ borderTopColor: "#fff", width: 14, height: 14 }} /> : null}
                {saving ? "保存中..." : modal === "add" ? "追加する" : "更新する"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleting && (
        <div className="sf-modal-overlay">
          <div className="sf-modal" style={{ maxWidth: 360 }}>
            <div className="sf-modal-head"><div className="sf-modal-title">部屋を削除</div></div>
            <div className="sf-modal-body">
              <p style={{ fontSize: 13, color: "var(--sf-ink2)", lineHeight: 1.7 }}>
                この部屋を削除すると、関連する設備・予約データも影響を受けます。<br />本当に削除しますか？
              </p>
            </div>
            <div className="sf-modal-foot">
              <button className="sf-btn sf-btn-outline" onClick={() => setDeleting(null)}>キャンセル</button>
              <button className="sf-btn sf-btn-primary" style={{ background: "var(--sf-red2)" }}
                onClick={() => handleDelete(deleting)} disabled={saving}>
                {saving ? "削除中..." : "削除する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}