import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";


export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    const cookieStore = await cookies();

    // 1. Check Env Admin
    const envUser = process.env.ADMIN_USER || "admin";
    const envPass = process.env.ADMIN_PASS || "primecare123";

    let authUser = null;

    if (username === envUser && password === envPass) {
      authUser = { role: "SUPER_ADMIN", name: "System Admin" };
    }

    if (authUser) {
      // Set Session & Role Cookies
      cookieStore.set("admin_session", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 1 day
        path: "/",
      });

      cookieStore.set("user_role", authUser.role, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
        path: "/",
      });

      cookieStore.set("user_name", authUser.name, {
        httpOnly: false, // frontend needs this for display
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
        path: "/",
      });

      return NextResponse.json({ 
        ok: true, 
        message: "Authentication successful",
        role: authUser.role,
        name: authUser.name
      });
    }

    return NextResponse.json(
      { ok: false, message: "Invalid credentials" },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
