import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { findUserByEmail, toSafeUser } from "@/lib/auth/users";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { logAudit, getClientIp } from "@/lib/auth/audit";

const LoginSchema = z.object({
  email: z.string().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

// Simple in-memory rate limiting to slow down credential-stuffing/brute-force
// attempts. Same limitation as any in-memory limiter on serverless (per
// instance only) - acceptable as a first line of defense for Phase 1.
const attemptMap = new Map<string, { count: number; lastReset: number }>();
const WINDOW_MS = 60 * 1000;
const MAX_ATTEMPTS = 10;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attemptMap.get(ip);
  if (!entry || now - entry.lastReset > WINDOW_MS) {
    attemptMap.set(ip, { count: 1, lastReset: now });
    return false;
  }
  if (entry.count >= MAX_ATTEMPTS) return true;
  entry.count += 1;
  return false;
}

const GENERIC_INVALID_MESSAGE = "Invalid email or password";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  try {
    if (rateLimited(ip)) {
      return NextResponse.json(
        { ok: false, message: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validation = LoginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const email = validation.data.email.trim().toLowerCase();
    const { password } = validation.data;

    const user = await findUserByEmail(email);

    if (!user) {
      await logAudit({
        actorId: null,
        actorEmail: email,
        action: "LOGIN_FAILURE",
        resource: "user",
        metadata: { reason: "not_found" },
        ip,
      });
      return NextResponse.json({ ok: false, message: GENERIC_INVALID_MESSAGE }, { status: 401 });
    }

    if (!user.isActive) {
      await logAudit({
        actorId: user._id.toString(),
        actorEmail: email,
        actorRole: user.role,
        action: "LOGIN_FAILURE",
        resource: "user",
        metadata: { reason: "inactive" },
        ip,
      });
      return NextResponse.json({ ok: false, message: GENERIC_INVALID_MESSAGE }, { status: 401 });
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      await logAudit({
        actorId: user._id.toString(),
        actorEmail: email,
        actorRole: user.role,
        action: "LOGIN_FAILURE",
        resource: "user",
        metadata: { reason: "bad_password" },
        ip,
      });
      return NextResponse.json({ ok: false, message: GENERIC_INVALID_MESSAGE }, { status: 401 });
    }

    const safeUser = toSafeUser(user);
    await createSession(safeUser);

    await logAudit({
      actorId: safeUser.id,
      actorEmail: safeUser.email,
      actorRole: safeUser.role,
      action: "LOGIN_SUCCESS",
      resource: "user",
      resourceId: safeUser.id,
      ip,
    });

    return NextResponse.json({
      ok: true,
      message: "Authentication successful",
      user: safeUser,
    });
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json({ ok: false, message: "Internal server error" }, { status: 500 });
  }
}
