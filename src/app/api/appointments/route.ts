import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { z } from "zod";

export const dynamic = "force-dynamic";

// Zod Schema for validation
const AppointmentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^(\+92|0|92)?3\d{9}$/, "Invalid Pakistani phone number format"),
  email: z.string().email("Invalid email address"),
  doctor: z.string().min(1, "Please select a doctor"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
});

// Simple In-Memory Rate Limiting
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5;

function checkRateLimit(ip: string) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.lastReset > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return true;
  }

  if (entry.count >= MAX_REQUESTS) {
    return false;
  }

  entry.count += 1;
  return true;
}

export async function POST(req: Request) {
  try {
    // Rate Limiting
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { ok: false, message: "Too Many Requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    
    // Validation
    const validation = AppointmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, phone, email, doctor, date, time } = validation.data;

    const client = await clientPromise;
    const db = client.db();
    const col = db.collection("appointments");

    // Duplicate Prevention
    // Logic: Same phone OR email AND same date AND same time
    const existing = await col.findOne({
      $or: [{ phone }, { email }],
      date,
      time,
    });

    if (existing) {
      return NextResponse.json(
        { ok: false, message: "You already have an appointment for this time slot." },
        { status: 409 }
      );
    }

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
        message: "Appointment request received. Our team will contact you shortly.",
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
  // Middleware already protects this with Basic Auth
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
