import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { z } from "zod";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

const AppointmentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^(\+92|0|92)?3\d{9}$/, "Invalid Pakistani phone number format"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  doctorId: z.string().optional().or(z.literal("")),
  serviceId: z.string().min(1, "Please select a service"),
  date: z.string().refine((val) => {
    const selectedDate = new Date(val);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today;
  }, { message: "Past date is not allowed" }),
  time: z.string().min(1, "Time is required"),
  reasonForVisit: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
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

export async function POST(req: NextRequest) {
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

    let { name, phone, email, doctorId, serviceId, date, time, reasonForVisit, notes } = validation.data;
    email = email?.trim().toLowerCase() || "";
    phone = phone.replace(/\s|-/g, "");

    const client = await clientPromise;
    const db = client.db();

    // 1. Check Service
    const service = await db.collection("services").findOne({ _id: new ObjectId(serviceId) });
    if (!service) {
      return NextResponse.json({ ok: false, message: "Selected service does not exist" }, { status: 400 });
    }

    // 2. Check Doctor if provided
    let doctor = null;
    let schedule = {
      days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      startTime: "09:00",
      endTime: "18:00",
      breakStart: "13:00",
      breakEnd: "14:00",
      slotDuration: 30, // Default 30 min clinic slots
    };

    if (doctorId) {
      doctor = await db.collection("doctors").findOne({ _id: new ObjectId(doctorId) });
      if (!doctor) {
        return NextResponse.json({ ok: false, message: "Selected doctor does not exist" }, { status: 400 });
      }
      schedule = doctor.schedule;
    }

    const dayName = new Date(date).toLocaleDateString("en-US", { weekday: "short" });
    if (!schedule.days.includes(dayName)) {
      return NextResponse.json({ ok: false, message: "Clinic or Doctor is closed on this date" }, { status: 400 });
    }

    const slotDuration = schedule.slotDuration || 15;

    // 3. Check/Create Patient (Check both phone and email)
    const patientQuery: any[] = [{ phone }];
    if (email) patientQuery.push({ email });
    
    let patient = await db.collection("patients").findOne({ $or: patientQuery });
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

    // 4. Prevent Double Booking
    if (doctorId) {
      const existingDoctorSlot = await db.collection("appointments").findOne({
        doctorId: doctorId,
        date,
        startTime: time,
        status: { $nin: ["CANCELLED", "NO-SHOW"] }
      });

      if (existingDoctorSlot) {
        return NextResponse.json(
          { ok: false, message: "This slot is already booked for the selected doctor." },
          { status: 409 }
        );
      }
    }

    const existingPatientSlot = await db.collection("appointments").findOne({
      patientId: patient._id.toString(),
      date,
      startTime: time,
      status: { $nin: ["CANCELLED", "NO-SHOW"] }
    });

    if (existingPatientSlot) {
      return NextResponse.json(
        { ok: false, message: "Patient already has an appointment at this time." },
        { status: 409 }
      );
    }

    // Calculate endTime
    const [h, m] = time.split(":").map(Number);
    const endMins = (h * 60 + m + slotDuration);
    const endTime = `${String(Math.floor(endMins / 60)).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`;

    // 5. Create Appointment
    const now = new Date();
    const appointmentDoc = {
      patientId: patient._id.toString(),
      ...(doctorId && { doctorId: doctorId }),
      serviceId: serviceId,
      department: doctor ? doctor.department : service.department,
      date,
      startTime: time,
      endTime,
      status: "REQUESTED",
      statusHistory: [
        {
          status: "REQUESTED",
          changedAt: now,
          note: "Appointment requested via online portal.",
          updatedBy: "system"
        }
      ],
      paymentStatus: "UNPAID",
      bookingSource: "website",
      reasonForVisit: reasonForVisit || "",
      notes: notes || "",
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("appointments").insertOne(appointmentDoc);

    return NextResponse.json(
      {
        ok: true,
        message: "Your appointment request has been received.",
        id: result.insertedId,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST /api/appointments error:", err);
    if (err.code === 11000) {
      return NextResponse.json({ ok: false, message: "This slot is already booked for the selected doctor." }, { status: 409 });
    }
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Aggregation to join with patients and doctors
    // Aggregation to join with patients, doctors, and services
    const appointments = await db.collection("appointments").aggregate([
      {
        $addFields: {
          patientObjId: { $convert: { input: "$patientId", to: "objectId", onError: null, onNull: null } },
          doctorObjId: { 
            $cond: {
              if: { $and: [ { $ne: ["$doctorId", null] }, { $ne: ["$doctorId", ""] } ] }, 
              then: { $convert: { input: "$doctorId", to: "objectId", onError: null, onNull: null } }, 
              else: null 
            }
          },
          serviceObjId: { 
            $cond: {
              if: { $and: [ { $ne: ["$serviceId", null] }, { $ne: ["$serviceId", ""] } ] }, 
              then: { $convert: { input: "$serviceId", to: "objectId", onError: null, onNull: null } }, 
              else: null 
            }
          }
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
      {
        $lookup: {
          from: "services",
          localField: "serviceObjId",
          foreignField: "_id",
          as: "serviceInfo"
        }
      },
      { $unwind: { path: "$patientInfo", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$doctorInfo", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$serviceInfo", preserveNullAndEmptyArrays: true } },
      { $sort: { createdAt: -1 } },
      { $limit: 200 }
    ]).toArray();

    return NextResponse.json({ ok: true, appointments }, { status: 200 });
  } catch (err) {
    console.error("GET /api/appointments error:", err);
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}
