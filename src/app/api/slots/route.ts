import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { generateSlots } from "@/lib/utils/generateSlots";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");
    const date = searchParams.get("date"); // YYYY-MM-DD

    if (!date) {
      return NextResponse.json({ ok: false, message: "Missing date" }, { status: 400 });
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
        return NextResponse.json({ ok: false, message: "Doctor not found" }, { status: 404 });
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
    const query: any = {
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
    console.error("GET /api/slots error:", err);
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}
