"use client";

import { useState } from "react";
import Image from "next/image";

/* ─── i18n ─── */
type Lang = "ja" | "en";

const T = {
  ja: {
    nav: { tools: "ツール一覧", values: "Apporiの特徴", contact: "お問い合わせ" },
    hero: {
      badge: "誰でも、すぐ使える、ずっと無料",
      h1_1: "毎日の「ちょっと面倒」を",
      h1_2: "サクッと解決。",
      sub: "Appori は、普通の人が一番よく使う軽量ツールを集めたプラットフォーム。仕事でも暮らしでも、ブラウザひとつで今すぐ使えます。",
      cta: "ツールを見る",
      cta2: "もっと詳しく",
    },
    stats: [
      { num: "100%", label: "無料で利用可能" },
      { num: "0", label: "広告・トラッキング" },
      { num: "4+", label: "公開中のツール" },
    ],
    section_tools: "公開中のツール",
    section_tools_sub: "登録不要、すぐに使えます",
    section_values: "Appori が大切にしていること",
    section_values_sub: "シンプルで正直なツールを、すべての人に",
    section_cta_h: "次のツールは、あなたのアイデアから",
    section_cta_sub: "「こんなツールがあったら…」を教えてください。Appori は皆さんの声から生まれます。",
    section_cta_btn: "アイデアを送る",
    footer: "すべてのツールは無料で提供しています",
    footer_copy: "© 2026 Appori. All rights reserved.",
    status_live: "公開中",
    status_dev: "開発中",
    open: "使ってみる",
    form: {
      title: "アイデアを送る",
      sub: "「こんなツールがあったら便利」を教えてください。",
      name: "お名前（任意）",
      email: "メールアドレス（任意）",
      message: "あなたのアイデア",
      placeholder: "例：毎日の体重を記録するシンプルなツールがほしい…",
      send: "送信する",
      sending: "送信中…",
      success: "ありがとうございます！アイデアを受け取りました。",
      error: "送信に失敗しました。もう一度お試しください。",
      close: "閉じる",
    },
  },
  en: {
    nav: { tools: "Tools", values: "Why Appori", contact: "Contact" },
    hero: {
      badge: "Free forever. No sign-up needed.",
      h1_1: "Tiny tools that solve",
      h1_2: "real problems.",
      sub: "Appori is a collection of lightweight web tools that anyone can use — at work, at home, on any device. No installs, no ads, just open and go.",
      cta: "Browse Tools",
      cta2: "Learn More",
    },
    stats: [
      { num: "100%", label: "Free to use" },
      { num: "0", label: "Ads or tracking" },
      { num: "4+", label: "Tools available" },
    ],
    section_tools: "Available Tools",
    section_tools_sub: "No registration required — start using right away",
    section_values: "What we believe in",
    section_values_sub: "Honest, simple tools for everyone",
    section_cta_h: "Got an idea for a tool?",
    section_cta_sub: "Tell us what small annoyance you'd love to solve. The best Appori tools come from real people's suggestions.",
    section_cta_btn: "Share your idea",
    footer: "All tools are provided free of charge",
    footer_copy: "© 2026 Appori. All rights reserved.",
    status_live: "Live",
    status_dev: "Coming Soon",
    open: "Try it",
    form: {
      title: "Share your idea",
      sub: "Tell us what tool would make your life easier.",
      name: "Name (optional)",
      email: "Email (optional)",
      message: "Your idea",
      placeholder: "e.g. I'd love a simple tool to track my daily weight…",
      send: "Send",
      sending: "Sending…",
      success: "Thank you! We received your idea.",
      error: "Failed to send. Please try again.",
      close: "Close",
    },
  },
};

