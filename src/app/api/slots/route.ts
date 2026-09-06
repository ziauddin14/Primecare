import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { generateSlots } from "@/lib/utils/generateSlots";
import { isValidObjectId } from "@/lib/api/objectId";
import { badRequest, notFound, serverError } from "@/lib/api/responses";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");
    const date = searchParams.get("date"); // YYYY-MM-DD

    if (!date || !DATE_RE.test(date)) {
      return badRequest("Missing or invalid date");
    }
    if (doctorId && !isValidObjectId(doctorId)) {
      return badRequest("Invalid doctor id");
    }

    const client = await clientPromise;
    const db = client.db();

    // 1. Get Doctor if provided
    let doctor = null;
    let schedule = {
      days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      startTime: "09:00",
      endTime: "18:00",
      breakStart: "13:00",
      breakEnd: "14:00",
      slotDuration: 30, // Default 30 min clinic slots
    };

    if (doctorId) {
      doctor = await db.collection("doctors").findOne({ _id: new ObjectId(doctorId) });
      if (!doctor) {
        return notFound("Doctor not found");
      }
      schedule = doctor.schedule;
    }

    // 2. Map day name and check
    const dayName = new Date(date).toLocaleDateString("en-US", { weekday: "short" });
    if (!schedule.days.includes(dayName)) {
      return NextResponse.json({ ok: true, availableSlots: [], message: "Not available on this day" });
    }

    // 3. Generate all slots
    const allSlots = generateSlots(schedule);

    // 4. Fetch existing appointments for this doctor and date
    const query: Record<string, unknown> = {
      date: date,
      status: { $ne: "CANCELLED" }
    };
    if (doctorId) query.doctorId = doctorId;

    const appointments = await db.collection("appointments").find(query).toArray();

    const bookedSlots = appointments.map(app => app.startTime);

    // 5. Filter out booked slots
    const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

    return NextResponse.json({ ok: true, availableSlots });

  } catch (err) {
    return serverError(err, "GET /api/slots error:");
  }
}
