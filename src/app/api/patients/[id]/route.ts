import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const client = await clientPromise;
    const db = client.db();

    // 1. Fetch Basic Patient Info
    const patient = await db.collection("patients").findOne({ _id: new ObjectId(id) });
    if (!patient) {
      return NextResponse.json({ ok: false, message: "Patient not found" }, { status: 404 });
    }

    // 2. Fetch All Appointments for History & Upcoming
    const appointments = await db.collection("appointments").aggregate([
      { $match: { patientId: id } },
      {
        $addFields: {
          doctorObjId: { $toObjectId: "$doctorId" }
        }
      },
      {
        $lookup: {
          from: "doctors",
          localField: "doctorObjId",
          foreignField: "_id",
          as: "doctorInfo"
        }
      },
      { $unwind: "$doctorInfo" },
      { $sort: { date: -1, startTime: -1 } }
    ]).toArray();

    const now = new Date().toISOString().split("T")[0];
    
    const visitHistory = appointments.filter(a => a.date < now || (a.date === now && a.status === "COMPLETED"));
    const upcoming = appointments.filter(a => a.date >= now && a.status !== "COMPLETED" && a.status !== "CANCELLED" && a.status !== "NO-SHOW");
    
    // 3. Stats
    const stats = {
      total: appointments.length,
      completed: appointments.filter(a => a.status === "COMPLETED").length,
      cancelled: appointments.filter(a => a.status === "CANCELLED").length,
      noShow: appointments.filter(a => a.status === "NO-SHOW").length,
    };

    return NextResponse.json({ 
      ok: true, 
      patient, 
      visitHistory, 
      upcoming: upcoming.length > 0 ? upcoming[upcoming.length - 1] : null,
      stats 
    });

  } catch (err) {
    console.error("GET /api/patients/[id] error:", err);
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}
