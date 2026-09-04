import { NextRequest, NextResponse } from "next/server";
import { getSession, destroySession } from "@/lib/auth/session";
import { logAudit, getClientIp } from "@/lib/auth/audit";

export async function POST(req: NextRequest) {
  const session = await getSession();

  await destroySession();

  if (session) {
    await logAudit({
      actorId: session.userId,
      actorEmail: session.email,
      actorRole: session.role,
      action: "LOGOUT",
      resource: "user",
      resourceId: session.userId,
      ip: getClientIp(req),
    });
  }

  return NextResponse.json({ ok: true, message: "Logged out successfully" });
}
