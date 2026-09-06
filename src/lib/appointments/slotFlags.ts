import type { AppointmentStatus } from "@/lib/models/Appointment";

// Statuses that occupy a real slot on the calendar. CANCELLED/NO_SHOW free
// the slot back up - this mirrors the $nin: ["CANCELLED","NO_SHOW"] check
// already used by the existing (application-level) conflict checks.
const ACTIVE_STATUSES: AppointmentStatus[] = ["REQUESTED", "CONFIRMED", "COMPLETED"];

export function isActiveStatus(status: AppointmentStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}

// doctorSlotActive/patientSlotActive are the marker fields the partial
// unique indexes (see src/lib/db/indexes.ts) key off of. A document only
// participates in the doctor-slot uniqueness constraint while
// doctorSlotActive === true, and only participates in the patient-slot
// constraint while patientSlotActive === true. Computing them from a single
// place keeps creation/status-update/reschedule consistent.
export function computeSlotFlags(doctorId: string | null | undefined, status: AppointmentStatus) {
  const active = isActiveStatus(status);
  return {
    doctorSlotActive: active && !!doctorId ? (true as const) : undefined,
    patientSlotActive: active ? (true as const) : undefined,
  };
}

// Builds the $set/$unset pair to apply the flags above to an existing
// document via updateOne - MongoDB unique+partial indexes only see a field
// as "present" via $set with a matching value, so a no-longer-active
// document must have the field removed with $unset, not set to false.
export function slotFlagUpdate(doctorId: string | null | undefined, status: AppointmentStatus) {
  const { doctorSlotActive, patientSlotActive } = computeSlotFlags(doctorId, status);
  const set: Record<string, true> = {};
  const unset: Record<string, "" > = {};

  if (doctorSlotActive) set.doctorSlotActive = true;
  else unset.doctorSlotActive = "";

  if (patientSlotActive) set.patientSlotActive = true;
  else unset.patientSlotActive = "";

  return { set, unset };
}
