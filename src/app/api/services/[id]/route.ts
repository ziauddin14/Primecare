import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { requireRole, isAuthError } from "@/lib/auth/guard";
import { logAudit, getClientIp } from "@/lib/auth/audit";
import { isValidObjectId } from "@/lib/api/objectId";
import { badRequest, notFound, conflict, serverError, isDuplicateKeyError } from "@/lib/api/responses";
import { ensureAppIndexes } from "@/lib/db/indexes";

const ServiceUpdateSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(200).optional(),
  department: z.string().trim().min(1, "Department is required").max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  duration: z.coerce.number().int().min(5, "Duration must be at least 5 minutes").max(480, "Duration is too long").optional(),
  price: z.coerce.number().min(0, "Price cannot be negative").optional(),
  isActive: z.boolean().optional(),
}).refine((d) => Object.keys(d).length > 0, { message: "No fields to update" });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["ADMIN"]);
  if (isAuthError(auth)) return auth.error;

  try {
    const { id } = await params;
    if (!isValidObjectId(id)) {
      return badRequest("Invalid service id");
    }

    const body = await req.json().catch(() => null);
    const validation = ServiceUpdateSchema.safeParse(body);
    if (!validation.success) {
      return badRequest(validation.error.issues[0]?.message || "Invalid service data");
    }

    const client = await clientPromise;
    const db = client.db();
    await ensureAppIndexes();

    let result;
    try {
      result = await db.collection("services").updateOne(
        { _id: new ObjectId(id) },
        { $set: { ...validation.data, updatedAt: new Date() } }
      );
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        return conflict("A service with this title already exists");
      }
      throw err;
    }

    if (result.matchedCount === 0) {
      return notFound("Service not found");
    }

    await logAudit({
      actorId: auth.session.userId,
      actorEmail: auth.session.email,
      actorRole: auth.session.role,
      action: "SERVICE_UPDATE",
      resource: "service",
      resourceId: id,
      metadata: { fields: Object.keys(validation.data) },
      ip: getClientIp(req),
    });

    return NextResponse.json({ ok: true, message: "Service updated" });
  } catch (err) {
    return serverError(err, "PATCH /api/services/[id] error:");
  }
}

// Soft-delete only. Services are looked up dynamically by appointments
// (via $lookup, never snapshotted), so a service document must never be
// physically removed - doing so would break historical appointments'
// ability to display what they were booked for. Deactivating is the
// permanent, reversible equivalent of "delete" here.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["ADMIN"]);
  if (isAuthError(auth)) return auth.error;

  try {
    const { id } = await params;
    if (!isValidObjectId(id)) {
      return badRequest("Invalid service id");
    }

    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection("services").updateOne(
      { _id: new ObjectId(id) },
      { $set: { isActive: false, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return notFound("Service not found");
    }

    await logAudit({
      actorId: auth.session.userId,
      actorEmail: auth.session.email,
      actorRole: auth.session.role,
      action: "SERVICE_DEACTIVATE",
      resource: "service",
      resourceId: id,
      ip: getClientIp(req),
    });

    return NextResponse.json({ ok: true, message: "Service deactivated" });
  } catch (err) {
    return serverError(err, "DELETE /api/services/[id] error:");
  }
}
