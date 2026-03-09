"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaSyncAlt,
  FaSearch,
  FaCalendarCheck,
  FaClock,
  FaCheckCircle,
  FaStethoscope,
  FaTimesCircle,
  FaUserInjured,
  FaChevronRight,
  FaCalendarAlt,
  FaEllipsisV,
  FaTimes,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const statusFlow = [
  {
    key: "NEW",
    label: "Pending",
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
    key: "ARRIVED",
    label: "Arrived",
    color: "bg-indigo-50 text-indigo-600",
    border: "border-indigo-100",
    dot: "bg-indigo-500",
  },
  {
    key: "IN CONSULTATION",
    label: "In Visit",
    color: "bg-amber-50 text-amber-600",
    border: "border-amber-100",
    dot: "bg-amber-500",
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
    key: "NO-SHOW",
    label: "No-Show",
    color: "bg-rose-50 text-rose-600",
    border: "border-rose-100",
    dot: "bg-rose-500",
  },
];

export default function AppointmentsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/appointments");
      const json = await res.json();
      if (json.ok) {
        setData(json.appointments || []);
      }
    } catch (err) {
      console.error("Failed to load appointments", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        load();
        if (selectedApp && selectedApp._id === id) {
          setSelectedApp((prev: any) => ({ ...prev, status }));
        }
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
        a.patientInfo?.phone.includes(search) ||
        a.doctorInfo?.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [data, search]);

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            All Appointments
          </h1>
          <p className="text-sm text-slate-500 font-medium tracking-tight">
            Manage your clinic's entire appointment history.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient or doctor..."
              className="pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all w-full sm:w-[280px] shadow-sm"
            />
          </div>
          <button
            onClick={load}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm active:scale-95"
          >
            <FaSyncAlt className={loading ? "animate-spin" : "text-sm"} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
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
                  Date / Time
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
                          <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-blue-600 uppercase shadow-inner">
                            {app.patientInfo?.fullName
                              .split(" ")
                              .map((n: any) => n[0])
                              .join("")}
                          </div>
                          <span className="text-sm font-bold text-slate-900">
                            {app.patientInfo?.fullName}
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
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                            <FaCalendarAlt className="text-slate-300 text-xs" />
                            {app.date}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500 mt-0.5">
                            <FaClock className="text-slate-300 text-xs" />
                            {app.startTime}
                          </div>
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
                    No appointments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
