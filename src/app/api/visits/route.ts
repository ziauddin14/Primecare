import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { requireRole, isAuthError } from "@/lib/auth/guard";
import { logAudit, getClientIp } from "@/lib/auth/audit";
import { isValidObjectId } from "@/lib/api/objectId";
import { badRequest, notFound, conflict, serverError, isDuplicateKeyError } from "@/lib/api/responses";
import { ensureAppIndexes } from "@/lib/db/indexes";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 300;

const CreateVisitSchema = z.object({
  appointmentId: z.string().refine(isValidObjectId, "Invalid appointment id"),
});

const ListQuerySchema = z.object({
  appointmentId: z.string().refine(isValidObjectId, "Invalid appointment id").optional(),
  patientId: z.string().refine(isValidObjectId, "Invalid patient id").optional(),
  doctorId: z.string().refine(isValidObjectId, "Invalid doctor id").optional(),
  status: z.enum(["OPEN", "COMPLETED", "CANCELLED"]).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  skip: z.coerce.number().int().min(0).default(0),
});

// Visits are clinical/operational records - never exposed publicly.
export async function POST(req: NextRequest) {
  const auth = await requireRole(["ADMIN", "STAFF"]);
  if (isAuthError(auth)) return auth.error;
  const { session } = auth;

  try {
    const body = await req.json().catch(() => null);
    const validation = CreateVisitSchema.safeParse(body);
    if (!validation.success) {
      return badRequest(validation.error.issues[0]?.message || "Invalid request body");
    }
    const { appointmentId } = validation.data;

    const client = await clientPromise;
    const db = client.db();
    await ensureAppIndexes();

    const appointment = await db.collection("appointments").findOne({ _id: new ObjectId(appointmentId) });
    if (!appointment) {
      return notFound("Appointment not found");
    }

    // A visit represents an encounter for an appointment the patient is
    // actually expected to attend. REQUESTED isn't confirmed yet;
    // COMPLETED/CANCELLED/NO_SHOW are terminal - none are eligible.
    if (appointment.status !== "CONFIRMED") {
      return conflict(`Cannot create a visit for an appointment with status ${appointment.status}`);
    }

    const now = new Date();
    const doc = {
      appointmentId,
      patientId: appointment.patientId,
      ...(appointment.doctorId && { doctorId: appointment.doctorId }),
      visitDate: appointment.date,
      status: "OPEN" as const,
      createdAt: now,
      updatedAt: now,
      createdBy: session.email,
    };

    let result;
    try {
      result = await db.collection("visits").insertOne(doc);
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        return conflict("A visit already exists for this appointment");
      }
      throw err;
    }

    await logAudit({
      actorId: session.userId,
      actorEmail: session.email,
      actorRole: session.role,
      action: "VISIT_CREATE",
      resource: "visit",
      resourceId: result.insertedId.toString(),
      metadata: { appointmentId },
      ip: getClientIp(req),
    });

    return NextResponse.json({ ok: true, id: result.insertedId }, { status: 201 });
  } catch (err) {
    return serverError(err, "POST /api/visits error:");
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireRole(["ADMIN", "STAFF", "DOCTOR"]);
  if (isAuthError(auth)) return auth.error;
  const { session } = auth;

  const { searchParams } = new URL(req.url);
  const parsed = ListQuerySchema.safeParse({
    appointmentId: searchParams.get("appointmentId") ?? undefined,
    patientId: searchParams.get("patientId") ?? undefined,
    doctorId: searchParams.get("doctorId") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
    skip: searchParams.get("skip") ?? undefined,
  });
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message || "Invalid query parameters");
  }
  const { appointmentId, patientId, doctorId, status, limit, skip } = parsed.data;

  // A DOCTOR only ever sees visits assigned to their own linked doctor
  // record - a session with no doctorId link has none to show.
  if (session.role === "DOCTOR" && !session.doctorId) {
    return NextResponse.json({ ok: true, visits: [] });
  }

  try {
    const filter: Record<string, unknown> = {};
    if (appointmentId) filter.appointmentId = appointmentId;
    if (patientId) filter.patientId = patientId;
    if (status) filter.status = status;

    if (session.role === "DOCTOR") {
      filter.doctorId = session.doctorId;
    } else if (doctorId) {
      filter.doctorId = doctorId;
    }

    const client = await clientPromise;
    const db = client.db();
    const visits = await db.collection("visits")
      .find(filter)
      .sort({ visitDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return NextResponse.json({ ok: true, visits });
  } catch (err) {
    return serverError(err, "GET /api/visits error:");
  }
}