const APPS_DATA = [
  {
    id: "kanji",
    icon: "あ",
    color: "#3B82F6",
    gradient: "linear-gradient(135deg, #3B82F6, #2563EB)",
    url: "/kanji",
    status: "live" as const,
    ja: {
      name: "漢字リーダー",
      tagline: "読めない漢字、もう困らない",
      desc: "写真やテキストから漢字の読み方を自動変換。仕事の書類、街の看板、子どもの教科書——どんな漢字もすぐ読める。",
      features: ["写真から漢字を自動認識", "ふりがな・ひらがな表示", "単語分解で品詞も確認"],
    },
    en: {
      name: "Kanji Reader",
      tagline: "Never struggle with kanji again",
      desc: "Instantly convert kanji to readable hiragana — from work documents, street signs, or textbooks. Just snap a photo or paste text.",
      features: ["Auto-detect kanji from photos", "Furigana & hiragana display", "Word breakdown with parts of speech"],
    },
  },
  {
    id: "calendar",
    icon: "📅",
    color: "#10B981",
    gradient: "linear-gradient(135deg, #10B981, #059669)",
    url: "/calendar",
    status: "live" as const,
    ja: {
      name: "家族カレンダー",
      tagline: "みんなの予定をひと目で",
      desc: "家族やチームの予定を1画面で管理。メンバーごとに色分けして、誰がいつ何をしているか一瞬でわかる。",
      features: ["メンバーごとに色分け表示", "今日の予定を自動まとめ", "シンプルで迷わないUI"],
    },
    en: {
      name: "Shared Calendar",
      tagline: "Everyone's schedule at a glance",
      desc: "Manage family or team schedules in one view. Color-coded members make it instantly clear who's doing what and when.",
      features: ["Color-coded per member", "Auto daily summary", "Clean, intuitive interface"],
    },
  },
  {
    id: "kakeibo",
    icon: "💰",
    color: "#F59E0B",
    gradient: "linear-gradient(135deg, #F59E0B, #D97706)",
    url: "/kakeibo",
    status: "live" as const,
    ja: {
      name: "家計簿",
      tagline: "お金の流れを見える化",
      desc: "収入・支出をサクッと記録。カテゴリ別のグラフで家計の全体像がわかる、シンプルな家計管理ツール。",
      features: ["ワンタップで収支を記録", "カテゴリ別グラフ分析", "メンバー別の支出管理"],
    },
    en: {
      name: "Budget Tracker",
      tagline: "See where your money goes",
      desc: "Log income and expenses in seconds. Category breakdowns and visual charts help you understand your spending at a glance.",
      features: ["One-tap expense logging", "Category breakdown charts", "Per-member expense tracking"],
    },
  },
  {
    id: "shift",
    icon: "⏰",
    color: "#7C3AED",
    gradient: "linear-gradient(135deg, #7C3AED, #6D28D9)",
    url: "/shift",
    status: "live" as const,
    ja: {
      name: "シフト＆給料計算",
      tagline: "バイトの収入を自動計算",
      desc: "シフトを入力するだけで日給・月給を自動計算。深夜割増や扶養上限もリアルタイムで確認できる。",
      features: ["ワンタップでシフト入力", "深夜割増の自動計算", "扶養の壁リアルタイム表示"],
    },
    en: {
      name: "Shift & Pay",
      tagline: "Auto-calculate your part-time income",
      desc: "Log your shifts and instantly see daily, weekly, and monthly earnings. Night premiums and tax thresholds calculated automatically.",
      features: ["One-tap shift logging", "Auto night premium calc", "Tax threshold alerts"],
    },
  },
  {
    id: "wsi",
    icon: "🌍",
    color: "#EF4444",
    gradient: "linear-gradient(135deg, #EF4444, #DC2626)",
    url: "/wsi",
    status: "live" as const,
    ja: {
      name: "海外バイト生存スコア",
      tagline: "海外で生きていけるか診断 — WSI",
      desc: "時給と週の労働時間を入力するだけで、6 ヶ国それぞれの生存スコアを 0-100 点で算出。S/A/B/C/D ランクとリスク警告まで一画面で。",
      features: ["6 ヶ国対応（日米英新豪韓）", "ワンタップで結果カード生成", "国別 PK バトルで対決可能"],
    },
    en: {
      name: "Work Survival Index",
      tagline: "Can you survive working abroad? — WSI",
      desc: "Enter wage and weekly hours, get a 0-100 survival score for any of 6 countries. S/A/B/C/D grading with risk alerts, all on one screen.",
      features: ["6 countries (JP/US/UK/SG/AU/KR)", "One-tap shareable result card", "Country PK battle mode"],
    },
  },
];

