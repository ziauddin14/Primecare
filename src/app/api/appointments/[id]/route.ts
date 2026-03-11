import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { AppointmentStatus } from "@/lib/models/Appointment";
import { NotificationManager } from "@/lib/notifications/NotificationManager";
import { NotificationEventType } from "@/lib/notifications/types";

const VALID_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  "REQUESTED": ["NEW", "CONFIRMED", "CANCELLED"],
  "NEW": ["CONFIRMED", "CANCELLED"],
  "CONFIRMED": ["ARRIVED", "CANCELLED", "NO-SHOW"],
  "ARRIVED": ["IN CONSULTATION", "CANCELLED", "NO-SHOW"],
  "IN CONSULTATION": ["COMPLETED"],
  "COMPLETED": [],
  "CANCELLED": [],
  "NO-SHOW": []
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status, note, reason, doctorId, date, time, action, paymentStatus } = await req.json();

    const client = await clientPromise;
    const db = client.db();

    // 1. Fetch current appointment
    const appointment = await db.collection("appointments").findOne({ _id: new ObjectId(id) });
    if (!appointment) {
      return NextResponse.json({ ok: false, message: "Appointment not found" }, { status: 404 });
    }

    const now = new Date();

    // Separate actions
    if (action === "update_notes") {
      await db.collection("appointments").updateOne(
        { _id: new ObjectId(id) },
        { $set: { internalNotes: note, updatedAt: now } }
      );
      return NextResponse.json({ ok: true, message: "Notes updated" });
    }

    if (action === "update_payment") {
      await db.collection("appointments").updateOne(
        { _id: new ObjectId(id) },
        { $set: { paymentStatus: paymentStatus, updatedAt: now } }
      );
      return NextResponse.json({ ok: true, message: "Payment status updated" });
    }

    if (action === "reschedule") {
      // Must check if doctor exists and calculate slot
      let doctor = null;
      let slotDuration = 15;
      if (doctorId) {
        doctor = await db.collection("doctors").findOne({ _id: new ObjectId(doctorId) });
        if (!doctor) {
          return NextResponse.json({ ok: false, message: "Selected doctor does not exist" }, { status: 400 });
        }
        slotDuration = doctor.schedule.slotDuration || 15;
      }
      
      const [h, m] = time.split(":").map(Number);
      const endMins = (h * 60 + m + slotDuration);
      const endTime = `${String(Math.floor(endMins / 60)).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`;

      // Check double booking for doctor
      if (doctorId) {
        const existingDoctorSlot = await db.collection("appointments").findOne({
          _id: { $ne: new ObjectId(id) },
          doctorId: doctorId,
          date,
          startTime: time,
          status: { $nin: ["CANCELLED", "NO-SHOW"] }
        });
        if (existingDoctorSlot) {
          return NextResponse.json({ ok: false, message: "Slot already booked for the selected doctor" }, { status: 409 });
        }
      }

      // Check double booking for patient
      const existingPatientSlot = await db.collection("appointments").findOne({
        _id: { $ne: new ObjectId(id) },
        patientId: appointment.patientId,
        date,
        startTime: time,
        status: { $nin: ["CANCELLED", "NO-SHOW"] }
      });

      if (existingPatientSlot) {
        return NextResponse.json({ ok: false, message: "Patient already has an appointment at this time" }, { status: 409 });
      }

      const historyEntry = {
        status: appointment.status,
        changedAt: now,
        note: note || `Rescheduled to ${date} at ${time}`,
        updatedBy: "admin"
      };

      const updateDoc: any = {
        date,
        startTime: time,
        endTime,
        updatedAt: now
      };
      
      // Update doctor and department if changed
      if (doctorId !== undefined) {
        updateDoc.doctorId = doctorId || "";
        if (doctor) updateDoc.department = doctor.department;
      }

      await db.collection("appointments").updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: updateDoc,
          $push: { statusHistory: historyEntry } as any
        }
      );

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

      return NextResponse.json({ ok: true, message: "Appointment rescheduled successfully" });
    }

    // Default action: Status Update
    const currentStatus = appointment.status as AppointmentStatus;
    const nextStatus = status as AppointmentStatus;

    // 2. Validate Transition
    if (!VALID_TRANSITIONS[currentStatus].includes(nextStatus)) {
      return NextResponse.json({ 
        ok: false, 
        message: `Invalid transition from ${currentStatus} to ${nextStatus}` 
      }, { status: 400 });
    }

    // 3. Prepare Update Object
    const updateDoc: any = {
      status: nextStatus,
      updatedAt: now,
    };

    // Update specific timestamp field
    if (nextStatus === "CONFIRMED") updateDoc.confirmedAt = now;
    if (nextStatus === "ARRIVED") updateDoc.arrivedAt = now;
    if (nextStatus === "IN CONSULTATION") updateDoc.consultationStartedAt = now;
    if (nextStatus === "COMPLETED") updateDoc.completedAt = now;
    if (nextStatus === "CANCELLED") {
      updateDoc.cancelledAt = now;
      if (reason) updateDoc.cancellationReason = reason;
    }
    if (nextStatus === "NO-SHOW") updateDoc.noShowAt = now;

    if (note) updateDoc.internalNotes = note;

    // 4. Update Status History
    const historyEntry = {
      status: nextStatus,
      changedAt: now,
      note: note || `Status changed to ${nextStatus}`,
      updatedBy: "admin" 
    };

    const result = await db.collection("appointments").updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: updateDoc,
        $push: { statusHistory: historyEntry }
      } as any
    );

    // 5. Trigger Notifications
    if (nextStatus === "CONFIRMED" || nextStatus === "CANCELLED") {
       const pat = await db.collection("patients").findOne({ _id: new ObjectId(appointment!.patientId) });
       const doc = appointment!.doctorId ? await db.collection("doctors").findOne({ _id: new ObjectId(appointment!.doctorId) }) : null;
       if (pat) {
          await NotificationManager.trigger(
            nextStatus === "CONFIRMED" ? NotificationEventType.APPOINTMENT_CONFIRMED : NotificationEventType.APPOINTMENT_CANCELLED,
            {
              appointmentId: id,
              patientId: appointment!.patientId,
              patientName: pat.fullName,
              patientPhone: pat.phone,
              doctorName: doc?.name || "Any Specialist",
              date: appointment!.date,
              time: appointment!.startTime,
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

  } catch (err: any) {
    console.error("PATCH /api/appointments/[id] error:", err);
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}
