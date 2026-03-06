import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { generateSlots } from "@/lib/utils/generateSlots";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");
    const date = searchParams.get("date"); // YYYY-MM-DD

    if (!doctorId || !date) {
      return NextResponse.json({ ok: false, message: "Missing doctorId or date" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // 1. Get Doctor
    const doctor = await db.collection("doctors").findOne({ _id: new ObjectId(doctorId) });
    if (!doctor) {
      return NextResponse.json({ ok: false, message: "Doctor not found" }, { status: 404 });
    }

    // 2. Map day name and check if doctor works on that day
    const dayName = new Date(date).toLocaleDateString("en-US", { weekday: "short" });
    if (!doctor.schedule.days.includes(dayName)) {
      return NextResponse.json({ ok: true, availableSlots: [], message: "Doctor is not available on this day" });
    }

    // 3. Generate all slots
    const allSlots = generateSlots(doctor.schedule);

    // 4. Fetch existing appointments for this doctor and date
    const appointments = await db.collection("appointments").find({
      doctorId: doctorId,
      date: date,
      status: { $ne: "CANCELLED" }
    }).toArray();

    const bookedSlots = appointments.map(app => app.startTime);

    // 5. Filter out booked slots
    const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

    return NextResponse.json({ ok: true, availableSlots });

  } catch (err) {
    console.error("GET /api/slots error:", err);
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}
