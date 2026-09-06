import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import clientPromise from "@/lib/mongodb";
import { requireRole, isAuthError } from "@/lib/auth/guard";
import { badRequest, serverError } from "@/lib/api/responses";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 500;

const PaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  skip: z.coerce.number().int().min(0).default(0),
});

export async function GET(req: NextRequest) {
  const auth = await requireRole(["ADMIN", "STAFF"]);
  if (isAuthError(auth)) return auth.error;

  const { searchParams } = new URL(req.url);
  const parsed = PaginationSchema.safeParse({
    limit: searchParams.get("limit") ?? undefined,
    skip: searchParams.get("skip") ?? undefined,
  });
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message || "Invalid pagination parameters");
  }
  const { limit, skip } = parsed.data;

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
                      cond: { $lt: ["$$v.date", new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date())] }
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
                      cond: { $gte: ["$$v.date", new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date())] }
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
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]).toArray();

    return NextResponse.json({ ok: true, patients });
  } catch (err) {
    return serverError(err, "GET /api/patients error:");
  }
}
