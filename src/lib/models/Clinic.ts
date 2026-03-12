export interface ClinicConfig {
  _id?: string;
  name: string;
  logo?: string;
  phone: string;
  email: string;
  address: string;
  workingHours: {
    start: string; // "09:00"
    end: string;   // "18:00"
    days: string[]; // ["Monday", "Tuesday", ...]
  };
  appointmentDuration: number; // in minutes
  branding: {
    primaryColor: string;
    secondaryColor: string;
  };
  updatedAt: Date;
}
