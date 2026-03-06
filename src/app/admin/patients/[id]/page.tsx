"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Container from "@/components/Container";
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
  FaClock as FaClockIcon,
  FaHeartbeat,
  FaVial,
  FaMapMarkerAlt,
  FaIntersex,
  FaBirthdayCake,
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
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-4">
          <FaSyncAlt className="animate-spin text-blue-600 text-3xl" />
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
            Compiling Records...
          </p>
        </div>
      </div>
    );

  if (!patient) return null;

  return (
    <main className="bg-[#f8fafc] min-h-screen pb-20 overflow-x-hidden">
      {/* Top Profile Header */}
      <div className="bg-white border-b border-slate-100 py-10 sticky top-0 z-30 shadow-sm overflow-hidden">
        <div className="absolute top-0 right-0 p-12 text-9xl text-slate-50 opacity-50 select-none">
          <FaUserInjured className="rotate-12" />
        </div>
        <Container>
          <div className="relative z-10">
            <button
              onClick={() => router.back()}
              className="mb-8 flex items-center gap-2 text-xs font-black text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest group"
            >
              <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />{" "}
              Back to Records
            </button>

            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex items-center gap-8">
                <div className="h-28 w-28 rounded-[2.5rem] bg-blue-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-blue-100 border-4 border-white">
                  {patient.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                      {patient.fullName}
                    </h1>
                    <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                      ID: {patient._id.slice(-6)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-slate-400">
                    <span className="flex items-center gap-2">
                      <FaPhone className="text-blue-600" /> +{patient.phone}
                    </span>
                    {patient.email && (
                      <span className="flex items-center gap-2">
                        <FaEnvelope className="text-blue-600" /> {patient.email}
                      </span>
                    )}
                    <span className="flex items-center gap-2 uppercase tracking-widest font-black text-[10px]">
                      Since {new Date(patient.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="p-4 px-8 rounded-3xl bg-blue-50 border border-blue-100 text-center flex flex-col items-center justify-center">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">
                    Total Visits
                  </span>
                  <span className="text-3xl font-black text-blue-800 leading-none">
                    {stats?.total || 0}
                  </span>
                </div>
                <div className="p-4 px-8 rounded-3xl bg-slate-900 border border-slate-800 text-center flex flex-col items-center justify-center text-white">
                  <span className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">
                    Success Rate
                  </span>
                  <span className="text-3xl font-black leading-none">
                    {stats?.total > 0
                      ? Math.round((stats.completed / stats.total) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container>
        <div className="py-12 grid lg:grid-cols-3 gap-10">
          {/* Left Column: Medical Profile */}
          <div className="space-y-10">
            <section className="space-y-6">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
                <FaHeartbeat className="text-red-500" /> Clinical Vitals
              </h2>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col gap-2">
                    <FaIntersex className="text-blue-600 text-xl" />
                    <div>
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        Gender
                      </h4>
                      <p className="text-sm font-black text-slate-800 uppercase">
                        {patient.gender || "Not Set"}
                      </p>
                    </div>
                  </div>
                  <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col gap-2">
                    <FaBirthdayCake className="text-blue-600 text-xl" />
                    <div>
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        Current Age
                      </h4>
                      <p className="text-sm font-black text-slate-800">
                        {patient.age || "??"} Years
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-red-50/50 border border-red-100 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-red-600 flex items-center justify-center text-white text-xl shadow-lg shadow-red-100">
                    <FaVial />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-red-600 tracking-widest mb-1 leading-none">
                      Blood Group
                    </h4>
                    <p className="text-xl font-black text-slate-900">
                      {patient.bloodGroup || "O+"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />{" "}
                      Known Allergies
                    </h4>
                    <div className="bg-slate-50 p-4 rounded-2xl text-xs font-bold text-slate-600 leading-relaxed border border-slate-100">
                      {patient.allergies ||
                        "No documented drug or food allergies."}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />{" "}
                      Chronic Conditions
                    </h4>
                    <div className="bg-slate-50 p-4 rounded-2xl text-xs font-bold text-slate-600 leading-relaxed border border-slate-100">
                      {patient.chronicConditions ||
                        "General health is within normal range. No chronic illness reported."}
                    </div>
                  </div>
                  <div className="pt-4 flex items-start gap-4 text-xs font-bold text-slate-400 italic">
                    <FaMapMarkerAlt className="text-blue-600 mt-0.5 text-lg" />{" "}
                    {patient.address || "Lahore, Pakistan"}
                  </div>
                </div>
              </div>
            </section>

            {/* Internal Notes / Flags */}
            <section className="p-10 rounded-[2.5rem] bg-gradient-to-br from-slate-800 to-slate-950 text-white shadow-2xl relative overflow-hidden group">
              <FaNotesMedical className="absolute -bottom-6 -right-6 text-9xl text-white/5 rotate-12 group-hover:scale-110 transition-transform duration-500" />
              <div className="relative z-10">
                <h3 className="text-sm font-black uppercase tracking-widest text-white/50 mb-6 flex gap-2 items-center">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />{" "}
                  Reception Notes
                </h3>
                <p className="text-sm leading-relaxed font-bold opacity-80 mb-8 italic">
                  "Patient requires early morning slots... prefers Cardiology
                  follow-ups. Ensure insurance verification on visit."
                </p>
                <div className="h-1 w-16 bg-white/20 rounded-full" />
              </div>
            </section>
          </div>

          {/* Right Column: Pipeline & History */}
          <div className="lg:col-span-2 space-y-10">
            {/* Upcoming Appointment */}
            <section className="space-y-6">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
                <FaCalendarAlt className="text-blue-600" /> Priority Status
              </h2>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden relative">
                {upcoming ? (
                  <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="h-20 w-20 rounded-3xl bg-blue-600 flex flex-col items-center justify-center text-white text-center shadow-lg shadow-blue-100 border-b-4 border-blue-800">
                        <span className="text-[10px] font-black uppercase leading-none mb-1 opacity-70">
                          {upcoming.date.split("-")[1]}
                        </span>
                        <span className="text-3xl font-black leading-none">
                          {upcoming.date.split("-")[2]}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-800 leading-tight mb-1">
                          Next Visit with {upcoming.doctorInfo.name}
                        </h3>
                        <p className="text-sm font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                          <FaClockIcon /> {upcoming.startTime} •{" "}
                          {upcoming.doctorInfo.department}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="px-6 py-2 rounded-full bg-green-50 text-green-600 text-xs font-black border border-green-100 tracking-widest uppercase">
                        {upcoming.status}
                      </span>
                      <button
                        onClick={() => router.push("/admin")}
                        className="text-[10px] font-black underline uppercase text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        Manage Status
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 gap-3 opacity-50">
                    <FaCalendarAlt className="text-4xl text-slate-100 rotate-12" />
                    <p className="text-sm font-black uppercase text-slate-300 tracking-[0.2em] italic">
                      No Upcoming Pipeline
                    </p>
                    <button
                      onClick={() => router.push("/appointment")}
                      className="mt-2 px-6 py-2 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform active:scale-95 shadow-xl"
                    >
                      New Booking
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Visit History Log */}
            <section className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
                  <FaHistory className="text-purple-600" /> Patient Lifecycle
                  History
                </h2>
              </div>

              <div className="space-y-4">
                {visitHistory.map((h, idx) => (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={h._id}
                    className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-blue-200 transition-all"
                  >
                    <div className="flex items-center gap-5">
                      <div className="h-14 w-14 rounded-2xl bg-slate-50 flex flex-col items-center justify-center border border-slate-100 group-hover:bg-blue-50 transition-colors">
                        <span className="text-[13px] font-black text-slate-600">
                          {h.date.split("-")[2]}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">
                          {new Date(h.date).toLocaleString("default", {
                            month: "short",
                          })}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 leading-tight mb-1">
                          {h.doctorInfo.name}
                        </h4>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                          {h.doctorInfo.department} • ({h.visitType})
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-8">
                      <div className="flex flex-col items-center md:items-end">
                        <span className="text-[13px] font-black text-slate-800">
                          {h.startTime} - {h.endTime}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Consultation Slot
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {h.status === "COMPLETED" ? (
                          <FaCheckCircle className="text-green-500 text-xl" />
                        ) : h.status === "CANCELLED" ? (
                          <FaTimesCircle className="text-red-400 text-xl" />
                        ) : (
                          <FaClockIcon className="text-slate-300 text-xl" />
                        )}
                        <span
                          className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${h.status === "COMPLETED" ? "bg-green-50 text-green-600 border-green-100" : "bg-slate-50 text-slate-500 border-slate-100"}`}
                        >
                          {h.status}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {visitHistory.length === 0 && !loading && (
                  <div className="py-20 text-center flex flex-col items-center gap-4 text-slate-200">
                    <FaHistory className="text-6xl" />
                    <p className="text-sm font-black uppercase tracking-[0.2em] italic">
                      No visit history tracked
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </Container>
    </main>
  );
}
