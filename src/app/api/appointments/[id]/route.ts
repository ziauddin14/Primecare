import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { status } = await req.json();

    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection("appointments").updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ ok: false, message: "Appointment not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, message: `Status updated to ${status}` });
  } catch (err) {
    console.error("PATCH /api/appointments/[id] error:", err);
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}
