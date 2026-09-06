import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import clientPromise from "@/lib/mongodb";
import { requireRole, isAuthError } from "@/lib/auth/guard";
import { logAudit, getClientIp } from "@/lib/auth/audit";
import { badRequest, serverError } from "@/lib/api/responses";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const DoctorSchema = z.object({
  name: z.string().min(2).max(200),
  department: z.string().min(1).max(200),
  consultationFee: z.coerce.number().min(0),
  schedule: z.object({
    days: z.array(z.string()).min(1),
    startTime: z.string().regex(TIME_RE, "Invalid start time"),
    endTime: z.string().regex(TIME_RE, "Invalid end time"),
    breakStart: z.string().regex(TIME_RE).optional(),
    breakEnd: z.string().regex(TIME_RE).optional(),
    slotDuration: z.coerce.number().int().min(5).max(240),
  }),
  bio: z.string().max(2000).optional(),
  initial: z.string().max(5).optional(),
});

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const doctors = await db.collection("doctors").find({ isActive: true }).toArray();
    return NextResponse.json({ ok: true, doctors });
  } catch (err) {
    return serverError(err, "GET /api/doctors error:");
  }
}

// Doctor record management - creating a doctor profile is an admin action.
export async function POST(req: NextRequest) {
  const auth = await requireRole(["ADMIN"]);
  if (isAuthError(auth)) return auth.error;

  try {
    const body = await req.json().catch(() => null);
    const validation = DoctorSchema.safeParse(body);
    if (!validation.success) {
      return badRequest(validation.error.issues[0]?.message || "Invalid doctor data");
    }

    const client = await clientPromise;
    const db = client.db();
    const result = await db.collection("doctors").insertOne({
      ...validation.data,
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
    return serverError(err, "POST /api/doctors error:");
  }
}
