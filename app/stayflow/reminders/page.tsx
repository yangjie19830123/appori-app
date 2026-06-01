// ============================================================
// app/stayflow/reminders/page.tsx
// ============================================================
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import RemindersClient from "./RemindersClient"

export const dynamic = "force-dynamic"

export default async function RemindersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/stayflow/login")

  const [{ data: events }, { data: contracts }] = await Promise.all([
    supabase.from("stayflow_event_reminders").select("*").order("start_date"),
    supabase.from("stayflow_contracts").select("id,company_name,end_date,contract_type,stayflow_properties(name)").eq("status","active").not("end_date","is",null).order("end_date").limit(10),
  ])

  return <RemindersClient events={events ?? []} contracts={contracts ?? []} />
}