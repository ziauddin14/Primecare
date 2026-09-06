import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import clientPromise from "@/lib/mongodb";
import { requireRole, isAuthError } from "@/lib/auth/guard";
import { logAudit, getClientIp } from "@/lib/auth/audit";
import { badRequest, conflict, serverError, isDuplicateKeyError } from "@/lib/api/responses";
import { ensureAppIndexes } from "@/lib/db/indexes";

export const dynamic = "force-dynamic";

const ServiceCreateSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(200),
  department: z.string().trim().min(1, "Department is required").max(200),
  description: z.string().trim().max(2000).optional(),
  duration: z.coerce.number().int().min(5, "Duration must be at least 5 minutes").max(480, "Duration is too long"),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  isActive: z.boolean().optional().default(true),
});

// GET is public by design - the booking flow (AppointmentClient/
// ServicesClient) needs to list active services without a session. Passing
// ?all=true switches to the admin view (active + inactive) and requires
// ADMIN - inactive services must never be exposed publicly.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "true";

  if (all) {
    const auth = await requireRole(["ADMIN"]);
    if (isAuthError(auth)) return auth.error;
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const filter = all ? {} : { isActive: true };
    const services = await db.collection("services").find(filter).sort({ title: 1 }).toArray();

    return NextResponse.json({ ok: true, services }, { status: 200 });
  } catch (err) {
    return serverError(err, "GET /api/services error:");
  }
}

// Creating a service is an admin action.
export async function POST(req: NextRequest) {
  const auth = await requireRole(["ADMIN"]);
  if (isAuthError(auth)) return auth.error;

  try {
    const body = await req.json().catch(() => null);
    const validation = ServiceCreateSchema.safeParse(body);
    if (!validation.success) {
      return badRequest(validation.error.issues[0]?.message || "Invalid service data");
    }

    const client = await clientPromise;
    const db = client.db();
    await ensureAppIndexes();

    const now = new Date();
    let result;
    try {
      result = await db.collection("services").insertOne({
        ...validation.data,
        createdAt: now,
        updatedAt: now,
      });
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        return conflict("A service with this title already exists");
      }
      throw err;
    }

    await logAudit({
      actorId: auth.session.userId,
      actorEmail: auth.session.email,
      actorRole: auth.session.role,
      action: "SERVICE_CREATE",
      resource: "service",
      resourceId: result.insertedId.toString(),
      metadata: { title: validation.data.title },
      ip: getClientIp(req),
    });

    return NextResponse.json({ ok: true, id: result.insertedId }, { status: 201 });
  } catch (err) {
    return serverError(err, "POST /api/services error:");
  }
}
