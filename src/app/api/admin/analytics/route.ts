import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "7d";

    const client = await clientPromise;
    const db = client.db();

    const now = new Date();
    let startDate = new Date();
    let dateFormat = "%Y-%m-%d"; // default for 7d/30d

    if (range === "today") {
      startDate.setHours(0, 0, 0, 0);
      dateFormat = "%H:00"; // For hourly trends
    } else if (range === "7d") {
      startDate.setDate(now.getDate() - 7);
    } else if (range === "30d") {
      startDate.setDate(now.getDate() - 30);
    }
    
    const startDateStr = startDate.toISOString().split("T")[0];

    // 1. Summary Statistics
    const appointments = await db.collection("appointments").find({
      date: { $gte: startDateStr }
    }).toArray();

    const summary = {
      total: appointments.length,
      completed: appointments.filter(a => a.status === "COMPLETED").length,
      cancelled: appointments.filter(a => a.status === "CANCELLED").length,
      noShow: appointments.filter(a => a.status === "NO-SHOW").length,
      newPatients: 0, // calculated from patient analysis below
      returningPatients: 0 // calculated from patient analysis below
    };

    // 2. Patient Insights (New vs Returning)
    // For the given range, we check each patient's creation date vs range to see if they are "New"
    const patientIds = Array.from(new Set(appointments.map(a => a.patientId)));
    const patients = await db.collection("patients").find({
      _id: { $in: patientIds.map(id => new ObjectId(id)) }
    }).toArray();

    patients.forEach(p => {
      const createdAt = new Date(p.createdAt);
      if (createdAt >= startDate) {
        summary.newPatients += 1;
      } else {
        summary.returningPatients += 1;
      }
    });

    // 3. Appointment Trends
    // Group by date
    const trendsMap: Record<string, number> = {};
    appointments.forEach(a => {
      const key = a.date;
      trendsMap[key] = (trendsMap[key] || 0) + 1;
    });
    const appointmentTrends = Object.entries(trendsMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 4. Doctor Performance
    const doctorStats = await db.collection("appointments").aggregate([
      { $match: { date: { $gte: startDateStr } } },
      {
        $group: {
          _id: "$doctorId",
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] } },
          noShow: { $sum: { $cond: [{ $eq: ["$status", "NO-SHOW"] }, 1, 0] } }
        }
      },
      {
        $addFields: {
          doctorObjId: { $toObjectId: "$_id" }
        }
      },
      {
        $lookup: {
          from: "doctors",
          localField: "doctorObjId",
          foreignField: "_id",
          as: "info"
        }
      },
      { $unwind: "$info" },
      {
        $project: {
          name: "$info.name",
          department: "$info.department",
          total: 1,
          completed: 1,
          cancelled: 1,
          noShow: 1,
          rate: { 
            $cond: [
              { $eq: ["$total", 0] }, 
              0, 
              { $multiply: [{ $divide: ["$completed", "$total"] }, 100] } 
            ]
          }
        }
      },
      { $sort: { total: -1 } }
    ]).toArray();

    // 5. Operational Insights
    // Busiest Day
    const dayCounts: Record<string, number> = {};
    appointments.forEach(a => {
      const day = new Date(a.date).toLocaleDateString('en-US', { weekday: 'long' });
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    const busiestDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    // Busiest Slot
    const slotCounts: Record<string, number> = {};
    appointments.forEach(a => {
      slotCounts[a.startTime] = (slotCounts[a.startTime] || 0) + 1;
    });
    const busiestSlot = Object.entries(slotCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    const operationalInsights = {
      busiestDay,
      busiestSlot,
      topDepartment: doctorStats[0]?.department || "General",
      activeDoctors: doctorStats.length
    };

    return NextResponse.json({
      ok: true,
      summary,
      appointmentTrends,
      doctorPerformance: doctorStats,
      operationalInsights
    });

  } catch (err) {
    console.error("GET /api/admin/analytics error:", err);
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}
