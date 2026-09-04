import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { requireRole, isAuthError } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireRole(["ADMIN", "STAFF", "DOCTOR"]);
  if (isAuthError(auth)) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date());

    const client = await clientPromise;
    const db = client.db();

    // Fetch all active doctors for the header
    const doctors = await db.collection("doctors").find({ isActive: true }).toArray();

    // Fetch appointments for the selected date
    const appointments = await db.collection("appointments").aggregate([
      { $match: { date } },
      {
        $addFields: {
          patientObjId: { $toObjectId: "$patientId" },
          doctorObjId: { 
            $cond: {
              if: { $and: [ { $ne: ["$doctorId", null] }, { $ne: ["$doctorId", ""] } ] }, 
              then: { $toObjectId: "$doctorId" }, 
              else: null 
            }
          },
          serviceObjId: { $toObjectId: "$serviceId" }
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

    return NextResponse.json({ 
      ok: true, 
      date,
      doctors, 
      appointments 
    });

  } catch (err) {
    console.error("GET /api/admin/doctors/schedule error:", err);
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}