const VALUES_DATA = [
  {
    icon: "⚡",
    ja: { title: "登録なし、すぐ使える", desc: "アカウント作成も、アプリのインストールも不要。URLを開いたらすぐにツールが使えます。" },
    en: { title: "No sign-up required", desc: "No accounts, no app installs. Just open the URL and start using the tool immediately." },
  },
  {
    icon: "🌐",
    ja: { title: "どこでも、どのデバイスでも", desc: "スマホ・タブレット・PCすべてに対応。通勤電車でも、オフィスでも、自宅でも。" },
    en: { title: "Works everywhere", desc: "Fully responsive on phone, tablet, and desktop. Use it on the train, at the office, or at home." },
  },
  {
    icon: "🔒",
    ja: { title: "プライバシー重視", desc: "不要な個人情報は一切収集しません。あなたのデータは、あなたのものです。" },
    en: { title: "Privacy first", desc: "We collect zero unnecessary personal data. Your information belongs to you — period." },
  },
  {
    icon: "💎",
    ja: { title: "ずっと無料、広告なし", desc: "基本機能はすべて無料。広告も表示しません。誰でも安心して使えるツールを目指しています。" },
    en: { title: "Free forever, no ads", desc: "Core features are always free. No ads, no upsells. Just honest tools that work." },
  },
];

