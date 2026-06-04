"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function StayFlowLogin() {
  const router  = useRouter()
  const [email, setEmail]   = useState("")
  const [step, setStep]     = useState<"input"|"sending"|"sent"|"error">("input")
  const [errMsg, setErrMsg] = useState("")

  // 已登录状态直接跳转到dashboard
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/stayflow/dashboard")
    })
  }, [])

  const handleSend = async () => {
    if (!email.trim()) return
    setStep("sending")
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${location.origin}/api/auth/callback?next=/stayflow/dashboard` },
    })
    if (error) { setErrMsg(error.message); setStep("error") }
    else setStep("sent")
  }

  return (
    <div className="sf-segment" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg,#fdf6f9 0%,#f0ede8 100%)" }}>
      <div style={{ width: 400, background: "#fff", borderRadius: 20, border: "0.5px solid var(--sf-ink4)", padding: 40, boxShadow: "0 4px 32px rgba(0,0,0,0.07)" }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div className="sf-logo-mark">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" strokeWidth="1.8">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div>
            <div className="sf-logo-text">StayFlow</div>
            <div className="sf-logo-sub">運営管理システム</div>
          </div>
        </div>

        {step === "sent" ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--sf-green)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 24, color: "var(--sf-green3)" }}>✓</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>メールを送信しました</div>
            <div style={{ fontSize: 13, color: "var(--sf-ink3)", lineHeight: 1.7 }}>
              <strong>{email}</strong> にログインリンクを送りました。<br/>メールを確認してリンクをクリックしてください。
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>ログイン</div>
            <div style={{ fontSize: 13, color: "var(--sf-ink3)", lineHeight: 1.7, marginBottom: 24 }}>
              メールアドレスを入力してください。<br/>ログインリンクをお送りします。
            </div>

            <label className="sf-label">メールアドレス</label>
            <input className="sf-input" type="email" placeholder="example@email.com"
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              disabled={step === "sending"} style={{ marginBottom: 8 }} />

            {step === "error" && (
              <div style={{ background: "var(--sf-red)", border: "0.5px solid #f0c0c4", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "var(--sf-red2)", marginBottom: 12 }}>
                {errMsg}
              </div>
            )}

            <button className="sf-btn sf-btn-primary" onClick={handleSend}
              disabled={step === "sending" || !email.trim()}
              style={{ width: "100%", marginTop: 8, justifyContent: "center", opacity: step === "sending" || !email.trim() ? 0.6 : 1 }}>
              {step === "sending" && <span className="sf-spinner" style={{ borderTopColor: "#fff", width: 14, height: 14 }} />}
              {step === "sending" ? "送信中..." : "ログインリンクを送る"}
            </button>

            <div style={{ fontSize: 11, color: "var(--sf-ink3)", textAlign: "center", marginTop: 16 }}>
              お問い合わせ: support@stayflow.jp
            </div>
          </>
        )}
      </div>
    </div>
  )
}