export type AppointmentStatus = "NEW" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

export interface Appointment {
  _id?: string;
  patientId: string;
  doctorId: string;
  department: string;
  date: string; // "2026-03-20"
  startTime: string; // "10:00"
  endTime: string;   // "10:15"
  status: AppointmentStatus;
  visitType: string; // "consultation", "follow-up", etc.
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
