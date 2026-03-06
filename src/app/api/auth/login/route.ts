import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const DEMO_ACCOUNTS = [
  { user: "admin", pass: "admin123", role: "SUPER_ADMIN", name: "Ahmed Khan" },
  { user: "reception", pass: "rec123", role: "RECEPTIONIST", name: "Zia Uddin" },
  { user: "doctor", pass: "doc123", role: "DOCTOR", name: "Dr. Hassan" },
];

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    const cookieStore = await cookies();

    // 1. Check Env Admin First (Legacy)
    const envUser = process.env.ADMIN_USER || "admin";
    const envPass = process.env.ADMIN_PASS || "primecare123";

    let authUser = null;

    if (username === envUser && password === envPass) {
      authUser = { role: "SUPER_ADMIN", name: "System Admin" };
    } else {
      // 2. Check Demo Accounts
      const demo = DEMO_ACCOUNTS.find(a => a.user === username && a.pass === password);
      if (demo) authUser = { role: demo.role, name: demo.name };
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
        httpOnly: true,
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
