import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();

    const today = new Intl.DateTimeFormat("en-CA", { 
      timeZone: "Asia/Karachi" 
    }).format(new Date());

    // Fetch all today's appointments with joins
    const appointments = await db.collection("appointments").aggregate([
      { $match: { date: today } },
      {
        $addFields: {
          patientObjId: { $toObjectId: "$patientId" },
          doctorObjId: { 
            $cond: {
              if: { $and: [ { $ne: ["$doctorId", null] }, { $ne: ["$doctorId", ""] } ] }, 
              then: { $toObjectId: "$doctorId" }, 
              else: null 
            }
          }
        }
      },
      {
        $lookup: {
          from: "patients",
          localField: "patientObjId",
          foreignField: "_id",
          as: "patientInfo"
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
      { $unwind: { path: "$patientInfo", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$doctorInfo", preserveNullAndEmptyArrays: true } },
      { $sort: { startTime: 1 } }
    ]).toArray();

    // Calculate stats
    const stats = {
      total: appointments.length,
      requested: appointments.filter(a => a.status === "REQUESTED").length,
      confirmed: appointments.filter(a => a.status === "CONFIRMED").length,
      completed: appointments.filter(a => a.status === "COMPLETED").length,
      cancelled: appointments.filter(a => a.status === "CANCELLED").length,
      noShows: appointments.filter(a => a.status === "NO_SHOW").length,
    };

    return NextResponse.json({ ok: true, appointments, stats });
  } catch (err) {
    console.error("GET /api/admin/today error:", err);
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}
