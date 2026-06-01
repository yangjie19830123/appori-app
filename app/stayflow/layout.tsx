
import SidebarClient from "./SidebarClient"

export const metadata = { title: "StayFlow — 運営管理システム" }

export default function StayFlowLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="sf-segment">
      <div className="sf-layout">
        <SidebarClient />
        <div className="sf-main">
          <div className="sf-content">{children}</div>
        </div>
      </div>
    </div>
  )
}