import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("admin_session");
  const role = request.cookies.get("user_role")?.value;
  const path = request.nextUrl.pathname;

  // 1. Protect all /admin routes
  if (path.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Role-based Path Filtering
    if (path.startsWith("/admin/analytics") && role === "RECEPTIONIST") {
       // Receptionists can't see analytics
       return NextResponse.redirect(new URL("/admin", request.url));
    }

    if ((path.startsWith("/admin/patients") || path.startsWith("/admin/analytics")) && role === "DOCTOR") {
       // Doctors have a focused view, redirect to doctor dashboard
       return NextResponse.redirect(new URL("/admin/doctor", request.url));
    }

    if (path === "/admin" && role === "DOCTOR") {
       // Doctors go to their specific dashboard
       return NextResponse.redirect(new URL("/admin/doctor", request.url));
    }
  }

  // 2. Redirect from login if already logged in
  if (path === "/login" && session) {
    if (role === "DOCTOR") return NextResponse.redirect(new URL("/admin/doctor", request.url));
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
