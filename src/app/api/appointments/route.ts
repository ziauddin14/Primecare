import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { z } from "zod";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

// Updated Zod Schema for validation
const AppointmentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^(\+92|0|92)?3\d{9}$/, "Invalid Pakistani phone number format"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  doctorId: z.string().min(1, "Please select a doctor"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
});

// Simple In-Memory Rate Limiting
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS = 5;

function checkRateLimit(ip: string) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.lastReset > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return true;
  }
  if (entry.count >= MAX_REQUESTS) return false;
  entry.count += 1;
  return true;
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { ok: false, message: "Too Many Requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validation = AppointmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    let { name, phone, email, doctorId, date, time } = validation.data;
    email = email?.trim().toLowerCase();
    phone = phone.replace(/\s|-/g, "");

    const client = await clientPromise;
    const db = client.db();

    // 1. Get Doctor details
    const doctor = await db.collection("doctors").findOne({ _id: new ObjectId(doctorId) });
    if (!doctor) {
      return NextResponse.json({ ok: false, message: "Doctor not found" }, { status: 404 });
    }

    // 2. Check/Create Patient
    let patient = await db.collection("patients").findOne({ phone });
    if (!patient) {
      const patientDoc = {
        fullName: name,
        phone,
        email: email || "",
        createdAt: new Date(),
      };
      const result = await db.collection("patients").insertOne(patientDoc);
      patient = { ...patientDoc, _id: result.insertedId };
    }

    // 3. Prevent Duplicate Appointment (same patient on same date/time)
    const existing = await db.collection("appointments").findOne({
      patientId: patient._id.toString(),
      date,
      startTime: time,
    });

    if (existing) {
      return NextResponse.json(
        { ok: false, message: "Patient already has an appointment at this time." },
        { status: 409 }
      );
    }

    // Calculate endTime (assume 15 mins slot)
    const [h, m] = time.split(":").map(Number);
    const endMins = (h * 60 + m + 15);
    const endTime = `${String(Math.floor(endMins / 60)).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`;

    // 4. Create Appointment
    const appointmentDoc = {
      patientId: patient._id.toString(),
      doctorId: doctorId,
      department: doctor.department,
      date,
      startTime: time,
      endTime,
      status: "NEW",
      visitType: "consultation",
      notes: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("appointments").insertOne(appointmentDoc);

    return NextResponse.json(
      {
        ok: true,
        message: "Appointment successful. Our team will contact you shortly.",
        id: result.insertedId,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/appointments error:", err);
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Aggregation to join with patients and doctors
    const appointments = await db.collection("appointments").aggregate([
      {
        $addFields: {
          patientObjId: { $toObjectId: "$patientId" },
          doctorObjId: { $toObjectId: "$doctorId" }
        }
      },
      {
        $lookup: {
          from: "patients",
          localField: "patientObjId",
          foreignField: "_id",
          as: "patientInfo"
        }
      },
      {
        $lookup: {
          from: "doctors",
          localField: "doctorObjId",
          foreignField: "_id",
          as: "doctorInfo"
        }
      },
      { $unwind: "$patientInfo" },
      { $unwind: "$doctorInfo" },
      { $sort: { createdAt: -1 } },
      { $limit: 200 }
    ]).toArray();

    return NextResponse.json({ ok: true, appointments }, { status: 200 });
  } catch (err) {
    console.error("GET /api/appointments error:", err);
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}
