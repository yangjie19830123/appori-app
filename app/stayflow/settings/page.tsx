import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/stayflow/login")

  return (
    <div className="sf-grid2">
      {/* User info */}
      <div className="sf-card">
        <div className="sf-sec-head"><div className="sf-sec-title">アカウント情報</div></div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 0", borderBottom: "0.5px solid var(--sf-bg3)" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--sf-sakura2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 600, color: "var(--sf-sakura4)" }}>
            {user.email?.[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 500 }}>{user.email}</div>
            <div style={{ fontSize: 12, color: "var(--sf-ink3)", marginTop: 2 }}>管理者（全権限）</div>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          {[
            { label: "ユーザーID", value: user.id.slice(0, 8) + "..." },
            { label: "メール", value: user.email ?? "" },
            { label: "最終ログイン", value: user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString("ja-JP") : "—" },
          ].map(r => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "0.5px solid var(--sf-bg3)", fontSize: 13 }}>
              <span style={{ color: "var(--sf-ink3)" }}>{r.label}</span>
              <span style={{ fontFamily: "monospace", fontSize: 12 }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* System settings */}
      <div className="sf-card">
        <div className="sf-sec-head"><div className="sf-sec-title">システム設定</div></div>
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="sf-label">システム言語</label>
          <select className="sf-select" style={{ width: "100%" }}>
            <option>日本語</option>
            <option>中文（简体）</option>
            <option>English</option>
          </select>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label className="sf-label">タイムゾーン</label>
          <select className="sf-select" style={{ width: "100%" }}>
            <option>Asia/Tokyo (UTC+9)</option>
          </select>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label className="sf-label">契約期限アラート（何日前）</label>
          <input className="sf-input" type="number" defaultValue={30} style={{ width: 120 }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label className="sf-label">通貨</label>
          <select className="sf-select" style={{ width: "100%" }}>
            <option>JPY — 日本円</option>
          </select>
        </div>
        <button className="sf-btn sf-btn-primary">保存</button>
      </div>
    </div>
  )
}