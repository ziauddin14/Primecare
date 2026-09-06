export type VisitStatus = "OPEN" | "COMPLETED" | "CANCELLED";

// The clinic encounter that happens once a CONFIRMED appointment is acted
// on. Deliberately minimal - this is a workflow foundation, not an EMR:
// no diagnosis/prescription/clinical-record fields. One appointment maps
// to at most one Visit (see the unique index in src/lib/db/indexes.ts).
export interface Visit {
  _id?: string;
  appointmentId: string;
  patientId: string;
  doctorId?: string; // mirrors Appointment.doctorId's optionality
  visitDate: string; // snapshot of appointment.date at creation time, "YYYY-MM-DD"
  status: VisitStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // actor email from the authenticated session
  updatedBy?: string;
}
