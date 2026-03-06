import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();

    const doctorsList = [
      {
        name: "Dr Ahmed Khan",
        department: "General Medicine",
        consultationFee: 2000,
        schedule: {
          days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
          startTime: "10:00",
          endTime: "18:00",
        },
        isActive: true,
        bio: "Chief of Medicine with 15+ years experience in preventive diagnostic and wellness.",
        initial: "A",
      },
      {
        name: "Dr Sara Malik",
        department: "Dental Care",
        consultationFee: 3000,
        schedule: {
          days: ["Mon", "Wed", "Fri"],
          startTime: "12:00",
          endTime: "19:00",
        },
        isActive: true,
        bio: "Dental Specialist focused on modern surgical treatments with high standards of comfort.",
        initial: "S",
      },
      {
        name: "Dr Ali Raza",
        department: "Pediatrics",
        consultationFee: 2500,
        schedule: {
          days: ["Tue", "Thu", "Sat"],
          startTime: "09:00",
          endTime: "14:00",
        },
        isActive: true,
        bio: "Senior Pediatrician specializing in early childhood development and child immunity.",
        initial: "A",
      },
      {
        name: "Dr Hina Shah",
        department: "Cardiology",
        consultationFee: 5000,
        schedule: {
          days: ["Mon", "Tue", "Wed", "Thu"],
          startTime: "14:00",
          endTime: "20:00",
        },
        isActive: true,
        bio: "Heart Health Specialist providing advanced non-invasive cardiac diagnostics.",
        initial: "H",
      },
    ];

    // Clear and re-seed
    await db.collection("doctors").deleteMany({});
    const result = await db.collection("doctors").insertMany(doctorsList);

    return NextResponse.json({ ok: true, insertedCount: result.insertedCount });
  } catch (err) {
    console.error("Seed error:", err);
    return NextResponse.json({ ok: false, message: "Seed failed" }, { status: 500 });
  }
}
