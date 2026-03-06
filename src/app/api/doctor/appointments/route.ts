import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const role = cookieStore.get("user_role")?.value;
    const name = cookieStore.get("user_name")?.value;

    if (!role || !name) {
       return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    const today = new Date().toISOString().split("T")[0];

    // For Demo: If role is DOCTOR, filter by doctor name (from cookie)
    // In real app, we'd use doctorId
    const decodedName = decodeURIComponent(name);
    
    const appointments = await db.collection("appointments").find({
      date: today,
      "doctorInfo.name": decodedName
    }).sort({ startTime: 1 }).toArray();

    return NextResponse.json({ 
      ok: true, 
      appointments,
      stats: {
        total: appointments.length,
        completed: appointments.filter(a => a.status === "COMPLETED").length,
        pending: appointments.filter(a => a.status === "NEW" || a.status === "CONFIRMED").length,
        arrived: appointments.filter(a => a.status === "ARRIVED").length
      }
    });

  } catch (err) {
    console.error("GET /api/doctor/appointments error:", err);
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}
