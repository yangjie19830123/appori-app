import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // 只对 /calendar 路径执行 Supabase session 刷新和登录保护
  if (request.nextUrl.pathname.startsWith("/calendar")) {
    return await updateSession(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // /calendar 下所有路径（排除静态资源）
    "/calendar/:path*",
  ],
};
