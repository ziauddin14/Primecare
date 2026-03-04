import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect /admin and GET /api/appointments
  const isAdminPath = pathname.startsWith("/admin");
  const isProtectedApi = pathname === "/api/appointments" && req.method === "GET";

  if (isAdminPath || isProtectedApi) {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return new NextResponse("Authentication required", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Admin Area"',
        },
      });
    }

    try {
      const auth = authHeader.split(" ")[1];
      const decoded = Buffer.from(auth, "base64").toString();
      const [user, pass] = decoded.split(":");

      if (
        user === process.env.ADMIN_USER &&
        pass === process.env.ADMIN_PASS
      ) {
        return NextResponse.next();
      }
    } catch (e) {
      // Error decoding or split failed
    }

    return new NextResponse("Invalid credentials", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Admin Area"',
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/appointments"],
};
