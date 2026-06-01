// app/jp/verb/login/page.tsx
//
// Verb-tool-specific login page.
// Uses the verb tool's warm orange theme to keep visual continuity,
// but underneath calls the same Supabase magic-link API as calendar.
//
// After clicking the email link, the callback redirects the user back to /jp/verb.

"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";

function LoginInner() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam === "auth_failed" ? "認証に失敗しました。もう一度お試しください。" : null
  );

  const handleLogin = async () => {
    if (!email) return;
    setLoading(true);
    setError(null);

    // Use the existing calendar callback, but tell it to send the user back
    // to /jp/verb after auth succeeds (via the ?next= param we added).
    const { error: signInError } = await createClient().auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/calendar/api/auth/callback?next=/jp/verb`,
      },
    });

    setLoading(false);
    if (signInError) {
      setError(signInError.message || "ログインリンクの送信に失敗しました");
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        {/* ─── Header ─── */}
        <div className="text-center mb-8 v-fade-in">
          <Image
            src="/logo.png"
            alt="Appori"
            width={56}
            height={56}
            className="mx-auto mb-4 rounded-2xl"
          />
          <h1 className="v-display text-3xl text-[var(--v-ink)] mb-1 flex items-center justify-center gap-2">
            動詞マスター
            <span className="text-xl">🇯🇵</span>
          </h1>
          <p className="text-sm text-[var(--v-ink-muted)]">
            JLPT動詞を楽しく学ぼう
          </p>
        </div>

        {/* ─── Login card ─── */}
        <div
          className="bg-[var(--v-surface)] rounded-2xl p-6 border border-[var(--v-border)] shadow-sm v-fade-in"
          style={{ animationDelay: "100ms" }}
        >
          {sent ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-3">📧</div>
              <p className="font-bold text-[var(--v-ink)] mb-1.5">
                メールを送信しました
              </p>
              <p className="text-sm text-[var(--v-ink-muted)] mb-2">
                <strong className="text-[var(--v-accent)]">{email}</strong>
              </p>
              <p className="text-xs text-[var(--v-ink-faint)]">
                メールのリンクをクリックしてログイン
              </p>
              <button
                onClick={() => {
                  setSent(false);
                  setEmail("");
                }}
                className="mt-4 text-xs text-[var(--v-accent)] hover:text-[var(--v-accent-dark)] font-semibold transition"
              >
                ← 別のメールで送信
              </button>
            </div>
          ) : (
            <>
              <label className="block text-xs font-bold text-[var(--v-ink-faint)] tracking-wider uppercase mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border border-[var(--v-border)] text-sm bg-white focus:outline-none focus:border-[var(--v-accent)] focus:ring-2 focus:ring-[var(--v-accent)]/20 mb-4 transition disabled:opacity-60"
                onKeyDown={(e) => e.key === "Enter" && email && !loading && handleLogin()}
                autoFocus
              />

              {error && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  ❌ {error}
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={!email || loading}
                className="w-full py-3 rounded-xl bg-[var(--v-accent)] text-white font-bold text-sm hover:bg-[var(--v-accent-dark)] transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? "送信中..." : "ログインリンクを送信"}
              </button>

              <p className="mt-4 text-[11px] text-[var(--v-ink-faint)] text-center leading-relaxed">
                登録不要・メールにログインリンクをお送りします<br />
                学習進捗がデバイス間で同期されます
              </p>
            </>
          )}
        </div>

        {/* ─── Back link ─── */}
        <div className="text-center mt-6">
          <Link
            href="/jp/verb"
            className="text-xs text-[var(--v-ink-muted)] hover:text-[var(--v-accent)] transition"
          >
            ← 戻る (ログインなしで使う)
          </Link>
        </div>

        <p className="text-center text-[10px] text-[var(--v-ink-faint)] mt-6">
          by Appori — 暮らしをもっと便利に
        </p>
      </div>
    </div>
  );
}

export default function VerbLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LoginInner />
    </Suspense>
  );
}
