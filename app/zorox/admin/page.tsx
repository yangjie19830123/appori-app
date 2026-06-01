"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const inpS: React.CSSProperties = { width: "100%", boxSizing: "border-box" as const, padding: "12px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, color: "#0F172A", outline: "none", fontFamily: "inherit", background: "#fff" };
const lblS: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 };
const btnP: React.CSSProperties = { width: "100%", padding: "14px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#0F172A,#1E293B)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(15,23,42,0.3)" };

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data } = await supabase.from("zorox_profiles").select("role").eq("id", session.user.id).single();
        if (data?.role === "admin") {
          window.location.href = "/zorox";
          return;
        }
      }
      setChecking(false);
    });
  }, []);

  const handleLogin = async () => {
    setErr(""); setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) { setErr(error.message); setLoading(false); return; }
    if (data.user) {
      const { data: profile } = await supabase.from("zorox_profiles").select("role").eq("id", data.user.id).single();
      if (profile?.role !== "admin") {
        await supabase.auth.signOut();
        setErr("此账号无管理员权限");
        setLoading(false);
        return;
      }
      window.location.href = "/zorox";
    }
  };

  if (checking) return (
    <div style={{ minHeight: "100vh", background: "#0F172A", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#64748B", fontSize: 14 }}>加载中...</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0F172A, #1E293B)", fontFamily: "'Noto Sans JP',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 380, background: "#fff", borderRadius: 20, padding: "36px 28px", boxShadow: "0 25px 60px rgba(0,0,0,0.4)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Image src="/zoroX.png" alt="ZoroX Admin" width={56} height={56} style={{ margin: "0 auto 12px", display: "block" }} />
          <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A" }}>ZoroX Admin</div>
          <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>管理员后台登录</div>
        </div>

        {err && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#DC2626" }}>{err}</div>}

        <label style={lblS}>邮箱</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" style={{ ...inpS, marginBottom: 14 }} onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
        <label style={lblS}>密码</label>
        <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" style={{ ...inpS, marginBottom: 24 }} onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
        <button onClick={handleLogin} disabled={!email || !pass || loading} style={{ ...btnP, opacity: !email || !pass || loading ? 0.5 : 1 }}>
          {loading ? "登录中..." : "登录后台"}
        </button>

        <p style={{ fontSize: 11, color: "#CBD5E1", textAlign: "center", marginTop: 20 }}>仅限管理员使用</p>
      </div>
    </div>
  );
}
