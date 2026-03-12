import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

const SERVICES = [
  { title: "General Consultation", department: "General Medicine", price: 50, duration: 20 },
  { title: "Cardiac Screening", department: "Cardiology", price: 150, duration: 45 },
  { title: "Dermatology Check", department: "Dermatology", price: 80, duration: 30 },
  { title: "Pediatric Wellness", department: "Pediatrics", price: 60, duration: 30 },
  { title: "Orthopedic Assessment", department: "Orthopedics", price: 100, duration: 45 },
  { title: "Dental Filling", department: "Dentistry", price: 120, duration: 45 },
];

const DOCTORS = [
  { name: "Dr. Hassan Ahmed", department: "Cardiology", experience: "12 Years", qualification: "MBBS, MD - Cardiology", availability: { days: ["Monday", "Wednesday", "Friday"], startTime: "09:00", endTime: "17:00" } },
  { name: "Dr. Sarah Khan", department: "Dermatology", experience: "8 Years", qualification: "MBBS, Diploma in Derm", availability: { days: ["Tuesday", "Thursday", "Saturday"], startTime: "10:00", endTime: "18:00" } },
  { name: "Dr. Zaid Malik", department: "Pediatrics", experience: "15 Years", qualification: "MBBS, FCPS - Pediatrics", availability: { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], startTime: "10:00", endTime: "20:00" } },
  { name: "Dr. Amna Qureshi", department: "Dentistry", experience: "6 Years", qualification: "BDS, MDS", availability: { days: ["Saturday", "Sunday"], startTime: "09:00", endTime: "15:00" } },
];

const PATIENTS = [
  { fullName: "Zia Uddin", email: "zia@example.com", phone: "+92 312 3456789", age: 29, gender: "Male" },
  { fullName: "Ayesha Malik", email: "ayesha@example.com", phone: "+92 321 9876543", age: 24, gender: "Female" },
  { fullName: "Omar Farooq", email: "omar@example.com", phone: "+92 333 4445556", age: 45, gender: "Male" },
  { fullName: "Fatima Shah", email: "fatima@example.com", phone: "+92 300 1112223", age: 32, gender: "Female" },
];

export async function POST() {
  try {
    const client = await clientPromise;
    const db = client.db();

    // 1. Clear existing demo-related collections
    await db.collection("services").deleteMany({});
    await db.collection("doctors").deleteMany({});
    await db.collection("patients").deleteMany({});
    await db.collection("appointments").deleteMany({});

    // 2. Insert Services
    const serviceRes = await db.collection("services").insertMany(SERVICES);
    const serviceIds = Object.values(serviceRes.insertedIds);

    // 3. Insert Doctors
    const doctorRes = await db.collection("doctors").insertMany(DOCTORS);
    const doctorIds = Object.values(doctorRes.insertedIds);

    // 4. Insert Patients
    const patientRes = await db.collection("patients").insertMany(PATIENTS);
    const patientIds = Object.values(patientRes.insertedIds);

    // 5. Create realistic appointments
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const appointments = [
      // Today's Load
      {
        patientId: patientIds[0],
        doctorId: doctorIds[0],
        serviceId: serviceIds[0],
        date: todayStr,
        startTime: "10:00",
        status: "CONFIRMED",
        visitType: "Consultation",
        reasonForVisit: "Chest Pain",
        bookingSource: "web",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        patientId: patientIds[1],
        doctorId: doctorIds[2],
        serviceId: serviceIds[3],
        date: todayStr,
        startTime: "11:30",
        status: "REQUESTED", // Waitlist
        visitType: "General",
        reasonForVisit: "Fever",
        bookingSource: "web",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        patientId: patientIds[2],
        doctorId: doctorIds[1],
        serviceId: serviceIds[2],
        date: todayStr,
        startTime: "12:00",
        status: "CONFIRMED", 
        visitType: "Follow-up",
        reasonForVisit: "Skin Rash",
        bookingSource: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Previous Stats
      {
        patientId: patientIds[3],
        doctorId: doctorIds[0],
        serviceId: serviceIds[0],
        date: todayStr,
        startTime: "09:00",
        status: "COMPLETED",
        visitType: "Routine",
        reasonForVisit: "Migraine",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        patientId: patientIds[0],
        doctorId: doctorIds[2],
        serviceId: serviceIds[3],
        date: todayStr,
        startTime: "15:00",
        status: "CANCELLED",
        visitType: "General",
        reasonForVisit: "Flu",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        patientId: patientIds[1],
        doctorId: doctorIds[1],
        serviceId: serviceIds[2],
        date: todayStr,
        startTime: "16:00",
        status: "NO_SHOW",
        visitType: "Follow-up",
        reasonForVisit: "Allergy",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.collection("appointments").insertMany(appointments);

    return NextResponse.json({ ok: true, message: "Demo Environment Seeded Successfully" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, message: "Seed failed" }, { status: 500 });
  }
}
