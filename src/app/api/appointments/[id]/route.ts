import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { AppointmentStatus } from "@/lib/models/Appointment";
import { NotificationManager } from "@/lib/notifications/NotificationManager";
import { NotificationEventType } from "@/lib/notifications/types";
import { requireRole, isAuthError } from "@/lib/auth/guard";
import { logAudit, getClientIp } from "@/lib/auth/audit";
import { isValidObjectId } from "@/lib/api/objectId";
import { badRequest, notFound, conflict, serverError, isDuplicateKeyError } from "@/lib/api/responses";
import { ensureAppIndexes } from "@/lib/db/indexes";
import { slotFlagUpdate } from "@/lib/appointments/slotFlags";

const VALID_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  "REQUESTED": ["CONFIRMED", "CANCELLED"],
  "CONFIRMED": ["COMPLETED", "CANCELLED", "NO_SHOW"],
  "COMPLETED": [],
  "CANCELLED": [],
  "NO_SHOW": []
};

const NotesSchema = z.object({
  action: z.literal("update_notes"),
  note: z.string().max(2000, "Note is too long"),
});

const PaymentSchema = z.object({
  action: z.literal("update_payment"),
  paymentStatus: z.enum(["PAID", "UNPAID"]),
});

const RescheduleSchema = z.object({
  action: z.literal("reschedule"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format"),
  doctorId: z.string().optional().or(z.literal("")),
  note: z.string().max(2000).optional(),
}).refine((d) => !d.doctorId || isValidObjectId(d.doctorId), {
  message: "Invalid doctor selected",
  path: ["doctorId"],
});

const StatusUpdateSchema = z.object({
  action: z.undefined().optional(),
  status: z.enum(["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"], {
    message: "Invalid status value",
  }),
  note: z.string().max(2000).optional(),
  reason: z.string().max(500).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["ADMIN", "STAFF"]);
  if (isAuthError(auth)) return auth.error;
  const { session } = auth;
  const ip = getClientIp(req);

  try {
    const { id } = await params;
    if (!isValidObjectId(id)) {
      return badRequest("Invalid appointment id");
    }

    const rawBody = await req.json().catch(() => null);
    if (!rawBody || typeof rawBody !== "object") {
      return badRequest("Invalid request body");
    }

    const action = (rawBody as { action?: unknown }).action;
    const schema =
      action === "update_notes" ? NotesSchema :
      action === "update_payment" ? PaymentSchema :
      action === "reschedule" ? RescheduleSchema :
      action === undefined ? StatusUpdateSchema :
      null;

    if (!schema) {
      return badRequest("Unknown action");
    }

    const parsed = schema.safeParse(rawBody);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message || "Invalid request body");
    }
    const data = parsed.data;

    const client = await clientPromise;
    const db = client.db();
    await ensureAppIndexes();

    // 1. Fetch current appointment
    const appointment = await db.collection("appointments").findOne({ _id: new ObjectId(id) });
    if (!appointment) {
      return notFound("Appointment not found");
    }

    const now = new Date();

    // Separate actions
    if (data.action === "update_notes") {
      await db.collection("appointments").updateOne(
        { _id: new ObjectId(id) },
        { $set: { internalNotes: data.note, updatedAt: now } }
      );
      await logAudit({
        actorId: session.userId,
        actorEmail: session.email,
        actorRole: session.role,
        action: "APPOINTMENT_NOTES_UPDATE",
        resource: "appointment",
        resourceId: id,
        ip,
      });
      return NextResponse.json({ ok: true, message: "Notes updated" });
    }

    if (data.action === "update_payment") {
      await db.collection("appointments").updateOne(
        { _id: new ObjectId(id) },
        { $set: { paymentStatus: data.paymentStatus, updatedAt: now } }
      );
      await logAudit({
        actorId: session.userId,
        actorEmail: session.email,
        actorRole: session.role,
        action: "APPOINTMENT_PAYMENT_UPDATE",
        resource: "appointment",
        resourceId: id,
        metadata: { paymentStatus: data.paymentStatus },
        ip,
      });
      return NextResponse.json({ ok: true, message: "Payment status updated" });
    }

    if (data.action === "reschedule") {
      const { date, time, doctorId, note } = data;

      // Must check if doctor exists and calculate slot
      let doctor = null;
      let slotDuration = 15;
      if (doctorId) {
        doctor = await db.collection("doctors").findOne({ _id: new ObjectId(doctorId) });
        if (!doctor) {
          return badRequest("Selected doctor does not exist");
        }
        slotDuration = doctor.schedule.slotDuration || 15;
      }

      const [h, m] = time.split(":").map(Number);
      const endMins = (h * 60 + m + slotDuration);
      const endTime = `${String(Math.floor(endMins / 60)).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`;

      // Fast-fail pre-checks for a friendly message; the partial unique
      // indexes on the appointments collection are the actual guarantee -
      // see the try/catch around updateOne below.
      if (doctorId) {
        const existingDoctorSlot = await db.collection("appointments").findOne({
          _id: { $ne: new ObjectId(id) },
          doctorId: doctorId,
          date,
          startTime: time,
          status: { $nin: ["CANCELLED", "NO_SHOW"] }
        });
        if (existingDoctorSlot) {
          return conflict("Slot already booked for the selected doctor");
        }
      }

      const existingPatientSlot = await db.collection("appointments").findOne({
        _id: { $ne: new ObjectId(id) },
        patientId: appointment.patientId,
        date,
        startTime: time,
        status: { $nin: ["CANCELLED", "NO_SHOW"] }
      });

      if (existingPatientSlot) {
        return conflict("Patient already has an appointment at this time");
      }

      const historyEntry = {
        status: appointment.status,
        changedAt: now,
        note: note || `Rescheduled to ${date} at ${time}`,
        updatedBy: session.email
      };

      const newDoctorId: string = doctorId !== undefined ? (doctorId || "") : appointment.doctorId;
      const { set: slotSet, unset: slotUnset } = slotFlagUpdate(newDoctorId || null, appointment.status as AppointmentStatus);

      const updateDoc: Record<string, unknown> = {
        date,
        startTime: time,
        endTime,
        updatedAt: now,
        ...slotSet,
      };

      // Update doctor and department if changed
      if (doctorId !== undefined) {
        updateDoc.doctorId = doctorId || "";
        if (doctor) updateDoc.department = doctor.department;
      }

      try {
        await db.collection("appointments").updateOne(
          { _id: new ObjectId(id) },
          {
            $set: updateDoc,
            ...(Object.keys(slotUnset).length > 0 && { $unset: slotUnset }),
            $push: { statusHistory: historyEntry },
          } as Record<string, unknown>
        );
      } catch (err) {
        if (isDuplicateKeyError(err)) {
          const msg = err instanceof Error ? err.message : "";
          const message = msg.includes("patient_slot_unique")
            ? "Patient already has an appointment at this time"
            : "Slot already booked for the selected doctor";
          return conflict(message);
        }
        throw err;
      }

      // Notify patient of reschedule
      const pat = await db.collection("patients").findOne({ _id: new ObjectId(appointment.patientId) });
      if (pat) {
        await NotificationManager.trigger(NotificationEventType.APPOINTMENT_RESCHEDULED, {
          appointmentId: id,
          patientId: appointment.patientId,
          patientName: pat.fullName,
          patientPhone: pat.phone,
          doctorName: doctor?.name || "Any Specialist",
          date,
          time,
          clinicName: "Primecare Clinic",
        });
      }

      await logAudit({
        actorId: session.userId,
        actorEmail: session.email,
        actorRole: session.role,
        action: "APPOINTMENT_RESCHEDULE",
        resource: "appointment",
        resourceId: id,
        metadata: { date, time, doctorId: doctorId || null },
        ip,
      });

      return NextResponse.json({ ok: true, message: "Appointment rescheduled successfully" });
    }

    // Default action: Status Update
    const currentStatus = appointment.status as AppointmentStatus;
    const { status: nextStatus, note, reason } = data;

    // 2. Validate Transition
    if (!VALID_TRANSITIONS[currentStatus] || VALID_TRANSITIONS[currentStatus].length === 0) {
      return badRequest("Current status is terminal");
    }

    if (!VALID_TRANSITIONS[currentStatus].includes(nextStatus)) {
      return badRequest(`Invalid transition from ${currentStatus} to ${nextStatus}`);
    }

    // 3. Prepare Update Object
    const { set: slotSet, unset: slotUnset } = slotFlagUpdate(appointment.doctorId || null, nextStatus);
    const updateDoc: Record<string, unknown> = {
      status: nextStatus,
      updatedAt: now,
      ...slotSet,
    };

    // Update specific timestamp field
    if (nextStatus === "CONFIRMED") updateDoc.confirmedAt = now;
    if (nextStatus === "COMPLETED") updateDoc.completedAt = now;
    if (nextStatus === "CANCELLED") {
      updateDoc.cancelledAt = now;
      if (reason) updateDoc.cancellationReason = reason;
    }
    if (nextStatus === "NO_SHOW") updateDoc.noShowAt = now;

    if (note) updateDoc.internalNotes = note;

    // 4. Update Status History
    const historyEntry = {
      status: nextStatus,
      changedAt: now,
      note: note || `Status changed to ${nextStatus}`,
      updatedBy: session.email
    };

    try {
      await db.collection("appointments").updateOne(
        { _id: new ObjectId(id) },
        {
          $set: updateDoc,
          ...(Object.keys(slotUnset).length > 0 && { $unset: slotUnset }),
          $push: { statusHistory: historyEntry },
        } as Record<string, unknown>
      );
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        return conflict("This slot is no longer available");
      }
      throw err;
    }

    await logAudit({
      actorId: session.userId,
      actorEmail: session.email,
      actorRole: session.role,
      action: "APPOINTMENT_STATUS_UPDATE",
      resource: "appointment",
      resourceId: id,
      metadata: { from: currentStatus, to: nextStatus },
      ip,
    });

    // 5. Trigger Notifications
    if (nextStatus === "CONFIRMED" || nextStatus === "CANCELLED") {
      const pat = await db.collection("patients").findOne({ _id: new ObjectId(appointment.patientId) });
      const doc = appointment.doctorId ? await db.collection("doctors").findOne({ _id: new ObjectId(appointment.doctorId) }) : null;
      if (pat) {
        await NotificationManager.trigger(
          nextStatus === "CONFIRMED" ? NotificationEventType.APPOINTMENT_CONFIRMED : NotificationEventType.APPOINTMENT_CANCELLED,
          {
            appointmentId: id,
            patientId: appointment.patientId,
            patientName: pat.fullName,
            patientPhone: pat.phone,
            doctorName: doc?.name || "Any Specialist",
            date: appointment.date,
            time: appointment.startTime,
            clinicName: "Primecare Clinic",
            metadata: { reason: reason || "" }
          }
        );
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Appointment ${nextStatus.toLowerCase()}`,
      history: historyEntry
    });

  } catch (err) {
    return serverError(err, "PATCH /api/appointments/[id] error:");
  }
}
