"use client";

import { useEffect, useState } from "react";
import {
  FaUserMd,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaStethoscope,
  FaPhone,
  FaEnvelope,
  FaCalendarAlt,
} from "react-icons/fa";
import { motion } from "framer-motion";

export default function DoctorsList() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [performance, setPerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [docRes, perfRes] = await Promise.all([
        fetch("/api/doctors"),
        fetch("/api/admin/analytics?range=30d"),
      ]);

      if (docRes.ok && perfRes.ok) {
        const docJson = await docRes.json();
        const perfJson = await perfRes.json();
        setDoctors(docJson.doctors || []);
        setPerformance(perfJson.doctorPerformance || []);
      }
    } catch {
      console.error("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Doctors Directory
          </h1>
          <p className="text-sm text-slate-500 font-medium tracking-tight">
            Manage your clinic's specialists and monitor performance.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">Specialist Details</th>
                <th className="px-6 py-4">Contact & Info</th>
                <th className="px-6 py-4">Performance (30 Days)</th>
                <th className="px-6 py-4 text-center">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading
                ? Array(4)
                    .fill(0)
                    .map((_, i) => (
                      <tr key={i}>
                        <td
                          colSpan={4}
                          className="h-20 bg-white animate-pulse"
                        />
                      </tr>
                    ))
                : doctors.map((doc: any, i: number) => {
                    const perf = performance.find(
                      (p) => p.name === doc.name,
                    ) || {
                      total: 0,
                      completed: 0,
                      cancelled: 0,
                      noShow: 0,
                      rate: 0,
                    };

                    return (
                      <tr
                        key={i}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-100 shadow-sm group-hover:scale-110 transition-transform">
                              {doc.name
                                .split(" ")
                                .map((n: any) => n[0])
                                .join("")}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 leading-tight mb-0.5 group-hover:text-blue-600 transition-colors">
                                {doc.name}
                              </p>
                              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <FaStethoscope className="text-[10px]" />
                                {doc.department}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1.5">
                            <p className="text-xs font-medium text-slate-600 flex items-center gap-2">
                              <FaPhone className="text-[10px] text-slate-400" />
                              {doc.phone || "Not Provided"}
                            </p>
                            <p className="text-xs font-medium text-slate-600 flex items-center gap-2">
                              <FaEnvelope className="text-[10px] text-slate-400" />
                              {doc.email || "Not Provided"}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-2">
                            <span className="text-sm font-bold text-slate-700">
                              {perf.total} total visits
                            </span>
                            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider">
                              <span className="flex items-center gap-1 bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-100">
                                <FaCheckCircle className="text-[9px]" />
                                {perf.completed} done
                              </span>
                              <span className="flex items-center gap-1 bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100">
                                <FaTimesCircle className="text-[8px]" />
                                {perf.cancelled}
                              </span>
                              <span className="flex items-center gap-1 bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-100">
                                <FaClock className="text-[8px]" />
                                {perf.noShow}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col items-center gap-1.5">
                            <span
                              className={`text-sm font-bold ${
                                perf.rate >= 80
                                  ? "text-emerald-600"
                                  : perf.rate >= 50
                                    ? "text-amber-500"
                                    : "text-red-500"
                              }`}
                            >
                              {Math.round(perf.rate)}%
                            </span>
                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                              <div
                                className={`h-full ${
                                  perf.rate >= 80
                                    ? "bg-emerald-500"
                                    : perf.rate >= 50
                                      ? "bg-amber-400"
                                      : "bg-red-500"
                                }`}
                                style={{ width: `${perf.rate}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              {!loading && doctors.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="py-12 text-center text-sm font-medium text-slate-400 italic"
                  >
                    No doctors found in the directory.
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
