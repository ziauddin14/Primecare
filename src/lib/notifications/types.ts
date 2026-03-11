export enum NotificationEventType {
  APPOINTMENT_REQUESTED = "APPOINTMENT_REQUESTED",
  APPOINTMENT_CONFIRMED = "APPOINTMENT_CONFIRMED",
  APPOINTMENT_RESCHEDULED = "APPOINTMENT_RESCHEDULED",
  APPOINTMENT_CANCELLED = "APPOINTMENT_CANCELLED",
  APPOINTMENT_REMINDER = "APPOINTMENT_REMINDER",
}

export interface NotificationPayload {
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  doctorName?: string;
  date: string;
  time: string;
  clinicName: string;
  metadata?: Record<string, any>;
}
