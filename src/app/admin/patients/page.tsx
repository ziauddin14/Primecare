"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaSyncAlt,
  FaChevronRight,
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaPlus,
  FaHistory,
  FaEllipsisV,
  FaUserInjured,
  FaFemale,
  FaMale,
  FaPhone,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

type Patient = {
  _id: string;
  fullName: string;
  phone: string;
  gender?: string;
  age?: number;
  createdAt: string;
  totalVisits: number;
  lastVisit: any | null;
  upcomingAppointment: any | null;
};

export default function PatientsListing() {
  const [data, setData] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/patients");
      const json = await res.json();
      if (json.ok) setData(json.patients);
    } catch {
      console.error("Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(
      (p) =>
        p.fullName.toLowerCase().includes(search.toLowerCase()) ||
        p.phone.includes(search),
    );
  }, [data, search]);

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Patient Directory
          </h1>
          <p className="text-sm text-slate-500 font-medium tracking-tight">
            Access and manage all patient clinical records.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-blue-600 transition-all shadow-sm active:scale-95"
          >
            <FaSyncAlt className={loading ? "animate-spin" : "text-sm"} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">
            <FaPlus className="text-xs" /> Register Patient
          </button>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: "Total Records",
            val: data.length,
            icon: <FaUserInjured />,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Active This Month",
            val: data.filter((p) => p.totalVisits > 0).length,
            icon: <FaHistory />,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
          {
            label: "Pending Reviews",
            val: 0,
            icon: <FaFilter />,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4"
          >
            <div className={`${stat.bg} ${stat.color} p-3 rounded-xl text-lg`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {stat.label}
              </p>
              <p className="text-xl font-bold text-slate-900">{stat.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Patient Details
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Contact & Demographics
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Visit Statistics
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Upcoming Visit
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence mode="popLayout">
                {filteredData.map((p) => (
                  <motion.tr
                    layout
                    key={p._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="group hover:bg-slate-50/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/admin/patients/${p._id}`)}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-blue-600 text-xs shadow-sm shadow-slate-100 group-hover:scale-110 transition-transform">
                          {p.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 leading-tight mb-0.5">
                            {p.fullName}
                          </p>
                          <p className="text-[10px] font-medium text-slate-400 font-mono tracking-tighter capitalize">
                            UID: {p._id.slice(-8)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <FaPhone className="text-[10px] text-slate-300" />{" "}
                          {p.phone}
                        </p>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${p.gender === "Female" ? "bg-pink-50 text-pink-600 border border-pink-100" : "bg-blue-50 text-blue-600 border border-blue-100"}`}
                          >
                            {p.gender === "Female" ? (
                              <FaFemale className="inline mr-1" />
                            ) : (
                              <FaMale className="inline mr-1" />
                            )}
                            {p.gender || "Unknown"}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {p.age || "??"} Yrs
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-bold text-slate-900">
                          {p.totalVisits}{" "}
                          <span className="text-[10px] text-slate-400 font-medium">
                            Visits
                          </span>
                        </p>
                        {p.lastVisit && (
                          <p className="text-[10px] text-slate-400 font-medium">
                            Last:{" "}
                            <span className="font-bold text-slate-500">
                              {p.lastVisit.date}
                            </span>
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {p.upcomingAppointment ? (
                        <div className="flex items-center gap-2 py-1 px-3 bg-blue-50 border border-blue-100 rounded-lg w-fit">
                          <FaCalendarAlt className="text-blue-500 text-[10px]" />
                          <span className="text-[10px] font-bold text-blue-700">
                            {p.upcomingAppointment.date}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-300 italic">
                          No upcoming
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className="p-2 bg-slate-50 text-slate-400 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                        <FaChevronRight className="text-[10px]" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {!loading && filteredData.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 text-3xl">
                        <FaSearch />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-900">
                          No patients found
                        </p>
                        <p className="text-xs text-slate-500 font-medium">
                          Try adjusting your search or filters.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
