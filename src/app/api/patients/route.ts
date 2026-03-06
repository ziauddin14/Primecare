import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();

    // Aggregation to get patient info + appointment stats
    const patients = await db.collection("patients").aggregate([
      {
        $addFields: {
          patientIdStr: { $toString: "$_id" }
        }
      },
      {
        $lookup: {
          from: "appointments",
          localField: "patientIdStr",
          foreignField: "patientId",
          as: "visits"
        }
      },
      {
        $addFields: {
          totalVisits: { $size: "$visits" },
          lastVisit: {
            $arrayElemAt: [
              {
                $sortArray: {
                  input: {
                    $filter: {
                      input: "$visits",
                      as: "v",
                      cond: { $lt: ["$$v.date", new Date().toISOString().split("T")[0]] }
                    }
                  },
                  sortBy: { date: -1, startTime: -1 }
                }
              },
              0
            ]
          },
          upcomingAppointment: {
            $arrayElemAt: [
              {
                $sortArray: {
                  input: {
                    $filter: {
                      input: "$visits",
                      as: "v",
                      cond: { $gte: ["$$v.date", new Date().toISOString().split("T")[0]] }
                    }
                  },
                  sortBy: { date: 1, startTime: 1 }
                }
              },
              0
            ]
          }
        }
      },
      { $project: { visits: 0, patientIdStr: 0 } },
      { $sort: { createdAt: -1 } }
    ]).toArray();

    return NextResponse.json({ ok: true, patients });
  } catch (err) {
    console.error("GET /api/patients error:", err);
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}
