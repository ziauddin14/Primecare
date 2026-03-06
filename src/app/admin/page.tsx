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
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

type Appointment = {
  _id: string;
  patientId: string;
  doctorId: string;
  department: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
  patientInfo: {
    fullName: string;
    phone: string;
    email: string;
  };
  doctorInfo: {
    name: string;
    department: string;
  };
};

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
  const [data, setData] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
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
      }
    } catch {
      setErrMsg("Network error.");
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
      if (res.ok) load();
    } catch (err) {
      console.error("Update failed", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed", err);
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
    <main className="bg-[#f8fafc] min-h-screen pb-20">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-100 py-6 sticky top-0 z-30 shadow-sm">
        <Container>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-100">
                <FaNotesMedical className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">
                  Reception Counter
                </h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />{" "}
                  Live Clinic Activity
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative group">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search Patient / Phone..."
                  className="pl-11 pr-6 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all w-full sm:w-[300px]"
                />
              </div>
              <button
                onClick={load}
                disabled={loading}
                className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 transition-all transition-active active:scale-95 disabled:opacity-50"
              >
                <FaSyncAlt className={loading ? "animate-spin" : ""} />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-all active:scale-95 border border-red-100 shadow-sm"
              >
                <FaSignOutAlt /> Sign Out
              </button>
            </div>
          </div>
        </Container>
      </div>

      <Container>
        <div className="py-8 space-y-8">
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
                className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-3 group hover:border-blue-200 transition-all"
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
                  <FaClock className="text-blue-600" /> Today's Pipeline
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
                              className={`${updatingId === a._id ? "opacity-50 grayscale select-none" : ""} hover:bg-slate-50/50 transition-colors`}
                            >
                              <td className="px-8 py-6">
                                <div className="flex items-center gap-4">
                                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-blue-600 text-xs border border-slate-200">
                                    {a.patientInfo?.fullName
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </div>
                                  <div>
                                    <h3 className="text-sm font-black text-slate-900 leading-tight mb-0.5">
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
                              <td className="px-8 py-6">
                                <div className="flex items-center justify-center gap-1.5">
                                  {a.status === "NEW" && (
                                    <button
                                      onClick={() =>
                                        updateStatus(a._id, "CONFIRMED")
                                      }
                                      className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-active active:scale-95 shadow-lg shadow-blue-100 text-xs font-bold px-4"
                                    >
                                      Confirm
                                    </button>
                                  )}
                                  {a.status === "CONFIRMED" && (
                                    <button
                                      onClick={() =>
                                        updateStatus(a._id, "ARRIVED")
                                      }
                                      className="p-2.5 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-active active:scale-95 shadow-lg shadow-purple-100 text-xs font-bold px-4"
                                    >
                                      Checked-In
                                    </button>
                                  )}
                                  {a.status === "ARRIVED" && (
                                    <button
                                      onClick={() =>
                                        updateStatus(a._id, "IN CONSULTATION")
                                      }
                                      className="p-2.5 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-active active:scale-95 shadow-lg shadow-amber-100 text-xs font-bold px-4"
                                    >
                                      Start Visit
                                    </button>
                                  )}
                                  {a.status === "IN CONSULTATION" && (
                                    <button
                                      onClick={() =>
                                        updateStatus(a._id, "COMPLETED")
                                      }
                                      className="p-2.5 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-active active:scale-95 shadow-lg shadow-green-100 text-xs font-bold px-4"
                                    >
                                      Finalize
                                    </button>
                                  )}
                                  {["NEW", "CONFIRMED", "ARRIVED"].includes(
                                    a.status,
                                  ) && (
                                    <button
                                      onClick={() =>
                                        updateStatus(a._id, "CANCELLED")
                                      }
                                      className="p-2.5 rounded-xl bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-active active:scale-95 text-xs font-black"
                                    >
                                      ×
                                    </button>
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

                <button className="w-full flex items-center justify-between p-6 rounded-[2rem] bg-white border border-slate-100 text-slate-900 hover:border-blue-200 transition-all group shadow-sm active:scale-95">
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

              {/* Health Reminder or Shift Notes */}
              <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                  <h4 className="text-xs font-black uppercase tracking-widest text-white/50 mb-4">
                    Reception Note
                  </h4>
                  <p className="text-sm font-semibold leading-relaxed mb-6 italic">
                    "Patient arrivals are peaking between 10:00 AM and 11:30 AM.
                    Ensure all 'Pending' items are confirmed before peak."
                  </p>
                  <div className="h-1 w-12 bg-white/30 rounded-full" />
                </div>
                <FaStethoscope className="absolute -bottom-6 -right-6 text-9xl text-white/10 rotate-12" />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
