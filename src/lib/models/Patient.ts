export interface Patient {
  _id?: string;
  fullName: string;
  phone: string;
  email?: string;
  gender?: string;
  age?: number;
  address?: string;
  bloodGroup?: string;
  allergies?: string;
  chronicConditions?: string;
  createdAt: Date;
}
