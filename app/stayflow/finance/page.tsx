// ============================================================
// app/stayflow/finance/page.tsx
// ============================================================
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import FinanceClient from "./FinanceClient"

export const dynamic = "force-dynamic"

export default async function FinancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/stayflow/login")

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

  const [{ data: income }, { data: expenses }, { data: properties }] = await Promise.all([
    supabase.from("stayflow_income_records").select("*, stayflow_properties(name)").gte("record_date", monthStart).lte("record_date", monthEnd),
    supabase.from("stayflow_expense_records").select("*, stayflow_properties(name)").gte("record_date", monthStart).lte("record_date", monthEnd),
    supabase.from("stayflow_properties").select("id, name").eq("is_active", true),
  ])

  return <FinanceClient income={income ?? []} expenses={expenses ?? []} properties={properties ?? []} />
}


// ============================================================
// app/stayflow/finance/FinanceClient.tsx
// ============================================================
// NOTE: このファイルは FinanceClient.tsx として別途保存してください