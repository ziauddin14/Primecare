import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();

    const today = new Date().toISOString().split("T")[0];

    // Fetch all today's appointments with joins
    const appointments = await db.collection("appointments").aggregate([
      { $match: { date: today } },
      {
        $addFields: {
          patientObjId: { $toObjectId: "$patientId" },
          doctorObjId: { $toObjectId: "$doctorId" }
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
      { $unwind: "$patientInfo" },
      { $unwind: "$doctorInfo" },
      { $sort: { startTime: 1 } }
    ]).toArray();

    // Calculate stats
    const stats = {
      total: appointments.length,
      pending: appointments.filter(a => a.status === "NEW").length,
      confirmed: appointments.filter(a => a.status === "CONFIRMED").length,
      arrived: appointments.filter(a => a.status === "ARRIVED").length,
      completed: appointments.filter(a => a.status === "COMPLETED").length,
      cancelled: appointments.filter(a => ["CANCELLED", "NO-SHOW"].includes(a.status)).length,
    };

    return NextResponse.json({ ok: true, appointments, stats });
  } catch (err) {
    console.error("GET /api/admin/today error:", err);
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}
