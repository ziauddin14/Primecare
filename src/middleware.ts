import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Edge middleware cannot reach MongoDB, so this can only check for the
// presence of the httpOnly session cookie - a UX redirect, not an
// authorization decision. The `user_role` cookie referenced below is a
// cosmetic, JS-readable value used only to pick which page to land a signed
// in user on; it is never treated as proof of role. Every API route that
// actually reads or mutates data re-verifies the session and role against
// the `sessions`/`users` collections server-side (see src/lib/auth/guard.ts).
export function middleware(request: NextRequest) {
  const session = request.cookies.get("session");
  const role = request.cookies.get("user_role")?.value;
  const path = request.nextUrl.pathname;

  // 1. Protect all /admin routes
  if (path.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Cosmetic path routing only - the destination page's own API calls
    // enforce the real role check server-side.
    if (path.startsWith("/admin/analytics") && role === "STAFF") {
       return NextResponse.redirect(new URL("/admin", request.url));
    }

    if ((path.startsWith("/admin/patients") || path.startsWith("/admin/analytics")) && role === "DOCTOR") {
       return NextResponse.redirect(new URL("/admin/doctor", request.url));
    }

    if (path === "/admin" && role === "DOCTOR") {
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
