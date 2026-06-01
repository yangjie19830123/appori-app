"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await createClient().auth.signInWithOtp({
      email, options: { emailRedirectTo: `${window.location.origin}/calendar/api/auth/callback` },
    });
    setLoading(false);
    if (!error) setSent(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="Appori" width={56} height={56} className="mx-auto mb-4 rounded-2xl" />
          <h1 className="text-2xl font-extrabold">家族カレンダー</h1>
          <p className="text-sm text-slate-400 mt-1">家族の予定を1画面で管理</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          {sent ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">📧</div>
              <p className="font-bold mb-1">メールを送信しました</p>
              <p className="text-sm text-slate-400"><strong>{email}</strong> のリンクをクリック</p>
            </div>
          ) : (
            <>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">メールアドレス</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 mb-4"
                onKeyDown={(e) => e.key === "Enter" && email && handleLogin()} />
              <button onClick={handleLogin} disabled={!email || loading}
                className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition disabled:opacity-40">
                {loading ? "送信中..." : "ログインリンクを送信"}
              </button>
            </>
          )}
        </div>
        <p className="text-center text-[11px] text-slate-300 mt-6">by Appori — 暮らしをもっと便利に</p>
      </div>
    </div>
  );
}
