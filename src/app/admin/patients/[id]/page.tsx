"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FaSyncAlt,
  FaUserInjured,
  FaPhone,
  FaEnvelope,
  FaCalendarAlt,
  FaClock,
  FaStethoscope,
  FaArrowLeft,
  FaNotesMedical,
  FaCheckCircle,
  FaTimesCircle,
  FaHeartbeat,
  FaVial,
  FaMapMarkerAlt,
  FaVenusMars,
  FaBirthdayCake,
  FaHistory,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

type Patient = {
  _id: string;
  fullName: string;
  phone: string;
  email?: string;
  gender?: string;
  age?: number;
  address?: string;
  bloodGroup?: string;
  allergies?: string;
  chronicConditions?: string;
  createdAt: string;
};

type Appointment = {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  visitType: string;
  notes?: string;
  internalNotes?: string;
  doctorInfo: {
    name: string;
    department: string;
  };
};

export default function PatientProfile() {
  const { id } = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visitHistory, setVisitHistory] = useState<Appointment[]>([]);
  const [upcoming, setUpcoming] = useState<Appointment | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/patients/${id}`);
      const json = await res.json();
      if (json.ok) {
        setPatient(json.patient);
        setVisitHistory(json.visitHistory);
        setUpcoming(json.upcoming);
        setStats(json.stats);
      }
    } catch {
      console.error("Failed to load patient records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading)
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <FaSyncAlt className="animate-spin text-blue-600 text-3xl" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          Compiling Records...
        </p>
      </div>
    );

  if (!patient)
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 text-2xl">
          <FaUserInjured />
        </div>
        <div>
          <p className="text-slate-900 font-bold text-lg text-center">
            Patient Record Not Found
          </p>
          <p className="text-slate-500 font-medium text-sm text-center">
            The requested record does not exist or has been removed.
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="mt-4 px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-2"
        >
          <FaArrowLeft className="text-xs" /> Go Back
        </button>
      </div>
    );

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Profile Header Block */}
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-wider group w-fit"
        >
          <FaArrowLeft className="text-xs group-hover:-translate-x-1 transition-transform" />{" "}
          Back to Directory
        </button>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 text-9xl text-slate-50 opacity-50 z-0 select-none rotate-12 pointer-events-none">
            <FaUserInjured />
          </div>

          <div className="flex items-center gap-6 relative z-10">
            <div className="h-24 w-24 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-blue-200">
              {patient.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-none">
                  {patient.fullName}
                </h1>
                <span className="px-2.5 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                  ID: {patient._id.slice(-6)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-500 mt-3">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <FaPhone className="text-blue-500 text-xs" /> {patient.phone}
                </span>
                {patient.email && (
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <FaEnvelope className="text-blue-500 text-xs" />{" "}
                    {patient.email}
                  </span>
                )}
                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs font-bold uppercase tracking-wider">
                  Active Since{" "}
                  {new Date(patient.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 relative z-10">
            <div className="p-5 px-6 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 text-xl shadow-sm">
                <FaHistory />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">
                  Total Visits
                </span>
                <span className="text-2xl font-bold text-slate-900 leading-none">
                  {stats?.total || 0}
                </span>
              </div>
            </div>
            <div className="p-5 px-6 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4 text-white">
              <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 text-xl">
                <FaCheckCircle />
              </div>
              <div>
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest block mb-0.5">
                  Success Rate
                </span>
                <span className="text-2xl font-bold leading-none">
                  {stats?.total > 0
                    ? Math.round((stats.completed / stats.total) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Medical Profile & Vitals */}
        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 px-1">
              Clinical Vitals
            </h2>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-2 relative overflow-hidden group">
                  <div className="absolute -right-2 -bottom-2 text-4xl text-blue-500/5 group-hover:scale-110 transition-transform">
                    <FaVenusMars />
                  </div>
                  <FaVenusMars className="text-blue-500 text-lg relative z-10" />
                  <div className="relative z-10">
                    <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">
                      Gender
                    </h4>
                    <p className="text-sm font-bold text-slate-800 capitalize">
                      {patient.gender || "Not Provided"}
                    </p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-2 relative overflow-hidden group">
                  <div className="absolute -right-2 -bottom-2 text-4xl text-indigo-500/5 group-hover:scale-110 transition-transform">
                    <FaBirthdayCake />
                  </div>
                  <FaBirthdayCake className="text-indigo-500 text-lg relative z-10" />
                  <div className="relative z-10">
                    <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">
                      Age
                    </h4>
                    <p className="text-sm font-bold text-slate-800">
                      {patient.age || "??"} Years
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-red-50 border border-red-100 flex items-center gap-4 relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 text-6xl text-red-500/10 rotate-12 group-hover:rotate-0 transition-transform">
                  <FaVial />
                </div>
                <div className="h-12 w-12 rounded-xl bg-red-500 flex items-center justify-center text-white text-lg shadow-sm shadow-red-200 relative z-10">
                  <FaVial />
                </div>
                <div className="relative z-10">
                  <h4 className="text-[10px] font-bold uppercase text-red-700 tracking-widest mb-0.5">
                    Blood Group
                  </h4>
                  <p className="text-xl font-bold text-red-900 leading-none">
                    {patient.bloodGroup || "O+"}
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest mb-2 flex items-center gap-2">
                    <FaNotesMedical className="text-slate-400" /> Known
                    Allergies
                  </h4>
                  <div className="bg-slate-50 p-4 rounded-xl text-xs font-medium text-slate-700 leading-relaxed border border-slate-100">
                    {patient.allergies || "No documented allergies."}
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest mb-2 flex items-center gap-2">
                    <FaHeartbeat className="text-slate-400" /> Chronic
                    Conditions
                  </h4>
                  <div className="bg-slate-50 p-4 rounded-xl text-xs font-medium text-slate-700 leading-relaxed border border-slate-100">
                    {patient.chronicConditions ||
                      "No chronic illnesses reported."}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Pipeline & History */}
        <div className="lg:col-span-2 space-y-8">
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 px-1">
              Upcoming Schedule
            </h2>
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
              {upcoming ? (
                <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="h-20 w-20 shrink-0 rounded-2xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center text-center shadow-inner">
                      <span className="text-[10px] font-bold uppercase text-blue-500 tracking-wider mb-0.5">
                        {new Date(upcoming.date).toLocaleString("default", {
                          month: "short",
                        })}
                      </span>
                      <span className="text-3xl font-bold text-blue-700 leading-none">
                        {upcoming.date.split("-")[2]}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 leading-tight mb-1/2">
                        {upcoming.doctorInfo.name}
                      </h3>
                      <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                        {upcoming.doctorInfo.department}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-xs font-bold text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <FaClock className="text-blue-500 text-[10px]" />{" "}
                          {upcoming.startTime}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-600 text-[9px] uppercase tracking-widest border border-amber-100">
                          {upcoming.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all shrink-0">
                    Manage Visit
                  </button>
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center justify-center gap-3 text-center">
                  <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 text-xl">
                    <FaCalendarAlt />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">
                      No scheduled visits
                    </p>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">
                      There are no upcoming appointments for this patient.
                    </p>
                  </div>
                  <button className="mt-2 px-5 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all shadow-sm">
                    Book Appointment
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-bold text-slate-900">
                Visit Timeline
              </h2>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[300px]">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-4">Date & Time</th>
                      <th className="px-6 py-4">Specialist</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <AnimatePresence>
                      {visitHistory.length > 0 ? (
                        visitHistory.map((h, idx) => (
                          <motion.tr
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            key={h._id}
                            className="hover:bg-slate-50/50 transition-colors group cursor-default"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center group-hover:border-blue-200 group-hover:bg-blue-50 transition-colors">
                                  <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600">
                                    {h.date.split("-")[2]}
                                  </span>
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 group-hover:text-blue-500">
                                    {new Date(h.date).toLocaleString(
                                      "default",
                                      { month: "short" },
                                    )}
                                  </span>
                                </div>
                                <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5 whitespace-nowrap">
                                  <FaClock className="text-slate-300 text-[10px]" />{" "}
                                  {h.startTime}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-900">
                                  {h.doctorInfo.name}
                                </span>
                                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                                  {h.doctorInfo.department}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider border ${h.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : h.status === "CANCELLED" ? "bg-red-50 text-red-700 border-red-100" : h.status === "NO-SHOW" ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-slate-50 text-slate-600 border-slate-200"}`}
                              >
                                {h.status}
                              </span>
                            </td>
                          </motion.tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-6 py-12 text-center">
                            <p className="text-sm font-medium text-slate-500 italic">
                              No past visits recorded.
                            </p>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
