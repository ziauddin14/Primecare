import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { requireRole, isAuthError } from "@/lib/auth/guard";
import { isValidObjectId } from "@/lib/api/objectId";
import { badRequest, notFound, serverError } from "@/lib/api/responses";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["ADMIN", "STAFF"]);
  if (isAuthError(auth)) return auth.error;

  try {
    const { id } = await params;
    if (!isValidObjectId(id)) {
      return badRequest("Invalid patient id");
    }

    const client = await clientPromise;
    const db = client.db();

    // 1. Fetch Basic Patient Info
    const patient = await db.collection("patients").findOne({ _id: new ObjectId(id) });
    if (!patient) {
      return notFound("Patient not found");
    }

    // 2. Fetch All Appointments for History & Upcoming
    const appointments = await db.collection("appointments").aggregate([
      { $match: { patientId: id } },
      {
        $addFields: {
          doctorObjId: { 
            $cond: {
              if: { $and: [ { $ne: ["$doctorId", null] }, { $ne: ["$doctorId", ""] } ] }, 
              then: { $convert: { input: "$doctorId", to: "objectId", onError: null, onNull: null } }, 
              else: null 
            }
          },
          serviceObjId: { $convert: { input: "$serviceId", to: "objectId", onError: null, onNull: null } }
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
      {
        $lookup: {
          from: "services",
          localField: "serviceObjId",
          foreignField: "_id",
          as: "serviceInfo"
        }
      },
      { $unwind: { path: "$doctorInfo", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$serviceInfo", preserveNullAndEmptyArrays: true } },
      { $sort: { date: -1, startTime: -1 } }
    ]).toArray();

    const now = new Intl.DateTimeFormat("en-CA", { 
      timeZone: "Asia/Karachi" 
    }).format(new Date());
    
    const visitHistory = appointments.filter(a => a.date < now || (a.date === now && a.status === "COMPLETED"));
    const upcoming = appointments.filter(a => a.date >= now && a.status !== "COMPLETED" && a.status !== "CANCELLED" && a.status !== "NO_SHOW");
    
    // 3. Stats
    const stats = {
      total: appointments.length,
      completed: appointments.filter(a => a.status === "COMPLETED").length,
      cancelled: appointments.filter(a => a.status === "CANCELLED").length,
      noShow: appointments.filter(a => a.status === "NO_SHOW").length,
    };

    return NextResponse.json({ 
      ok: true, 
      patient, 
      visitHistory, 
      upcoming: upcoming.length > 0 ? upcoming[upcoming.length - 1] : null,
      stats 
    });

  } catch (err) {
    return serverError(err, "GET /api/patients/[id] error:");
  }
}
