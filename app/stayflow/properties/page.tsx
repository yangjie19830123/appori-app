import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import PropertiesClient from "./PropertiesClient"

export const dynamic = "force-dynamic"

export default async function PropertiesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/stayflow/login")

  const { data: properties } = await supabase
    .from("stayflow_properties")
    .select("*, stayflow_rooms(id,status)")
    .order("created_at")

  return <PropertiesClient properties={properties ?? []} />
}