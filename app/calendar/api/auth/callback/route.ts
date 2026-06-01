// app/calendar/api/auth/callback/route.ts
//
// Magic link callback: exchanges the auth code for a session, then redirects
// the user. Supports an optional `?next=/some/path` parameter so different
// tools (calendar, jp/verb, etc.) can each receive users back at the right page
// after they click the email link.
//
// Default: /calendar/dashboard (preserves original calendar behavior)
// next param must start with "/" to prevent open-redirect vulnerabilities.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextRaw = searchParams.get("next");

  // Default destination + safety check.
  // Only allow relative paths starting with "/" to prevent malicious links like
  // ?next=https://evil.com from redirecting users off-site.
  const next = nextRaw && nextRaw.startsWith("/") ? nextRaw : "/calendar/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth failed: bounce back to the login page that corresponds to where they came from.
  // If they came from /jp/verb/..., send them to /jp/verb/login; otherwise calendar.
  const loginPath = next.startsWith("/jp/verb") ? "/jp/verb/login" : "/calendar/login";
  return NextResponse.redirect(`${origin}${loginPath}?error=auth_failed`);
}