/* ─── Contact Form Modal ─── */
function ContactModal({
  open,
  onClose,
  lang,
}: {
  open: boolean;
  onClose: () => void;
  lang: Lang;
}) {
  const t = T[lang].form;
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleSend = async () => {
    if (!form.message.trim()) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus("success");
        setForm({ name: "", email: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(15,23,42,0.5)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 20,
          width: "100%",
          maxWidth: 460,
          padding: "32px 28px",
          boxShadow: "0 25px 60px rgba(0,0,0,0.15)",
          position: "relative",
        }}
      >
        {/* Close btn */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "none",
            border: "none",
            fontSize: 20,
            color: "#94A3B8",
            cursor: "pointer",
            lineHeight: 1,
          }}
        >
          ✕
        </button>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #3B82F6, #2563EB)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            A
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#0F172A" }}>{t.title}</div>
            <div style={{ fontSize: 13, color: "#64748B" }}>{t.sub}</div>
          </div>
        </div>

        {status === "success" ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "#ECFDF5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: 24,
              }}
            >
              ✓
            </div>
            <p style={{ fontSize: 15, color: "#0F172A", fontWeight: 600, marginBottom: 4 }}>
              {t.success}
            </p>
            <button
              onClick={onClose}
              style={{
                marginTop: 16,
                padding: "10px 28px",
                borderRadius: 10,
                background: "#F1F5F9",
                border: "none",
                fontSize: 13,
                fontWeight: 600,
                color: "#475569",
                cursor: "pointer",
              }}
            >
              {t.close}
            </button>
          </div>
        ) : (
          <>
            {/* Name */}
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: "#475569",
                marginBottom: 6,
              }}
            >
              {t.name}
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 14px",
                border: "1.5px solid #E2E8F0",
                borderRadius: 10,
                fontSize: 14,
                color: "#0F172A",
                outline: "none",
                marginBottom: 14,
                fontFamily: "inherit",
              }}
            />

            {/* Email */}
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: "#475569",
                marginBottom: 6,
              }}
            >
              {t.email}
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 14px",
                border: "1.5px solid #E2E8F0",
                borderRadius: 10,
                fontSize: 14,
                color: "#0F172A",
                outline: "none",
                marginBottom: 14,
                fontFamily: "inherit",
              }}
            />

            {/* Message */}
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: "#475569",
                marginBottom: 6,
              }}
            >
              {t.message} *
            </label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder={t.placeholder}
              rows={4}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 14px",
                border: "1.5px solid #E2E8F0",
                borderRadius: 10,
                fontSize: 14,
                color: "#0F172A",
                outline: "none",
                marginBottom: 18,
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />

            {status === "error" && (
              <p style={{ fontSize: 13, color: "#EF4444", marginBottom: 12 }}>{t.error}</p>
            )}

            {/* Send */}
            <button
              onClick={handleSend}
              disabled={!form.message.trim() || status === "sending"}
              style={{
                width: "100%",
                padding: "13px 0",
                borderRadius: 12,
                border: "none",
                fontSize: 15,
                fontWeight: 700,
                cursor: form.message.trim() && status !== "sending" ? "pointer" : "default",
                fontFamily: "inherit",
                background:
                  form.message.trim() && status !== "sending"
                    ? "linear-gradient(135deg, #3B82F6, #2563EB)"
                    : "#E2E8F0",
                color: form.message.trim() && status !== "sending" ? "#fff" : "#94A3B8",
                boxShadow:
                  form.message.trim() && status !== "sending"
                    ? "0 4px 16px rgba(59,130,246,0.3)"
                    : "none",
                transition: "all 0.2s",
              }}
            >
              {status === "sending" ? t.sending : t.send}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function Home() {
  const [lang, setLang] = useState<Lang>("ja");
  const [showContact, setShowContact] = useState(false);
  const t = T[lang];

  return (
    <div className="min-h-screen" style={{ background: "#F8FAFC" }}>
      {/* ─── NAV ─── */}
      <nav
        className="sticky top-0 z-50"
        style={{
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid #E2E8F0",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Appori"
              width={36}
              height={36}
              className="rounded-xl"
            />
            <span className="text-lg font-bold tracking-tight" style={{ color: "#0F172A" }}>
              Appori
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-8 text-sm" style={{ color: "#64748B" }}>
            <a href="#tools" className="hover:text-blue-600 transition-colors">
              {t.nav.tools}
            </a>
            <a href="#values" className="hover:text-blue-600 transition-colors">
              {t.nav.values}
            </a>
            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                setShowContact(true);
              }}
              className="hover:text-blue-600 transition-colors"
            >
              {t.nav.contact}
            </a>
          </div>

          {/* Lang toggle */}
          <button
            onClick={() => setLang(lang === "ja" ? "en" : "ja")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: "#EFF6FF",
              color: "#2563EB",
              border: "1px solid #BFDBFE",
            }}
          >
            {lang === "ja" ? "JA → EN" : "EN → JA"}
          </button>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(59,130,246,0.08), transparent), radial-gradient(ellipse 50% 40% at 80% 50%, rgba(59,130,246,0.05), transparent)",
          }}
        />

        <div className="max-w-6xl mx-auto px-6 pt-20 pb-16 sm:pt-28 sm:pb-24">
          <div className="max-w-3xl mx-auto text-center">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-8 animate-fade-in"
              style={{
                background: "#EFF6FF",
                color: "#2563EB",
                border: "1px solid #BFDBFE",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#10B981" }}
              />
              {t.hero.badge}
            </div>

            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight animate-fade-in delay-100"
              style={{ color: "#0F172A" }}
            >
              {t.hero.h1_1}
              <br />
              <span style={{ color: "#2563EB" }}>{t.hero.h1_2}</span>
            </h1>

            <p
              className="mt-6 text-lg sm:text-xl leading-relaxed max-w-2xl animate-fade-in delay-200"
              style={{ color: "#64748B" }}
            >
              {t.hero.sub}
            </p>

            <div className="mt-10 flex flex-wrap gap-4 justify-center animate-fade-in delay-300">
              <a
                href="#tools"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white font-semibold text-sm transition-transform hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, #3B82F6, #2563EB)",
                  boxShadow: "0 8px 30px rgba(37,99,235,0.3)",
                }}
              >
                {t.hero.cta}
                <span>→</span>
              </a>
              <a
                href="#values"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm transition-all hover:bg-blue-50"
                style={{
                  color: "#475569",
                  border: "1px solid #E2E8F0",
                  background: "#fff",
                }}
              >
                {t.hero.cta2}
              </a>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto animate-fade-in delay-400">
            {t.stats.map((s, i) => (
              <div key={i}>
                <div className="text-2xl sm:text-3xl font-extrabold" style={{ color: "#2563EB" }}>
                  {s.num}
                </div>
                <div className="text-xs sm:text-sm mt-1" style={{ color: "#94A3B8" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TOOLS ─── */}
      <section id="tools" className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2
              className="text-3xl sm:text-4xl font-extrabold tracking-tight"
              style={{ color: "#0F172A" }}
            >
              {t.section_tools}
            </h2>
            <p className="mt-3 text-base" style={{ color: "#94A3B8" }}>
              {t.section_tools_sub}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {APPS_DATA.map((app) => {
              const d = app[lang];
              const isLive = app.status === "live";
              return (
                <div
                  key={app.id}
                  className="group relative rounded-2xl p-6 sm:p-8 transition-all duration-300"
                  style={{
                    background: "#fff",
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.boxShadow = `0 12px 40px ${app.color}15`;
                    el.style.borderColor = `${app.color}40`;
                    el.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
                    el.style.borderColor = "#E2E8F0";
                    el.style.transform = "translateY(0)";
                  }}
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl text-white"
                        style={{ background: app.gradient }}
                      >
                        {app.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold" style={{ color: "#0F172A" }}>
                          {d.name}
                        </h3>
                        <p className="text-sm" style={{ color: "#94A3B8" }}>
                          {d.tagline}
                        </p>
                      </div>
                    </div>
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{
                        background: isLive ? "#ECFDF5" : "#F1F5F9",
                        color: isLive ? "#059669" : "#94A3B8",
                      }}
                    >
                      {isLive ? t.status_live : t.status_dev}
                    </span>
                  </div>

                  <p className="text-sm leading-relaxed mb-5" style={{ color: "#64748B" }}>
                    {d.desc}
                  </p>

                  <ul className="space-y-2 mb-6">
                    {d.features.map((f, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-sm"
                        style={{ color: "#475569" }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: app.color }}
                        />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {app.url && (
                    <a
                      href={app.url}
                      className="inline-flex items-center gap-2 text-sm font-semibold transition-all"
                      style={{ color: app.color }}
                    >
                      {t.open}
                      <span className="transition-transform group-hover:translate-x-1">→</span>
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── VALUES ─── */}
      <section id="values" className="py-20 sm:py-28" style={{ background: "#fff" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2
              className="text-3xl sm:text-4xl font-extrabold tracking-tight"
              style={{ color: "#0F172A" }}
            >
              {t.section_values}
            </h2>
            <p className="mt-3 text-base" style={{ color: "#94A3B8" }}>
              {t.section_values_sub}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES_DATA.map((v, i) => {
              const d = v[lang];
              return (
                <div
                  key={i}
                  className="rounded-2xl p-6 text-center sm:text-left"
                  style={{ background: "#F8FAFC", border: "1px solid #F1F5F9" }}
                >
                  <div className="text-3xl mb-4">{v.icon}</div>
                  <h3 className="text-base font-bold mb-2" style={{ color: "#0F172A" }}>
                    {d.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#94A3B8" }}>
                    {d.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section id="contact" className="py-20 sm:py-28" style={{ background: "#F8FAFC" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div
            className="rounded-3xl p-10 sm:p-16 text-center relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #0F172A, #1E3A5F)" }}
          >
            <div
              className="absolute inset-0 -z-0"
              style={{
                background:
                  "radial-gradient(ellipse 50% 80% at 30% 50%, rgba(59,130,246,0.2), transparent), radial-gradient(ellipse 40% 60% at 70% 50%, rgba(37,99,235,0.15), transparent)",
              }}
            />
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
                {t.section_cta_h}
              </h2>
              <p
                className="max-w-lg mx-auto mb-8 text-base leading-relaxed"
                style={{ color: "#94A3B8" }}
              >
                {t.section_cta_sub}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-2">
              <button
                onClick={() => setShowContact(true)}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-semibold text-sm transition-transform hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, #3B82F6, #2563EB)",
                  boxShadow: "0 8px 30px rgba(37,99,235,0.4)",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {t.section_cta_btn}
                <span>✉</span>
              </button>
              <a
                href="https://x.com/appori_app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-4 rounded-xl font-semibold text-sm transition-all hover:bg-white/10"
                style={{ color: "#CBD5E1", border: "1px solid rgba(255,255,255,0.15)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                Follow @appori_app
              </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-10 text-center" style={{ borderTop: "1px solid #E2E8F0", background: "#fff" }}>
        <div className="flex items-center justify-center gap-2 mb-3">
          <Image
            src="/logo.png"
            alt="Appori"
            width={28}
            height={28}
            className="rounded-lg"
          />
          <span className="text-sm font-bold" style={{ color: "#0F172A" }}>
            Appori
          </span>
        </div>
        <a
          href="https://x.com/appori_app"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium mb-3 transition-colors hover:text-blue-600"
          style={{ color: "#64748B" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          @appori_app
        </a>
        <p className="text-xs" style={{ color: "#94A3B8" }}>
          {t.footer}
        </p>
        <p className="text-xs mt-1" style={{ color: "#CBD5E1" }}>
          {t.footer_copy}
        </p>
      </footer>

      {/* ─── Contact Modal ─── */}
      <ContactModal open={showContact} onClose={() => setShowContact(false)} lang={lang} />
    </div>
  );
}
