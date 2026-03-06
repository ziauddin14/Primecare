export type AppointmentStatus = 
  | "NEW" 
  | "CONFIRMED" 
  | "ARRIVED" 
  | "IN CONSULTATION" 
  | "COMPLETED" 
  | "CANCELLED" 
  | "NO-SHOW";

export interface StatusHistoryEntry {
  status: AppointmentStatus;
  changedAt: Date;
  note?: string;
  updatedBy?: string; // "receptionist", "admin", "system"
}

export interface Appointment {
  _id?: string;
  patientId: string;
  doctorId: string;
  department: string;
  date: string;       // "2026-03-20"
  startTime: string;  // "10:00"
  endTime: string;    // "10:15"
  status: AppointmentStatus;
  statusHistory: StatusHistoryEntry[];
  
  // Workflow Timestamps
  confirmedAt?: Date;
  arrivedAt?: Date;
  consultationStartedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  noShowAt?: Date;
  
  cancellationReason?: string;
  internalNotes?: string;
  
  visitType: string;  // "consultation", "follow-up", etc.
  notes?: string;     // Initial patient notes
  createdAt: Date;
  updatedAt: Date;
}
