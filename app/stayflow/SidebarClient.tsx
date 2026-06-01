"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

const NAV = [
  { group: "メイン", items: [
    { path: "/stayflow/dashboard",  label: "ダッシュボード", icon: "grid" },
  ]},
  { group: "物件・設備", items: [
    { path: "/stayflow/properties", label: "物件管理",       icon: "home" },
    { path: "/stayflow/equipment",  label: "設備・消耗品",   icon: "tool" },
  ]},
  { group: "予約・業務", items: [
    { path: "/stayflow/orders",     label: "予約管理",       icon: "calendar" },
    { path: "/stayflow/contracts",  label: "契約管理",       icon: "file" },
  ]},
  { group: "分析", items: [
    { path: "/stayflow/finance",    label: "財務管理",       icon: "chart" },
    { path: "/stayflow/reminders",  label: "イベント通知",   icon: "bell" },
  ]},
  { group: "設定", items: [
    { path: "/stayflow/settings",   label: "権限・設定",     icon: "settings" },
  ]},
]

const ICONS: Record<string, string> = {
  grid:     "M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z",
  home:     "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
  tool:     "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01",
  calendar: "M3 4h18v18H3V4zM8 2v4m8-4v4M3 10h18",
  file:     "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8m8 4H8",
  chart:    "M12 20V10m6 10V4M6 20v-4",
  bell:     "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  logout:   "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
}

function Icon({ name, size = 16 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={ICONS[name] ?? ""} />
    </svg>
  )
}

interface Props {
  customerName: string
  licenseCode: string
}

export default function SidebarClient({ customerName, licenseCode }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const [open, setOpen] = useState(false)

  const currentLabel = NAV.flatMap(g => g.items).find(i => i.path === pathname)?.label ?? "StayFlow"
  const initial = customerName.slice(0, 1) || "U"

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/stayflow/login")
  }

  return (
    <>
      {open && (
        <div onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.2)", zIndex: 99 }} />
      )}

      {/* Sidebar */}
      <aside className={`sf-sidebar${open ? " open" : ""}`}>
        <div className="sf-logo-wrap">
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

        <nav className="sf-nav">
          {NAV.map(group => (
            <div className="sf-nav-group" key={group.group}>
              <div className="sf-nav-label">{group.group}</div>
              {group.items.map(item => (
                <Link key={item.path} href={item.path}
                  className={`sf-nav-item${pathname === item.path ? " active" : ""}`}
                  onClick={() => setOpen(false)}>
                  <Icon name={item.icon} />
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* User info */}
        <div className="sf-user-row">
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8 }}>
            <div className="sf-avatar">{initial}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {customerName}
              </div>
              <div style={{ fontSize: 10, color: "var(--sf-ink3)" }}>{licenseCode}</div>
            </div>
            <button onClick={handleLogout}
              style={{ color: "var(--sf-ink3)", padding: 4, cursor: "pointer", background: "none", border: "none" }}
              title="ログアウト">
              <Icon name="logout" size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Topbar */}
      <div style={{
        position: "fixed", top: 0, left: 220, right: 0, zIndex: 50,
        background: "var(--sf-bg2)", borderBottom: "0.5px solid var(--sf-ink4)",
        padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{currentLabel}</div>
        <div style={{ fontSize: 11, color: "var(--sf-ink3)", background: "var(--sf-sakura)", padding: "3px 12px", borderRadius: 20 }}>
          StayFlow v1.0
        </div>
      </div>
    </>
  )
}