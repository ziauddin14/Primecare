export type UserRole = "ADMIN" | "DOCTOR" | "STAFF";

export interface User {
  _id?: string;
  name: string;
  email: string; // stored lowercase, unique
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  doctorId?: string; // present when role === "DOCTOR", links to Doctor._id
  createdAt: Date;
  updatedAt: Date;
}

// Shape safe to send to clients / store in a session - never includes passwordHash.
export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  doctorId?: string;
}
