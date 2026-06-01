import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import SidebarClient from "./SidebarClient"

export const metadata = { title: "StayFlow — 運営管理システム" }

export default async function StayFlowLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 未ログイン → ログインページへ
  if (!user) redirect("/stayflow/login")

  // ライセンス確認
  const { data: license } = await supabase
    .from("stayflow_licenses")
    .select("customer_name, expires_at, notes, is_active")
    .eq("email", user.email!)
    .eq("is_active", true)
    .single()

  // ライセンスなし or 期限切れ → アクセス拒否ページへ
  if (!license || new Date(license.expires_at) < new Date()) {
    redirect("/stayflow/license-denied")
  }

  return (
    <div className="sf-segment">
      <div className="sf-layout">
        <SidebarClient
          customerName={license.customer_name ?? user.email ?? ""}
          licenseCode={license.notes ?? ""}
        />
        <div className="sf-main">
          <div className="sf-content">{children}</div>
        </div>
      </div>
    </div>
  )
}