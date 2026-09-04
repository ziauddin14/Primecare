import { NextResponse } from "next/server";
import { getSession, type SessionInfo } from "./session";
import type { UserRole } from "@/lib/models/User";

export type AuthResult = { session: SessionInfo } | { error: NextResponse };

export function isAuthError(result: AuthResult): result is { error: NextResponse } {
  return "error" in result;
}

export async function requireAuth(): Promise<AuthResult> {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 }) };
  }
  return { session };
}

export async function requireRole(roles: UserRole[]): Promise<AuthResult> {
  const result = await requireAuth();
  if (isAuthError(result)) return result;
  if (!roles.includes(result.session.role)) {
    return { error: NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 }) };
  }
  return result;
}
