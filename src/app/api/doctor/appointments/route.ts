import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { requireRole, isAuthError } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireRole(["ADMIN", "DOCTOR"]);
  if (isAuthError(auth)) return auth.error;
  const { session } = auth;

  try {
    const client = await clientPromise;
    const db = client.db();

    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Karachi"
    }).format(new Date());

    const decodedName = session.name;

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
