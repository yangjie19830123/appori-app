import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import EquipmentClient from "./EquipmentClient"

export const dynamic = "force-dynamic"

export default async function EquipmentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/stayflow/login")

  const [{ data: equipment }, { data: supplies }, { data: properties }] = await Promise.all([
    supabase.from("stayflow_equipment").select("*, stayflow_properties(name), stayflow_rooms(room_number)").order("created_at", { ascending: false }),
    supabase.from("stayflow_supply_inventory").select("*, stayflow_properties(name)").order("item_name"),
    supabase.from("stayflow_properties").select("id, name").eq("is_active", true),
  ])

  return <EquipmentClient equipment={equipment ?? []} supplies={supplies ?? []} properties={properties ?? []} />
}