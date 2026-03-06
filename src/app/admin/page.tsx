"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Container from "@/components/Container";
import {
  FaSyncAlt,
  FaSignOutAlt,
  FaUserPlus,
  FaSearch,
  FaCalendarCheck,
  FaClock,
  FaCheckCircle,
  FaStethoscope,
  FaTimesCircle,
  FaUserInjured,
  FaNotesMedical,
  FaUsers,
  FaChevronRight,
  FaInfoCircle,
  FaChartPie,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { Appointment, AppointmentStatus } from "@/lib/models/Appointment";

type Stats = {
  total: number;
  pending: number;
  confirmed: number;
  arrived: number;
  completed: number;
  cancelled: number;
};

const statusFlow = [
  {
    key: "NEW",
    label: "Pending",
    color: "bg-slate-100 text-slate-600",
    border: "border-slate-200",
  },
  {
    key: "CONFIRMED",
    label: "Confirmed",
    color: "bg-blue-50 text-blue-600",
    border: "border-blue-100",
  },
  {
    key: "ARRIVED",
    label: "Arrived",
    color: "bg-purple-50 text-purple-600",
    border: "border-purple-100",
  },
  {
    key: "IN CONSULTATION",
    label: "In Visit",
    color: "bg-amber-50 text-amber-600",
    border: "border-amber-100",
  },
  {
    key: "COMPLETED",
    label: "Completed",
    color: "bg-green-50 text-green-600",
    border: "border-green-100",
  },
  {
    key: "CANCELLED",
    label: "Cancelled",
    color: "bg-red-50 text-red-600",
    border: "border-red-100",
  },
  {
    key: "NO-SHOW",
    label: "No-Show",
    color: "bg-red-50 text-red-600",
    border: "border-red-100",
  },
];

export default function ReceptionDashboard() {
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [updateNote, setUpdateNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<AppointmentStatus | null>(
    null,
  );

  const router = useRouter();

  const load = async () => {
    setLoading(true);
    setErrMsg("");
    try {
      const res = await fetch("/api/admin/today");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        setErrMsg("System sync waiting.");
        return;
      }
      const json = await res.json();
      if (json.ok) {
        setData(json.appointments || []);
        setStats(json.stats);
        if (selectedApp) {
          const updated = (json.appointments || []).find(
            (a: any) => a._id === selectedApp._id,
          );
          if (updated) setSelectedApp(updated);
        }
      }
    } catch {
      setErrMsg("Network error.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string, note?: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note }),
      });
      if (res.ok) {
        load();
        setShowNoteInput(null);
        setUpdateNote("");
        setPendingStatus(null);
      } else {
        const json = await res.json();
        alert(json.message || "Failed to update status");
      }
    } catch (err) {
      console.error("Update failed", err);
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(
      (a) =>
        a.patientInfo?.fullName.toLowerCase().includes(search.toLowerCase()) ||
        a.patientInfo?.phone.includes(search),
    );
  }, [data, search]);

  return (
    <div className="py-12">
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">
              Reception Counter
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />{" "}
              Live Daily Operational Flow
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Patient / Phone..."
                className="pl-11 pr-6 py-3 rounded-2xl bg-white border border-slate-100 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all w-full sm:w-[250px] shadow-sm"
              />
            </div>
            <button
              onClick={load}
              className="p-4 rounded-2xl bg-white border border-slate-100 text-slate-900 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
            >
              <FaSyncAlt className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        <div className="space-y-12">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {[
              {
                id: "total",
                label: "Appointments",
                val: stats?.total || 0,
                icon: <FaCalendarCheck />,
                color: "text-blue-600",
                bg: "bg-blue-50",
              },
              {
                id: "pending",
                label: "Pending",
                val: stats?.pending || 0,
                icon: <FaClock />,
                color: "text-slate-600",
                bg: "bg-slate-100",
              },
              {
                id: "confirmed",
                label: "Confirmed",
                val: stats?.confirmed || 0,
                icon: <FaCheckCircle />,
                color: "text-blue-600",
                bg: "bg-blue-50",
              },
              {
                id: "arrived",
                label: "Arrived",
                val: stats?.arrived || 0,
                icon: <FaUserInjured />,
                color: "text-purple-600",
                bg: "bg-purple-50",
              },
              {
                id: "completed",
                label: "Completed",
                val: stats?.completed || 0,
                icon: <FaStethoscope />,
                color: "text-green-600",
                bg: "bg-green-50",
              },
              {
                id: "cancelled",
                label: "No-Show / Cancel",
                val: stats?.cancelled || 0,
                icon: <FaTimesCircle />,
                color: "text-red-600",
                bg: "bg-red-50",
              },
            ].map((s) => (
              <div
                key={s.id}
                className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-3 group hover:border-blue-200 transition-all cursor-default"
              >
                <div
                  className={`${s.bg} ${s.color} h-10 w-10 rounded-xl flex items-center justify-center text-lg shadow-inner`}
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

          <div className="grid lg:grid-cols-4 gap-8 items-start">
            {/* Main Activity Table */}
            <div className="lg:col-span-3 space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-3">
                  <FaClock className="text-blue-600" /> Today&apos;s Pipeline
                </h2>
              </div>
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden min-h-[400px]">
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                      <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <th className="px-8 py-5">Patient & Specialist</th>
                        <th className="px-8 py-5">Slot</th>
                        <th className="px-8 py-5">Current Status</th>
                        <th className="px-8 py-5 text-center">Action Flow</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      <AnimatePresence mode="popLayout">
                        {filteredData.map((a) => {
                          const currentStatusObj =
                            statusFlow.find((s) => s.key === a.status) ||
                            statusFlow[0];
                          return (
                            <motion.tr
                              key={a._id}
                              layout
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className={`${updatingId === a._id ? "opacity-50 grayscale select-none" : ""} hover:bg-slate-50/50 transition-all cursor-pointer group`}
                              onClick={() => setSelectedApp(a)}
                            >
                              <td className="px-8 py-6">
                                <div className="flex items-center gap-4">
                                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-blue-600 text-xs border border-slate-200">
                                    {a.patientInfo?.fullName
                                      .split(" ")
                                      .map((n: any) => n[0])
                                      .join("")}
                                  </div>
                                  <div>
                                    <h3
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(
                                          `/admin/patients/${a.patientId}`,
                                        );
                                      }}
                                      className="text-sm font-black text-slate-900 leading-tight mb-0.5 hover:text-blue-600 transition-colors cursor-pointer decoration-blue-200/50 hover:underline underline-offset-4"
                                    >
                                      {a.patientInfo?.fullName}
                                    </h3>
                                    <p className="text-[11px] font-bold text-slate-400 tracking-wide uppercase">
                                      {a.doctorInfo?.name} •{" "}
                                      <span className="text-blue-500">
                                        {a.doctorInfo?.department}
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-6">
                                <div className="flex flex-col">
                                  <span className="text-[13px] font-black text-slate-800">
                                    {a.startTime}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                                    {a.endTime} End
                                  </span>
                                </div>
                              </td>
                              <td className="px-8 py-6">
                                <span
                                  className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border ${currentStatusObj.color} ${currentStatusObj.border} shadow-sm`}
                                >
                                  {currentStatusObj.label}
                                </span>
                              </td>
                              <td
                                className="px-8 py-6"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex flex-col items-center gap-2">
                                  {showNoteInput === a._id ? (
                                    <div className="flex flex-col gap-2 w-full max-w-[150px]">
                                      <input
                                        value={updateNote}
                                        onChange={(e) =>
                                          setUpdateNote(e.target.value)
                                        }
                                        placeholder="Update Note..."
                                        autoFocus
                                        className="text-[10px] font-bold p-2 border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100"
                                      />
                                      <div className="flex gap-1 justify-end">
                                        <button
                                          onClick={() => setShowNoteInput(null)}
                                          className="p-1 px-2 rounded-lg bg-slate-100 text-[10px] font-bold text-slate-400"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          onClick={() =>
                                            updateStatus(
                                              a._id,
                                              pendingStatus!,
                                              updateNote,
                                            )
                                          }
                                          className="p-1 px-2 rounded-lg bg-blue-600 text-white text-[10px] font-bold"
                                        >
                                          Conf.
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center gap-1.5">
                                      {a.status === "NEW" && (
                                        <button
                                          onClick={() => {
                                            setPendingStatus("CONFIRMED");
                                            setShowNoteInput(a._id);
                                          }}
                                          className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-active active:scale-95 shadow-lg shadow-blue-100 text-xs font-bold px-4"
                                        >
                                          Confirm
                                        </button>
                                      )}
                                      {a.status === "CONFIRMED" && (
                                        <button
                                          onClick={() => {
                                            setPendingStatus("ARRIVED");
                                            setShowNoteInput(a._id);
                                          }}
                                          className="p-2.5 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-active active:scale-95 shadow-lg shadow-purple-100 text-xs font-bold px-4"
                                        >
                                          Checked-In
                                        </button>
                                      )}
                                      {a.status === "ARRIVED" && (
                                        <button
                                          onClick={() => {
                                            setPendingStatus("IN CONSULTATION");
                                            setShowNoteInput(a._id);
                                          }}
                                          className="p-2.5 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-active active:scale-95 shadow-lg shadow-amber-100 text-xs font-bold px-4"
                                        >
                                          Start Visit
                                        </button>
                                      )}
                                      {a.status === "IN CONSULTATION" && (
                                        <button
                                          onClick={() => {
                                            setPendingStatus("COMPLETED");
                                            setShowNoteInput(a._id);
                                          }}
                                          className="p-2.5 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-active active:scale-95 shadow-lg shadow-green-100 text-xs font-bold px-4"
                                        >
                                          Finalize
                                        </button>
                                      )}
                                      {["NEW", "CONFIRMED", "ARRIVED"].includes(
                                        a.status,
                                      ) && (
                                        <button
                                          onClick={() => {
                                            setPendingStatus("CANCELLED");
                                            setShowNoteInput(a._id);
                                          }}
                                          className="p-2.5 rounded-xl bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-active active:scale-95 text-xs font-black"
                                        >
                                          ×
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                      {!loading && filteredData.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-8 py-20 text-center">
                            <div className="flex flex-col items-center gap-4 text-slate-300">
                              <FaCalendarCheck className="text-5xl" />
                              <p className="text-sm font-black uppercase tracking-widest text-slate-400">
                                No appointments scheduled for this flow.
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="space-y-6">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-3 px-2">
                Quick Desk
              </h2>
              <div className="space-y-3">
                <button
                  onClick={() => router.push("/appointment")}
                  className="w-full flex items-center justify-between p-6 rounded-[2rem] bg-blue-600 text-white hover:bg-blue-700 transition-all group shadow-xl shadow-blue-100 active:scale-95"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-2xl">
                      <FaUserPlus className="text-lg" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-sm font-black leading-tight">
                        New Booking
                      </h4>
                      <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest">
                        Appointment Panel
                      </p>
                    </div>
                  </div>
                  <FaSyncAlt className="text-white/20 group-hover:rotate-180 transition-transform duration-500" />
                </button>
                <button className="w-full flex items-center justify-between p-6 rounded-[2rem] bg-slate-900 text-white hover:bg-black transition-all group shadow-xl shadow-slate-200 active:scale-95">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/10 p-3 rounded-2xl">
                      <FaUserInjured className="text-lg" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-sm font-black leading-tight">
                        Walk-in Patient
                      </h4>
                      <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">
                        Rapid Intake
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => router.push("/admin/patients")}
                  className="w-full flex items-center justify-between p-6 rounded-[2rem] bg-white border border-slate-100 text-slate-900 hover:border-blue-200 transition-all group shadow-sm active:scale-95"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-50 p-3 rounded-2xl group-hover:bg-blue-50 transition-colors">
                      <FaUsers className="text-lg text-slate-400 group-hover:text-blue-600" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-sm font-black leading-tight">
                        All Patients
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Master Directory
                      </p>
                    </div>
                  </div>
                </button>
              </div>
              <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                  <h4 className="text-xs font-black uppercase tracking-widest text-white/50 mb-4">
                    Reception Note
                  </h4>
                  <p className="text-sm font-semibold leading-relaxed mb-6 italic">
                    &quot;Patient arrivals are peaking between 10:00 AM and
                    11:30 AM. Ensure all &apos;Pending&apos; items are confirmed
                    before peak.&quot;
                  </p>
                  <div className="h-1 w-12 bg-white/30 rounded-full" />
                </div>
                <FaStethoscope className="absolute -bottom-6 -right-6 text-9xl text-white/10 rotate-12" />
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* Appointment Detail Drawer */}
      <AnimatePresence>
        {selectedApp && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedApp(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-[450px] bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
                    <FaUserInjured />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 leading-tight">
                      Patient Details
                    </h2>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Workflow Timeline
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
                >
                  ×
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">
                        Patient Name
                      </h4>
                      <p className="text-sm font-black text-slate-800">
                        {selectedApp.patientInfo?.fullName}
                      </p>
                    </div>
                    <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">
                        Contact
                      </h4>
                      <p className="text-sm font-black text-slate-800">
                        {selectedApp.patientInfo?.phone}
                      </p>
                    </div>
                  </div>
                  <div className="p-6 rounded-[2rem] bg-slate-900 text-white flex items-center justify-between overflow-hidden relative">
                    <div className="relative z-10">
                      <h4 className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">
                        Appointment Slot
                      </h4>
                      <p className="text-xl font-black">
                        {selectedApp.startTime} - {selectedApp.endTime}
                      </p>
                      <p className="text-xs font-bold text-blue-400">
                        {selectedApp.date}
                      </p>
                    </div>
                    <FaClock className="text-6xl text-white/5 absolute -right-2 -bottom-2 rotate-12" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />{" "}
                    Clinical Specialist
                  </h3>
                  <div className="p-6 rounded-[2rem] border border-slate-100 bg-white flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
                      <FaStethoscope />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">
                        {selectedApp.doctorInfo?.name}
                      </p>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        {selectedApp.doctorInfo?.department}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />{" "}
                    Activity Timeline
                  </h3>
                  <div className="relative space-y-8 pl-8">
                    <div className="absolute left-[3.5px] top-2 bottom-2 w-0.5 bg-slate-100" />
                    {(selectedApp.statusHistory || []).map(
                      (h: any, idx: number) => {
                        const st =
                          statusFlow.find((s) => s.key === h.status) ||
                          statusFlow[0];
                        return (
                          <div key={idx} className="relative">
                            <div
                              className={`absolute -left-[31px] top-1 px-1 h-2 w-2 rounded-full border-2 border-white ${st.color.split(" ")[0]} ring-4 ring-slate-50`}
                            />
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between">
                                <span
                                  className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${st.color} ${st.border} border shadow-sm`}
                                >
                                  {st.label}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">
                                  {new Date(h.changedAt).toLocaleTimeString(
                                    [],
                                    { hour: "2-digit", minute: "2-digit" },
                                  )}
                                </span>
                              </div>
                              <p className="text-[11px] font-bold text-slate-500 leading-relaxed italic">
                                &quot;{h.note || "No notes provided."}&quot;
                              </p>
                              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                By {h.updatedBy || "admin"}
                              </p>
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              </div>
              <div className="p-8 border-t border-slate-100 bg-slate-50/50">
                <button
                  onClick={() => setSelectedApp(null)}
                  className="w-full py-4 rounded-2xl bg-white border border-slate-200 text-slate-900 font-black text-sm hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                >
                  Close Panel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
