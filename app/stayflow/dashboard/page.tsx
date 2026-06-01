import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DashboardClient from "./DashboardClient"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/stayflow/login")

  // 各種データを並列取得
  const [
    { data: properties },
    { data: orders },
    { data: contracts },
    { data: supplies },
    { data: events },
  ] = await Promise.all([
    supabase.from("stayflow_properties").select("id,name,ownership,platform").eq("is_active", true),
    supabase.from("stayflow_orders").select("id,amount,status,checkin_date,checkout_date,platform,cleaning_status")
      .gte("checkin_date", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10)),
    supabase.from("stayflow_contracts").select("id,company_name,contract_type,end_date,status").eq("status","active").order("end_date"),
    supabase.from("stayflow_supply_inventory").select("item_name,current_stock,warning_level").order("item_name"),
    supabase.from("stayflow_event_reminders").select("*").order("start_date").limit(6),
  ])

  const today = new Date().toISOString().slice(0,10)
  const monthRevenue = (orders ?? []).filter(o => o.status !== "cancelled").reduce((s, o) => s + Number(o.amount), 0)
  const checkinToday = (orders ?? []).filter(o => o.checkin_date === today).length
  const checkoutToday = (orders ?? []).filter(o => o.checkout_date === today).length
  const cleaningPending = (orders ?? []).filter(o => o.cleaning_status === "pending" && o.checkout_date <= today).length
  const expiringContracts = (contracts ?? []).filter(c => {
    if (!c.end_date) return false
    const days = Math.ceil((new Date(c.end_date).getTime() - Date.now()) / 86400000)
    return days <= 30
  })
  const lowSupplies = (supplies ?? []).filter(s => s.current_stock <= s.warning_level)

  return (
    <DashboardClient
      stats={{ monthRevenue, checkinToday, checkoutToday, cleaningPending }}
      properties={properties ?? []}
      recentOrders={(orders ?? []).slice(0,5)}
      expiringContracts={expiringContracts}
      lowSupplies={lowSupplies}
      events={events ?? []}
    />
  )
}