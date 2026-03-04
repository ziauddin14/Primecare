import { Suspense } from "react";
import AppointmentClient from "./AppointmentClient";

export const metadata = {
  title: "Book Appointment",
  description:
    "Schedule your medical consultation at PrimeCare Clinic with our expert specialists. Fast and secure online booking.",
};

export default function AppointmentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center font-bold text-slate-500">
          Synchronizing Intake Flow...
        </div>
      }
    >
      <AppointmentClient />
    </Suspense>
  );
}
