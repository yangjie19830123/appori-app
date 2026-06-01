import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import RoomClient from "./RoomClient"

export const dynamic = "force-dynamic"

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/stayflow/login")

  const [{ data: property }, { data: rooms }] = await Promise.all([
    supabase.from("stayflow_properties").select("*").eq("id", id).single(),
    supabase.from("stayflow_rooms").select("*").eq("property_id", id).order("room_number"),
  ])

  if (!property) notFound()

  return <RoomClient property={property} rooms={rooms ?? []} />
}