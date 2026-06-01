import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ContractsClient from "./ContractsClient"

export const dynamic = "force-dynamic"

export default async function ContractsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/stayflow/login")

  const [{ data: contracts }, { data: properties }] = await Promise.all([
    supabase.from("stayflow_contracts").select("*, stayflow_properties(name)").order("end_date"),
    supabase.from("stayflow_properties").select("id, name").eq("is_active", true),
  ])

  return <ContractsClient contracts={contracts ?? []} properties={properties ?? []} />
}