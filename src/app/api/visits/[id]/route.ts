import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { requireRole, isAuthError } from "@/lib/auth/guard";
import { logAudit, getClientIp } from "@/lib/auth/audit";
import { isValidObjectId } from "@/lib/api/objectId";
import { badRequest, notFound, forbidden, serverError } from "@/lib/api/responses";
import { slotFlagUpdate } from "@/lib/appointments/slotFlags";
import type { VisitStatus } from "@/lib/models/Visit";
import type { AppointmentStatus } from "@/lib/models/Appointment";

const VISIT_TRANSITIONS: Record<VisitStatus, VisitStatus[]> = {
  OPEN: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

const UpdateVisitSchema = z.object({
  status: z.enum(["OPEN", "COMPLETED", "CANCELLED"]).optional(),
  notes: z.string().max(2000).optional(),
}).refine((d) => d.status !== undefined || d.notes !== undefined, { message: "No fields to update" });

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["ADMIN", "STAFF", "DOCTOR"]);
  if (isAuthError(auth)) return auth.error;
  const { session } = auth;

  try {
    const { id } = await params;
    if (!isValidObjectId(id)) {
      return badRequest("Invalid visit id");
    }

    const client = await clientPromise;
    const db = client.db();
    const visit = await db.collection("visits").findOne({ _id: new ObjectId(id) });
    if (!visit) {
      return notFound("Visit not found");
    }

    if (session.role === "DOCTOR" && visit.doctorId !== session.doctorId) {
      return forbidden("You do not have access to this visit");
    }

    return NextResponse.json({ ok: true, visit });
  } catch (err) {
    return serverError(err, "GET /api/visits/[id] error:");
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["ADMIN", "STAFF"]);
  if (isAuthError(auth)) return auth.error;
  const { session } = auth;
  const ip = getClientIp(req);

  try {
    const { id } = await params;
    if (!isValidObjectId(id)) {
      return badRequest("Invalid visit id");
    }

    const body = await req.json().catch(() => null);
    const validation = UpdateVisitSchema.safeParse(body);
    if (!validation.success) {
      return badRequest(validation.error.issues[0]?.message || "Invalid request body");
    }
    const { status: nextStatus, notes } = validation.data;

    const client = await clientPromise;
    const db = client.db();

    const visit = await db.collection("visits").findOne({ _id: new ObjectId(id) });
    if (!visit) {
      return notFound("Visit not found");
    }

    const now = new Date();
    const updateDoc: Record<string, unknown> = { updatedAt: now, updatedBy: session.email };

    if (nextStatus !== undefined) {
      const currentStatus = visit.status as VisitStatus;
      if (!VISIT_TRANSITIONS[currentStatus]?.includes(nextStatus)) {
        return badRequest(`Invalid transition from ${currentStatus} to ${nextStatus}`);
      }
      updateDoc.status = nextStatus;
    }
    if (notes !== undefined) {
      updateDoc.notes = notes;
    }

    await db.collection("visits").updateOne({ _id: new ObjectId(id) }, { $set: updateDoc });

    // Minimal Phase 3 consistency rule: completing a visit means the
    // underlying appointment happened, so it's marked COMPLETED too - but
    // only if the appointment is still in the one state that transition is
    // valid from. No cascading beyond that (no notifications, no
    // follow-up jobs - that's later-phase territory).
    if (nextStatus === "COMPLETED") {
      const appointment = await db.collection("appointments").findOne({ _id: new ObjectId(visit.appointmentId) });
      if (appointment && appointment.status === "CONFIRMED") {
        const { set: slotSet } = slotFlagUpdate(appointment.doctorId || null, "COMPLETED" as AppointmentStatus);
        await db.collection("appointments").updateOne(
          { _id: new ObjectId(visit.appointmentId) },
          {
            $set: { status: "COMPLETED", completedAt: now, updatedAt: now, ...slotSet },
            $push: {
              statusHistory: {
                status: "COMPLETED",
                changedAt: now,
                note: "Completed via visit record",
                updatedBy: session.email,
              },
            },
          } as Record<string, unknown>
        );
      }
    }

    await logAudit({
      actorId: session.userId,
      actorEmail: session.email,
      actorRole: session.role,
      action: nextStatus === "COMPLETED" ? "VISIT_COMPLETE" : nextStatus === "CANCELLED" ? "VISIT_CANCEL" : "VISIT_UPDATE",
      resource: "visit",
      resourceId: id,
      metadata: { from: visit.status, to: nextStatus ?? visit.status },
      ip,
    });

    return NextResponse.json({ ok: true, message: "Visit updated" });
  } catch (err) {
    return serverError(err, "PATCH /api/visits/[id] error:");
  }
}
