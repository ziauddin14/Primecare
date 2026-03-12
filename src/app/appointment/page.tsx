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
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-6">
          <div className="h-20 w-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin shadow-2xl shadow-blue-100" />
          <div className="text-center space-y-2">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
              PrimeCare
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">
              Synchronizing Intake Flow
            </p>
          </div>
        </div>
      }
    >
      <AppointmentClient />
    </Suspense>
  );
}
