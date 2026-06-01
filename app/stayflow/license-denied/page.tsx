"use client"

export default function LicenseDeniedPage() {
  return (
    <div className="sf-segment" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg,#fdf6f9 0%,#f0ede8 100%)" }}>
      <div style={{ width: 420, background: "#fff", borderRadius: 20, border: "0.5px solid var(--sf-ink4)", padding: 40, boxShadow: "0 4px 32px rgba(0,0,0,0.07)", textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--sf-red)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 24 }}>
          🔒
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: "var(--sf-ink)" }}>
          アクセス権限がありません
        </div>
        <div style={{ fontSize: 13, color: "var(--sf-ink3)", lineHeight: 1.8, marginBottom: 28 }}>
          このシステムへのアクセスにはライセンスが必要です。<br />
          担当者までお問い合わせください。
        </div>
        <div style={{ background: "var(--sf-bg3)", borderRadius: 10, padding: "14px 18px", fontSize: 13, color: "var(--sf-ink2)", marginBottom: 24 }}>
          お問い合わせ：<br />
          <a href="mailto:support@stayflow.jp" style={{ color: "var(--sf-sakura3)" }}>support@stayflow.jp</a>
        </div>
        <a href="/stayflow/login" style={{ display: "inline-block", padding: "10px 24px", background: "var(--sf-sakura3)", color: "#fff", borderRadius: 8, fontSize: 13, textDecoration: "none" }}>
          ログアウトして戻る
        </a>
      </div>
    </div>
  )
}