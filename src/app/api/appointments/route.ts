import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

type AppointmentInput = {
  name: string;
  phone: string;
  email: string;
  doctor: string;
  date: string;
  time: string;
};

function isValidEmail(email: string) {
  return /^\S+@\S+\.\S+$/.test(email);
}

function sanitize(input: string) {
  return input.trim();
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<AppointmentInput>;

    const name = sanitize(body.name ?? "");
    const phone = sanitize(body.phone ?? "");
    const email = sanitize(body.email ?? "");
    const doctor = sanitize(body.doctor ?? "");
    const date = sanitize(body.date ?? "");
    const time = sanitize(body.time ?? "");

    // Basic validation
    if (!name || !phone || !email || !doctor || !date || !time) {
      return NextResponse.json(
        { ok: false, message: "Missing required fields" },
        { status: 400 }
      );
    }
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, message: "Invalid email" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(); // uses DB from URI (primecare)
    const col = db.collection("appointments");

    const doc = {
      name,
      phone,
      email,
      doctor,
      date,
      time,
      createdAt: new Date(),
    };

    const result = await col.insertOne(doc);

    return NextResponse.json(
      {
        ok: true,
        message:
          "Appointment request received. Our team will confirm shortly.",
        id: result.insertedId,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/appointments error:", err);
    return NextResponse.json(
      { ok: false, message: "Server error while creating appointment" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const col = db.collection("appointments");

    const appointments = await col
      .find({})
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();

    return NextResponse.json({ ok: true, appointments }, { status: 200 });
  } catch (err) {
    console.error("GET /api/appointments error:", err);
    return NextResponse.json(
      { ok: false, message: "Server error while fetching appointments" },
      { status: 500 }
    );
  }
}
