import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const nextRaw = searchParams.get("next")

  // Open-redirect 防护: next 必须以 / 开头
  const next = nextRaw?.startsWith("/") ? nextRaw : "/stayflow/dashboard"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // 认证失败跳回登录页
  return NextResponse.redirect(`${origin}/stayflow/login?error=auth_failed`)
}