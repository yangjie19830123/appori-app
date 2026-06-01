import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import OrdersClient from "./OrdersClient"

export const dynamic = "force-dynamic"

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/stayflow/login")

  const [{ data: orders }, { data: properties }, { data: rooms }] = await Promise.all([
    supabase.from("stayflow_orders")
      .select("*, stayflow_properties(name), stayflow_rooms(room_number)")
      .order("checkin_date", { ascending: false })
      .limit(100),
    supabase.from("stayflow_properties").select("id, name").eq("is_active", true),
    supabase.from("stayflow_rooms").select("id, room_number, property_id").eq("status", "active"),
  ])

  const today = new Date().toISOString().slice(0, 10)
  const checkinToday   = (orders ?? []).filter(o => o.checkin_date === today).length
  const checkoutToday  = (orders ?? []).filter(o => o.checkout_date === today).length
  const cleaningPending = (orders ?? []).filter(o => o.cleaning_status === "pending" && o.checkout_date <= today).length
  const monthTotal     = (orders ?? []).filter(o => o.status !== "cancelled").length

  return (
    <OrdersClient
      orders={orders ?? []}
      properties={properties ?? []}
      rooms={rooms ?? []}
      stats={{ checkinToday, checkoutToday, cleaningPending, monthTotal }}
    />
  )
}