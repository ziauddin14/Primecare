export type AppointmentStatus = 
  | "REQUESTED"
  | "CONFIRMED" 
  | "COMPLETED" 
  | "CANCELLED" 
  | "NO_SHOW";

export interface StatusHistoryEntry {
  status: AppointmentStatus;
  changedAt: Date;
  note?: string;
  updatedBy?: string; // "receptionist", "admin", "system"
}

export interface Appointment {
  _id?: string;
  patientId: string;
  doctorId?: string; // optional if not selected
  serviceId: string;
  department?: string;
  date: string;       // "2026-03-20"
  startTime: string;  // "10:00"
  endTime?: string;    // "10:15"
  status: AppointmentStatus;
  statusHistory: StatusHistoryEntry[];
  
  // Financial
  paymentStatus?: "unpaid" | "paid";
  
  // Medical
  reasonForVisit?: string;
  notes?: string;     // Initial patient notes
  
  // Tracking
  bookingSource?: "website" | "admin" | "walk-in";

  // Workflow Timestamps
  confirmedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  noShowAt?: Date;
  
  cancellationReason?: string;
  internalNotes?: string;
  
  visitType: string;  // "consultation", "follow-up", etc.
  createdAt: Date;
  updatedAt: Date;
}
