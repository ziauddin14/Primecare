import clientPromise from "@/lib/mongodb";

let appIndexesEnsured = false;

// Idempotent, safe to call on every cold start (mirrors the pattern in
// src/lib/auth/db.ts for the auth collections). Covers the indexes Phase 2
// actually depends on for correctness, not general-purpose optimization:
//
// - appointments: two partial unique indexes are the real double-booking
//   fix. They only apply to documents where doctorSlotActive/
//   patientSlotActive is true (see src/lib/appointments/slotFlags.ts), so a
//   cancelled/no-show appointment - or one with no doctor assigned - never
//   participates in the uniqueness constraint. This lets MongoDB itself
//   reject a conflicting insert/update atomically (E11000), closing the
//   check-then-insert race a purely application-level check can't close.
// - appointments: a plain index on `date` supports the existing
//   date-range queries in /api/admin/today and /api/admin/analytics.
// - patients: plain (non-unique) indexes on phone/email support the
//   match-or-create lookup on every booking. Not unique - the roadmap
//   explicitly warns against assuming one phone/email can't legitimately
//   belong to more than one patient record.
// - audit_logs: supports querying a given actor's recent activity.
//
// Phase 3 additions:
// - services: unique index on `title` - inspected live data first (no
//   existing duplicates), so a clean clinic naming convention is worth
//   enforcing; duplicate creation is caught (E11000) and mapped to 409.
// - services: index on `isActive` supports the public "active services
//   only" query every booking page runs.
// - visits: unique index on `appointmentId` - one appointment maps to at
//   most one Visit in Phase 3 (see src/lib/models/Visit.ts); duplicate
//   visit creation is caught the same way as the appointment slot indexes.
// - visits: compound indexes on {patientId,visitDate} and
//   {doctorId,visitDate} support the patient/doctor-scoped,
//   date-ordered visit lists Phase 3's admin UI and access control need.
export async function ensureAppIndexes(): Promise<void> {
  if (appIndexesEnsured) return;
  const client = await clientPromise;
  const db = client.db();

  await Promise.all([
    db.collection("appointments").createIndex(
      { doctorId: 1, date: 1, startTime: 1 },
      { unique: true, partialFilterExpression: { doctorSlotActive: true }, name: "doctor_slot_unique" }
    ),
    db.collection("appointments").createIndex(
      { patientId: 1, date: 1, startTime: 1 },
      { unique: true, partialFilterExpression: { patientSlotActive: true }, name: "patient_slot_unique" }
    ),
    db.collection("appointments").createIndex({ date: 1 }, { name: "date_1" }),
    db.collection("patients").createIndex({ phone: 1 }, { name: "phone_1" }),
    db.collection("patients").createIndex({ email: 1 }, { name: "email_1" }),
    db.collection("audit_logs").createIndex({ actorId: 1, createdAt: -1 }, { name: "actor_createdAt" }),
    db.collection("services").createIndex({ title: 1 }, { unique: true, name: "title_unique" }),
    db.collection("services").createIndex({ isActive: 1 }, { name: "isActive_1" }),
    db.collection("visits").createIndex({ appointmentId: 1 }, { unique: true, name: "appointment_unique" }),
    db.collection("visits").createIndex({ patientId: 1, visitDate: -1 }, { name: "patient_visitDate" }),
    db.collection("visits").createIndex({ doctorId: 1, visitDate: -1 }, { name: "doctor_visitDate" }),
  ]);

  appIndexesEnsured = true;
}

// Test-only: lets tests that reset a mock database between cases force
// ensureAppIndexes() to re-register its indexes on the fresh mock, instead
// of short-circuiting on the process-lifetime cache meant for production.
export function __resetIndexCacheForTests(): void {
  appIndexesEnsured = false;
}
