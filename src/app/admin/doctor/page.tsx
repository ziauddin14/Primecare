"use client";

import { useEffect, useState } from "react";
import Container from "@/components/Container";
import {
  FaUserInjured,
  FaClock,
  FaCheckCircle,
  FaSyncAlt,
  FaNotesMedical,
  FaStethoscope,
  FaFilePrescription,
  FaCommentMedical,
  FaUserMd,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

export default function DoctorDashboard() {
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/doctor/appointments");
      const json = await res.json();
      if (json.ok) {
        setData(json.appointments);
        setStats(json.stats);
      }
    } catch {
      console.error("Failed to load schedule");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="py-12 pb-32">
      <Container>
        <div className="space-y-12">
          {/* Doctor Greeting Header */}
          <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-3">
                Today&apos;s Schedule
              </h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />{" "}
                Focus: Internal Visits & Consultations
              </p>
            </div>
            <button
              onClick={load}
              className="flex items-center gap-3 p-4 px-8 rounded-2xl bg-white border border-slate-100 text-slate-900 font-black text-xs uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all active:scale-95"
            >
              <FaSyncAlt className={loading ? "animate-spin" : ""} /> Sync
              Consultations
            </button>
          </header>

          {/* Stats summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "My Total",
                val: stats?.total || 0,
                icon: <FaStethoscope />,
                color: "text-indigo-600",
                bg: "bg-indigo-50",
              },
              {
                label: "Arrived",
                val: stats?.arrived || 0,
                icon: <FaUserInjured />,
                color: "text-purple-600",
                bg: "bg-purple-50",
              },
              {
                label: "Pending",
                val: stats?.pending || 0,
                icon: <FaClock />,
                color: "text-amber-600",
                bg: "bg-amber-50",
              },
              {
                label: "Completed",
                val: stats?.completed || 0,
                icon: <FaCheckCircle />,
                color: "text-green-600",
                bg: "bg-green-50",
              },
            ].map((s, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-4 group"
              >
                <div
                  className={`${s.bg} ${s.color} h-12 w-12 rounded-2xl flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform`}
                >
                  {s.icon}
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    {s.label}
                  </h4>
                  <p className="text-2xl font-black text-slate-800 leading-none">
                    {s.val}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Appointment Pipeline for Doctor */}
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <section className="lg:col-span-2 space-y-6">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-3 px-2">
                <FaClock className="text-indigo-600" /> Patient Queue
              </h2>

              <div className="space-y-4">
                {loading
                  ? Array(3)
                      .fill(0)
                      .map((_, i) => (
                        <div
                          key={i}
                          className="h-28 bg-white border border-slate-100 rounded-[2rem] animate-pulse"
                        />
                      ))
                  : data.map((a, idx) => (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={a._id}
                        onClick={() => setSelectedApp(a)}
                        className={`bg-white p-6 rounded-[2rem] border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-xl group ${selectedApp?._id === a._id ? "border-indigo-600 ring-4 ring-indigo-50 shadow-xl" : "border-slate-100 hover:border-indigo-200 shadow-sm"}`}
                      >
                        <div className="flex items-center gap-5">
                          <div className="h-14 w-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-lg font-black shadow-inner">
                            {a.patientInfo?.fullName
                              .split(" ")
                              .map((n: any) => n[0])
                              .join("")}
                          </div>
                          <div>
                            <h3 className="text-base font-black text-slate-900 leading-tight mb-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                              {a.patientInfo?.fullName}
                            </h3>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-white text-[9px] ${a.status === "ARRIVED" ? "bg-purple-600" : "bg-slate-300"}`}
                              >
                                {a.status}
                              </span>
                              • ID: {a._id.slice(-6).toUpperCase()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-8 text-right shrink-0">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-800">
                              {a.startTime}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono italic">
                              Consultation
                            </span>
                          </div>
                          <div
                            className={`h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm`}
                          >
                            <FaSyncAlt className="text-xs group-hover:scale-125 transition-transform" />
                          </div>
                        </div>
                      </motion.div>
                    ))}

                {!loading && data.length === 0 && (
                  <div className="py-20 bg-white border-2 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center gap-4 text-slate-200 italic">
                    <FaStethoscope className="text-6xl" />
                    <p className="text-sm font-black uppercase tracking-widest text-slate-300">
                      No Patient visits listed today
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Consultation Context Panel */}
            <aside className="space-y-6 lg:sticky lg:top-24">
              <h2 className="text-lg font-black text-slate-900 px-2">
                Clinical Context
              </h2>

              <AnimatePresence mode="wait">
                {selectedApp ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-2xl space-y-8 relative overflow-hidden"
                  >
                    {/* Context Decor */}
                    <div className="absolute top-0 right-0 p-8 text-8xl text-slate-50 opacity-50 z-0 select-none rotate-12">
                      <FaNotesMedical />
                    </div>

                    <div className="relative z-10 space-y-8">
                      <div>
                        <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4">
                          Patient Snapshot
                        </h4>
                        <div className="flex items-center gap-5">
                          <div className="h-16 w-16 rounded-[1.5rem] bg-slate-900 flex items-center justify-center text-white text-xl font-black shadow-xl">
                            {selectedApp.patientInfo?.fullName[0]}
                          </div>
                          <div>
                            <p className="text-xl font-black text-slate-900 leading-none mb-1">
                              {selectedApp.patientInfo?.fullName}
                            </p>
                            <p className="text-xs font-bold text-slate-400">
                              Gender: Male • Age: 24 • ID:{" "}
                              {selectedApp.patientId.slice(-6)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 flex items-center gap-4">
                          <FaFilePrescription className="text-indigo-600 text-xl" />
                          <div>
                            <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
                              Visit Purpose
                            </h5>
                            <p className="text-xs font-black text-slate-800">
                              {selectedApp.visitType || "General Consultation"}
                            </p>
                          </div>
                        </div>
                        <div className="p-5 rounded-3xl bg-amber-50 border border-amber-100 flex items-center gap-4">
                          <FaCommentMedical className="text-amber-600 text-xl" />
                          <div>
                            <h5 className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-1">
                              Reception Note
                            </h5>
                            <p className="text-xs font-bold text-slate-600 leading-relaxed italic">
                              &quot;
                              {selectedApp.notes ||
                                "No preliminary notes from desk."}
                              &quot;
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 font-bold text-xs text-slate-400 leading-relaxed italic">
                        * Ensure patient history is reviewed before starting
                        electronic records update.
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-4">
                        <button className="h-14 rounded-2xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">
                          Start Records
                        </button>
                        <button
                          onClick={() => setSelectedApp(null)}
                          className="h-14 rounded-2xl bg-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-12 border-2 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 text-center"
                  >
                    <FaUserMd className="text-5xl text-slate-100" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 leading-relaxed">
                      Select a patient from queue to view clinical context &
                      history
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tips Section */}
              <div className="p-8 rounded-[2rem] bg-indigo-700 text-white shadow-2xl relative overflow-hidden group">
                <div className="relative z-10">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-6">
                    Workflow Intelligence
                  </h4>
                  <p className="text-sm font-semibold italic leading-relaxed mb-4 opacity-90">
                    &quot;Electronic prescription system is active. All medicine
                    flags will be verified against patient allergies
                    automatically.&quot;
                  </p>
                  <div className="h-1 w-12 bg-white/30 rounded-full" />
                </div>
                <FaSyncAlt className="absolute -bottom-6 -right-6 text-8xl text-white/5 rotate-12 group-hover:rotate-180 transition-transform duration-1000" />
              </div>
            </aside>
          </div>
        </div>
      </Container>
    </div>
  );
}
