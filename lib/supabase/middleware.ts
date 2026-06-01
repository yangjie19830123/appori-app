import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: any) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 刷新 session，保持登录状态
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 未登录且不在登录页 → 重定向到登录页
  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/calendar/login") &&
    !request.nextUrl.pathname.startsWith("/calendar/api/auth")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/calendar/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

