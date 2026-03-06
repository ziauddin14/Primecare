export interface DoctorSchedule {
  days: string[];
  startTime: string; // "09:00"
  endTime: string;   // "16:00"
  breakStart?: string; // "13:00"
  breakEnd?: string;   // "14:00"
  slotDuration: number; // 15, 30, etc.
}

export interface Doctor {
  _id?: string;
  name: string;
  department: string;
  consultationFee: number;
  schedule: DoctorSchedule;
  isActive: boolean;
  bio?: string;
  initial?: string;
}
