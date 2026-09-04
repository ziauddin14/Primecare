import clientPromise from "@/lib/mongodb";
import type { AuditAction, AuditLog } from "@/lib/models/AuditLog";

export async function logAudit(entry: {
  actorId: string | null;
  actorEmail?: string;
  actorRole?: string;
  action: AuditAction;
  resource?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
}): Promise<void> {
  try {
    const client = await clientPromise;
    const db = client.db();
    const doc: AuditLog = {
      ...entry,
      createdAt: new Date(),
    };
    await db.collection<AuditLog>("audit_logs").insertOne(doc);
  } catch (err) {
    // Audit logging must never break the request it's observing.
    console.error("[AuditLog] failed to persist audit entry:", err);
  }
}

export function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
