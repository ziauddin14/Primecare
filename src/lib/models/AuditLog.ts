export type AuditAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILURE"
  | "LOGOUT"
  | "APPOINTMENT_STATUS_UPDATE"
  | "APPOINTMENT_RESCHEDULE"
  | "APPOINTMENT_NOTES_UPDATE"
  | "APPOINTMENT_PAYMENT_UPDATE"
  | "DOCTOR_CREATE"
  | "CLINIC_SETTINGS_UPDATE"
  | "DEMO_DATA_SEEDED"
  | "AUTHORIZATION_DENIED"
  | "SERVICE_CREATE"
  | "SERVICE_UPDATE"
  | "SERVICE_DEACTIVATE"
  | "VISIT_CREATE"
  | "VISIT_UPDATE"
  | "VISIT_COMPLETE"
  | "VISIT_CANCEL";

export interface AuditLog {
  _id?: string;
  actorId: string | null; // userId; null when the actor could not be identified (e.g. failed login)
  actorEmail?: string;
  actorRole?: string;
  action: AuditAction;
  resource?: string; // "appointment" | "patient" | "doctor" | "user" | "settings" | "seed" | "service" | "visit"
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  createdAt: Date;
}
