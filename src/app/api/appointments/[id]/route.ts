import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { AppointmentStatus } from "@/lib/models/Appointment";

const VALID_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
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
    const { status, note, reason } = await req.json();

    const client = await clientPromise;
    const db = client.db();

    // 1. Fetch current appointment
    const appointment = await db.collection("appointments").findOne({ _id: new ObjectId(id) });
    if (!appointment) {
      return NextResponse.json({ ok: false, message: "Appointment not found" }, { status: 404 });
    }

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
    const now = new Date();
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
      updatedBy: "receptionist" // Assume receptionist for now
    };

    const result = await db.collection("appointments").updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: updateDoc,
        $push: { statusHistory: historyEntry }
      } as any
    );

    return NextResponse.json({ 
      ok: true, 
      message: `Appointment ${nextStatus.toLowerCase()}`,
      history: historyEntry
    });

  } catch (err) {
    console.error("PATCH /api/appointments/[id] error:", err);
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}
