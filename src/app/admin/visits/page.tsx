"use client";

import { useEffect, useState } from "react";
import {
  FaClipboardList,
  FaSyncAlt,
  FaPlay,
  FaCheckCircle,
  FaBan,
  FaSave,
} from "react-icons/fa";
import { motion } from "framer-motion";

interface AppointmentRow {
  _id: string;
  status: string;
  date: string;
  startTime: string;
  patientInfo?: { fullName?: string };
  doctorInfo?: { name?: string };
  serviceInfo?: { title?: string };
}

interface VisitRow {
  _id: string;
  appointmentId: string;
  patientId: string;
  doctorId?: string;
  visitDate: string;
  status: "OPEN" | "COMPLETED" | "CANCELLED";
  notes?: string;
}

export default function VisitsPage() {
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [visits, setVisits] = useState<VisitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const [apptRes, visitRes] = await Promise.all([
        fetch("/api/appointments"),
        fetch("/api/visits"),
      ]);
      const apptJson = await apptRes.json();
      const visitJson = await visitRes.json();
      if (apptJson.ok) setAppointments(apptJson.appointments);
      if (visitJson.ok) setVisits(visitJson.visits);
    } catch (err) {
      console.error("Failed to load visits data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const flash = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const visitedAppointmentIds = new Set(visits.map((v) => v.appointmentId));
  const readyForVisit = appointments.filter(
    (a) => a.status === "CONFIRMED" && !visitedAppointmentIds.has(a._id)
  );

  const startVisit = async (appointmentId: string) => {
    setBusyId(appointmentId);
    try {
      const res = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      });
      const json = await res.json();
      if (json.ok) {
        flash("Visit created");
        await load();
      } else {
        flash(json.message || "Failed to create visit");
      }
    } catch {
      flash("Failed to create visit");
    } finally {
      setBusyId(null);
    }
  };

  const updateVisit = async (id: string, body: Record<string, unknown>) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/visits/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.ok) {
        flash("Visit updated");
        await load();
      } else {
        flash(json.message || "Failed to update visit");
      }
    } catch {
      flash("Failed to update visit");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex justify-center">
        <FaSyncAlt className="animate-spin text-4xl text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <FaClipboardList className="text-blue-600" /> Visits
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Turn confirmed appointments into clinic encounters and track their status.
          </p>
        </div>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-xs font-bold"
          >
            {message}
          </motion.div>
        )}
      </div>

      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Ready for Visit</h2>
          <p className="text-xs text-slate-400 font-medium mt-1">Confirmed appointments without a visit yet.</p>
        </div>
        <table className="w-full text-sm">
          <tbody>
            {readyForVisit.map((a) => (
              <tr key={a._id} className="border-t border-slate-100">
                <td className="p-4 font-bold text-slate-900">{a.patientInfo?.fullName || "Unknown patient"}</td>
                <td className="p-4 text-slate-500">{a.doctorInfo?.name || "Any Specialist"}</td>
                <td className="p-4 text-slate-500">{a.serviceInfo?.title || "-"}</td>
                <td className="p-4 text-slate-500">{a.date} {a.startTime}</td>
                <td className="p-4 text-right">
                  <button
                    disabled={busyId === a._id}
                    onClick={() => startVisit(a._id)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all disabled:opacity-50 ml-auto"
                  >
                    {busyId === a._id ? <FaSyncAlt className="animate-spin" /> : <FaPlay />}
                    Start Visit
                  </button>
                </td>
              </tr>
            ))}
            {readyForVisit.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                  No confirmed appointments waiting for a visit.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Visit Records</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="p-4">Visit Date</th>
              <th className="p-4">Status</th>
              <th className="p-4">Notes</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visits.map((v) => (
              <tr key={v._id} className="border-t border-slate-100">
                <td className="p-4 font-bold text-slate-900">{v.visitDate}</td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      v.status === "COMPLETED"
                        ? "bg-emerald-50 text-emerald-600"
                        : v.status === "CANCELLED"
                        ? "bg-red-50 text-red-600"
                        : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    {v.status}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <input
                      value={notesDraft[v._id] ?? v.notes ?? ""}
                      onChange={(e) => setNotesDraft({ ...notesDraft, [v._id]: e.target.value })}
                      className="w-full p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
                      placeholder="Add notes..."
                    />
                    <button
                      onClick={() => updateVisit(v._id, { notes: notesDraft[v._id] ?? v.notes ?? "" })}
                      className="text-slate-400 hover:text-blue-600 shrink-0"
                      title="Save notes"
                    >
                      <FaSave />
                    </button>
                  </div>
                </td>
                <td className="p-4">
                  {v.status === "OPEN" && (
                    <div className="flex items-center gap-3">
                      <button
                        disabled={busyId === v._id}
                        onClick={() => updateVisit(v._id, { status: "COMPLETED" })}
                        className="text-slate-400 hover:text-emerald-600 disabled:opacity-50"
                        title="Mark completed"
                      >
                        <FaCheckCircle />
                      </button>
                      <button
                        disabled={busyId === v._id}
                        onClick={() => updateVisit(v._id, { status: "CANCELLED" })}
                        className="text-slate-400 hover:text-red-600 disabled:opacity-50"
                        title="Cancel visit"
                      >
                        <FaBan />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {visits.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-400 font-medium">
                  No visits yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
