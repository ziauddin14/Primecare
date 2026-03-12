import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ClinicConfig } from "@/lib/models/Clinic";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Find the first clinic config (for now singleton for demo)
    const configFromDb = await db.collection("clinic_config").findOne({});
    
    let config: any = configFromDb;

    if (!config) {
      // Default fallback for demo
      config = {
        name: "Primecare Clinic",
        phone: "+92 300 1234567",
        email: "care@primecare.com",
        address: "123 Healthcare Blvd, Medical District",
        workingHours: {
          start: "09:00",
          end: "21:00",
          days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        },
        appointmentDuration: 15,
        branding: {
          primaryColor: "#2563eb",
          secondaryColor: "#4f46e5"
        },
        updatedAt: new Date()
      };
    }

    return NextResponse.json({ ok: true, config });
  } catch (err) {
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const client = await clientPromise;
    const db = client.db();

    const configUpdate = {
      ...data,
      updatedAt: new Date()
    };

    // Singleton update
    await db.collection("clinic_config").updateOne(
      {},
      { $set: configUpdate },
      { upsert: true }
    );

    return NextResponse.json({ ok: true, message: "Settings updated successfully" });
  } catch (err) {
    return NextResponse.json({ ok: false, message: "Failed to update settings" }, { status: 500 });
  }
}
