"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import PropertyModal from "./PropertyModal"
import type { Property } from "@/lib/stayflow-types"

type PropWithRooms = Property & { stayflow_rooms: { id: string; status: string }[] }

export default function PropertiesClient({ properties }: { properties: PropWithRooms[] }) {
  const router = useRouter()
  const [modal, setModal]   = useState<"add" | "edit" | null>(null)
  const [editing, setEditing] = useState<PropWithRooms | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const openAdd  = () => { setEditing(null); setModal("add") }
  const openEdit = (p: PropWithRooms) => { setEditing(p); setModal("edit") }

  const handleDelete = async (id: string) => {
    setLoading(true)
    const supabase = createClient()
    await supabase.from("stayflow_properties").delete().eq("id", id)
    setDeleting(null)
    setLoading(false)
    router.refresh()
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <input className="sf-input" placeholder="物件名・住所で検索..." style={{ flex: 1, minWidth: 200 }} />
        <select className="sf-select">
          <option>すべての保有形態</option><option value="owned">自有</option><option value="lease">賃貸</option>
        </select>
        <button className="sf-btn sf-btn-primary" onClick={openAdd}>＋ 物件を追加</button>
      </div>

      {/* Cards */}
      <div className="sf-grid-auto" style={{ marginBottom: 28 }}>
        {properties.map(p => {
          const totalRooms  = p.total_rooms ?? 0
          const activeRooms = p.stayflow_rooms.filter(r => r.status === "active").length
          return (
            <div key={p.id} className="sf-card" style={{ padding: 0, overflow: "hidden", cursor: "pointer" }}
              onClick={() => router.push(`/stayflow/properties/${p.id}`)}>
              <div style={{ height: 120, background: p.ownership === "owned" ? "linear-gradient(135deg,#f9eef2,#f2d4e0)" : "linear-gradient(135deg,#fff8e8,#fff0d4)", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" style={{ opacity: 0.25 }}>
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                <span style={{ position: "absolute", top: 10, right: 10 }}
                  className={`sf-tag ${p.ownership === "owned" ? "sf-tag-green" : "sf-tag-amber"}`}>
                  {p.ownership === "owned" ? "自有" : "賃貸"}
                </span>
              </div>
              <div style={{ padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "var(--sf-ink3)", marginBottom: 10 }}>{p.address}</div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 11 }}>
                    <strong>{totalRooms}</strong> 部屋
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {(p.platform ?? []).map((pl: string) => (
                      <span key={pl} className={`sf-tag ${pl === "booking" ? "sf-tag-blue" : "sf-tag-green"}`} style={{ fontSize: 10 }}>{pl}</span>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }} onClick={e => e.stopPropagation()}>
                  <button className="sf-btn sf-btn-outline" style={{ fontSize: 11, flex: 1 }} onClick={() => openEdit(p)}>編集</button>
                  <button className="sf-btn sf-btn-outline" style={{ fontSize: 11, flex: 1, color: "var(--sf-red2)" }} onClick={() => setDeleting(p.id)}>削除</button>
                </div>
              </div>
            </div>
          )
        })}

        {/* Add new card */}
        <div onClick={openAdd} style={{ border: "1.5px dashed var(--sf-ink4)", borderRadius: "var(--sf-radius)", minHeight: 240, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "var(--sf-bg3)", transition: "background .15s" }}
          onMouseEnter={e => (e.currentTarget.style.background = "var(--sf-sakura)")}
          onMouseLeave={e => (e.currentTarget.style.background = "var(--sf-bg3)")}>
          <div style={{ textAlign: "center", color: "var(--sf-ink3)" }}>
            <div style={{ fontSize: 28, opacity: 0.4, marginBottom: 8 }}>＋</div>
            <div style={{ fontSize: 13 }}>新規物件を追加</div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <PropertyModal
          mode={modal}
          initialData={editing}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); router.refresh() }}
        />
      )}

      {/* Delete confirm */}
      {deleting && (
        <div className="sf-modal-overlay">
            <div className="sf-modal">
            <div className="sf-modal-head"><div className="sf-modal-title">物件を削除</div></div>
            <div className="sf-modal-body">
              <p style={{ fontSize: 13, color: "var(--sf-ink2)", lineHeight: 1.7 }}>
                この物件を削除すると、関連する部屋・設備データも削除されます。<br/>本当に削除しますか？
              </p>
            </div>
            <div className="sf-modal-foot">
              <button className="sf-btn sf-btn-outline" onClick={() => setDeleting(null)}>キャンセル</button>
              <button className="sf-btn sf-btn-primary" style={{ background: "var(--sf-red2)" }}
                onClick={() => handleDelete(deleting)} disabled={loading}>
                {loading ? "削除中..." : "削除する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}