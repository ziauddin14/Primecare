"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaSyncAlt,
  FaUserPlus,
  FaSearch,
  FaCalendarCheck,
  FaClock,
  FaCheckCircle,
  FaStethoscope,
  FaTimesCircle,
  FaUserInjured,
  FaUsers,
  FaChevronRight,
  FaArrowUp,
  FaCalendarAlt,
  FaHospitalUser,
  FaEllipsisV,
  FaTimes,
  FaCog,
  FaMagic,
  FaShieldAlt,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { AppointmentStatus } from "@/lib/models/Appointment";

type Stats = {
  total: number;
  requested: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  noShows: number;
};

const statusFlow = [
  {
    key: "REQUESTED",
    label: "Requested",
    color: "bg-slate-100 text-slate-600",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
  {
    key: "CONFIRMED",
    label: "Confirmed",
    color: "bg-blue-50 text-blue-600",
    border: "border-blue-100",
    dot: "bg-blue-500",
  },
  {
    key: "COMPLETED",
    label: "Completed",
    color: "bg-emerald-50 text-emerald-600",
    border: "border-emerald-100",
    dot: "bg-emerald-500",
  },
  {
    key: "CANCELLED",
    label: "Cancelled",
    color: "bg-red-50 text-red-600",
    border: "border-red-100",
    dot: "bg-red-500",
  },
  {
    key: "NO_SHOW",
    label: "No-Show",
    color: "bg-rose-50 text-rose-600",
    border: "border-rose-100",
    dot: "bg-rose-500",
  },
];

export default function ReceptionDashboard() {
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [totalPatients, setTotalPatients] = useState(0);

  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [updateNote, setUpdateNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<AppointmentStatus | null>(
    null,
  );

  const router = useRouter();

  const load = async () => {
    setLoading(true);
    try {
      const [resToday, resDocs, resPats] = await Promise.all([
        fetch("/api/admin/today"),
        fetch("/api/doctors"),
        fetch("/api/patients"),
      ]);

      if (resToday.status === 401) {
        router.push("/login");
        return;
      }

      const [jsonToday, jsonDocs, jsonPats] = await Promise.all([
        resToday.json(),
        resDocs.json(),
        resPats.json(),
      ]);

      if (jsonToday.ok) {
        setData(jsonToday.appointments || []);
        setStats(jsonToday.stats);
      }
      if (jsonDocs.ok) setTotalDoctors(jsonDocs.doctors?.length || 0);
      if (jsonPats.ok) setTotalPatients(jsonPats.patients?.length || 0);
    } catch (err) {
      console.error("Dashboard load failed", err);
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

  const resetDemo = async () => {
    if (
      !confirm(
        "Are you sure you want to reset the demo data? All current changes will be lost.",
      )
    )
      return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/seed", { method: "POST" });
      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error("Seed failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter((a) => {
      const pName = a.patientInfo?.fullName || a.patientInfo?.name || "";
      const pPhone = a.patientInfo?.phone || "";
      return (
        pName.toLowerCase().includes(search.toLowerCase()) ||
        pPhone.includes(search)
      );
    });
  }, [data, search]);

  const mainStatsCards = [
    {
      label: "Active Patients",
      value: totalPatients,
      growth: "+12%",
      icon: <FaUsers />,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Confirmed Today",
      value: stats?.confirmed || 0,
      growth: "Live",
      icon: <FaCalendarCheck />,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "In Waitlist",
      value: stats?.requested || 0,
      growth: "New",
      icon: <FaClock />,
      color: "text-slate-600",
      bg: "bg-slate-50",
    },
    {
      label: "Completed Visits",
      value: stats?.completed || 0,
      growth: "+5%",
      icon: <FaCheckCircle />,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "No-Shows / Cancelled",
      value: (stats?.noShows || 0) + (stats?.cancelled || 0),
      growth: "Today",
      icon: <FaTimesCircle />,
      color: "text-red-600",
      bg: "bg-red-50",
    },
  ];

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Overview
          </h1>
          <p className="text-sm text-slate-500 font-medium tracking-tight">
            Manage your clinic operations in real-time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={resetDemo}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-black uppercase tracking-widest border border-rose-100 hover:bg-rose-100 transition-all active:scale-95 group"
          >
            <FaMagic className="group-hover:rotate-12 transition-transform" />{" "}
            Reset Demo
          </button>
          <button
            onClick={() => router.push("/admin/doctor/schedule")}
            className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-lg shadow-slate-200 hover:bg-black transition-all active:scale-95"
          >
            <FaCalendarAlt /> Live Schedule
          </button>
          <button
            onClick={load}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm active:scale-95"
          >
            <FaSyncAlt className={loading ? "animate-spin" : "text-sm"} />
          </button>
        </div>
      </div>

      {/* Demo Alert */}
      <div className="bg-blue-600 rounded-[2rem] p-6 text-white shadow-2xl shadow-blue-100 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 bg-white/10 rounded-3xl flex items-center justify-center text-3xl backdrop-blur-md border border-white/20">
              <FaShieldAlt />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight">
                Softwaremine Agency Showcase
              </h3>
              <p className="text-blue-100 text-xs font-bold uppercase tracking-widest opacity-80">
                This is a live preview environment using realistic synthetic
                data.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-5 py-2 bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
              V1.4 Stable
            </div>
          </div>
        </div>
        <FaHospitalUser className="absolute -right-20 -bottom-20 text-[20rem] text-white/5 -rotate-12" />
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          {
            label: "Appointments",
            path: "/admin/appointments",
            icon: <FaCalendarCheck />,
            sub: "Manage clinical load",
          },
          {
            label: "Patient Directory",
            path: "/admin/patients",
            icon: <FaUsers />,
            sub: "Secure medical records",
          },
          {
            label: "Clinic Settings",
            path: "/admin/settings",
            icon: <FaCog />,
            sub: "Branding & Operations",
          },
        ].map((nav) => (
          <button
            key={nav.label}
            onClick={() => router.push(nav.path)}
            className="flex items-center gap-6 p-6 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 group transition-all text-left"
          >
            <div className="h-14 w-14 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all flex items-center justify-center text-2xl shadow-inner">
              {nav.icon}
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                {nav.label}
              </h4>
              <p className="text-[10px] font-bold text-slate-400">{nav.sub}</p>
            </div>
            <FaChevronRight className="ml-auto text-slate-200 group-hover:text-blue-400 transition-colors" />
          </button>
        ))}
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainStatsCards.map((card, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={card.label}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
          >
            <div className="flex items-start justify-between relative z-10">
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {card.label}
                </span>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold text-slate-900 leading-none">
                    {card.value}
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <FaArrowUp className="text-[8px]" /> {card.growth}
                  </span>
                </div>
              </div>
              <div
                className={`${card.bg} ${card.color} p-3 rounded-xl text-lg shadow-sm group-hover:scale-110 transition-transform`}
              >
                {card.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="space-y-8">
        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 px-1">
              Appointments Trend
            </h2>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[300px] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Weekly Volume
                </p>
                <p className="text-lg font-bold text-emerald-600">+24%</p>
              </div>
              <div className="flex items-end justify-between gap-1 h-32 pt-4">
                {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                  <div key={i} className="flex-1 group relative">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      className="w-full rounded-t-lg transition-all bg-blue-100 group-hover:bg-blue-600"
                    />
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {h}%
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase pt-2">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 px-1">
              Patient Growth
            </h2>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[300px] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Monthly Growth
                </p>
                <p className="text-lg font-bold text-emerald-600">+12%</p>
              </div>
              <div className="flex items-end justify-between gap-2 h-32 pt-4">
                {[30, 45, 60, 50, 70, 85, 100].map((h, i) => (
                  <div key={i} className="flex-1 group relative">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      className="w-full rounded-t-sm transition-all bg-emerald-500 hover:bg-emerald-600 shadow-sm"
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase pt-2">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
                <span>Jul</span>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments Table Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 px-1">
              Today's Appointments
            </h2>
            <button className="text-xs font-bold text-blue-600 hover:underline">
              View All
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[300px]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Patient Name
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Time Slot
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <AnimatePresence mode="popLayout">
                    {filteredData.map((app) => {
                      const status =
                        statusFlow.find((s) => s.key === app.status) ||
                        statusFlow[0];
                      return (
                        <motion.tr
                          layout
                          key={app._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className={`group hover:bg-slate-50/50 transition-colors ${updatingId === app._id ? "opacity-50 pointer-events-none" : ""}`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-blue-600 uppercase shadow-inner">
                                {(
                                  app.patientInfo?.fullName ||
                                  app.patientInfo?.name ||
                                  "??"
                                )
                                  .split(" ")
                                  .map((n: any) => n[0])
                                  .join("")
                                  .slice(0, 2)}
                              </div>
                              <span className="text-sm font-bold text-slate-900">
                                {app.patientInfo?.fullName ||
                                  app.patientInfo?.name ||
                                  "Unknown Patient"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-slate-700">
                                {app.doctorInfo?.name}
                              </span>
                              <span className="text-[10px] font-medium text-slate-400 uppercase">
                                {app.doctorInfo?.department}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                              <FaClock className="text-slate-300 text-xs" />
                              {app.startTime}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${status.color} ${status.border}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${status.dot}`}
                              />
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {app.status === "REQUESTED" && (
                                <button
                                  onClick={() =>
                                    updateStatus(app._id, "CONFIRMED")
                                  }
                                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-blue-700 transition-all"
                                >
                                  Confirm
                                </button>
                              )}
                              {app.status === "CONFIRMED" && (
                                <button
                                  onClick={() =>
                                    updateStatus(app._id, "COMPLETED")
                                  }
                                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-emerald-700 transition-all"
                                >
                                  Complete
                                </button>
                              )}
                              <button
                                onClick={() => setSelectedApp(app)}
                                className="p-2 bg-white text-slate-400 rounded-lg shadow-sm border border-slate-200 hover:bg-blue-50 hover:text-blue-600 transition-all"
                              >
                                <FaChevronRight className="text-[10px]" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                  {!loading && filteredData.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-slate-400 italic text-sm font-medium"
                      >
                        No appointments found for today.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Detail Sidebar (Drawer) */}
      <AnimatePresence>
        {selectedApp && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedApp(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-[480px] bg-white z-[110] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                    <FaUserInjured />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Appointment Detail
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                    Patient Information
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-2xl font-bold text-blue-600 shadow-sm">
                      {selectedApp.patientInfo?.fullName[0]}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">
                        {selectedApp.patientInfo?.fullName}
                      </h3>
                      <p className="text-sm text-slate-500 font-medium">
                        {selectedApp.patientInfo?.phone}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Time Slot
                    </p>
                    <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <FaClock className="text-blue-500" />{" "}
                      {selectedApp.startTime}
                    </p>
                  </div>
                  <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Date
                    </p>
                    <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <FaCalendarAlt className="text-blue-500" />{" "}
                      {selectedApp.date}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                    Status Management
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {statusFlow.map((s) => (
                      <button
                        key={s.key}
                        onClick={() => updateStatus(selectedApp._id, s.key)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all border ${selectedApp.status === s.key ? `${s.color} ${s.border} ring-2 ring-blue-100 shadow-sm` : "bg-white text-slate-400 border-slate-100 hover:border-slate-300"}`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-slate-900 rounded-2xl text-white relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">
                      Doctor in Charge
                    </p>
                    <h4 className="text-lg font-bold mb-1">
                      {selectedApp.doctorInfo?.name}
                    </h4>
                    <p className="text-xs text-blue-400 font-bold uppercase tracking-wider">
                      {selectedApp.doctorInfo?.department}
                    </p>
                  </div>
                  <FaStethoscope className="absolute -right-4 -bottom-4 text-8xl text-white/5 rotate-12" />
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                <button
                  onClick={() => setSelectedApp(null)}
                  className="w-full py-4 bg-white border border-slate-200 text-slate-900 font-bold rounded-xl shadow-sm hover:bg-slate-50 active:scale-[0.98] transition-all"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
