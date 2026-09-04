import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { requireRole, isAuthError } from "@/lib/auth/guard";
import { logAudit, getClientIp } from "@/lib/auth/audit";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const doctors = await db.collection("doctors").find({ isActive: true }).toArray();
    return NextResponse.json({ ok: true, doctors });
  } catch (err) {
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}

// Doctor record management - creating a doctor profile is an admin action.
export async function POST(req: NextRequest) {
  const auth = await requireRole(["ADMIN"]);
  if (isAuthError(auth)) return auth.error;

  try {
    const body = await req.json();
    const client = await clientPromise;
    const db = client.db();
    const result = await db.collection("doctors").insertOne({
      ...body,
      isActive: true,
      createdAt: new Date(),
    });

    await logAudit({
      actorId: auth.session.userId,
      actorEmail: auth.session.email,
      actorRole: auth.session.role,
      action: "DOCTOR_CREATE",
      resource: "doctor",
      resourceId: result.insertedId.toString(),
      ip: getClientIp(req),
    });

    return NextResponse.json({ ok: true, id: result.insertedId });
  } catch (err) {
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}
