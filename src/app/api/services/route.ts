import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    const services = await db.collection("services").find({ isActive: true }).toArray();

    return NextResponse.json({ ok: true, services }, { status: 200 });
  } catch (err) {
    console.error("GET /api/services error:", err);
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}
