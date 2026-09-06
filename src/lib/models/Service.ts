// Field is `title` (not `name`) to match the data already live in the
// `services` collection and every existing consumer (ServicesClient.tsx,
// AppointmentClient.tsx, the appointments API's department lookup).
export interface Service {
  _id?: string;
  title: string;
  department: string;
  description?: string;
  duration: number; // minutes
  price: number;
  isActive: boolean;
  createdAt?: Date; // absent on services seeded before Phase 3
  updatedAt?: Date;
}
