import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const doctors = await db.collection("doctors").find({ isActive: true }).toArray();
    return NextResponse.json({ ok: true, doctors });
  } catch (err) {
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}

// For seeding or management
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const client = await clientPromise;
    const db = client.db();
    const result = await db.collection("doctors").insertOne({
      ...body,
      isActive: true,
      createdAt: new Date(),
    });
    return NextResponse.json({ ok: true, id: result.insertedId });
  } catch (err) {
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}
