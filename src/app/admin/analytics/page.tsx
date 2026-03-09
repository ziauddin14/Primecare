"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaSyncAlt,
  FaArrowLeft,
  FaChartLine,
  FaUserInjured,
  FaCalendarCheck,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaStethoscope,
  FaRegLightbulb,
  FaChartPie,
  FaUsers,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

type Range = "today" | "7d" | "30d";

export default function AnalyticsDashboard() {
  const [range, setRange] = useState<Range>("7d");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const load = async (r: Range = range) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?range=${r}`);
      const json = await res.json();
      if (json.ok) setData(json);
    } catch {
      console.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(range);
  }, [range]);

  const changeRange = (r: Range) => {
    setRange(r);
  };

  const kpis = useMemo(() => {
    if (!data?.summary) return [];
    const s = data.summary;
    const rate = s.total > 0 ? (s.completed / s.total) * 100 : 0;
    return [
      {
        label: "Total Visits",
        val: s.total,
        icon: <FaCalendarCheck />,
        color: "text-blue-600",
        bg: "bg-blue-50",
      },
      {
        label: "Completed",
        val: s.completed,
        icon: <FaCheckCircle />,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
      },
      {
        label: "Cancellations",
        val: s.cancelled,
        icon: <FaTimesCircle />,
        color: "text-red-500",
        bg: "bg-red-50",
      },
      {
        label: "No-Show",
        val: s.noShow,
        icon: <FaClock />,
        color: "text-amber-500",
        bg: "bg-amber-50",
      },
      {
        label: "Patient Growth",
        val: s.newPatients,
        icon: <FaUsers />,
        color: "text-indigo-600",
        bg: "bg-indigo-50",
      },
      {
        label: "Success Rate",
        val: `${Math.round(rate)}%`,
        icon: <FaChartLine />,
        color: "text-purple-600",
        bg: "bg-purple-50",
      },
    ];
  }, [data]);

  const maxTrend = useMemo(() => {
    return Math.max(
      ...(data?.appointmentTrends || []).map((t: any) => t.count),
      1,
    );
  }, [data]);

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Clinic Analytics
          </h1>
          <p className="text-sm text-slate-500 font-medium tracking-tight">
            Operational insights and performance overview.
          </p>
        </div>

        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-inner">
          {(["today", "7d", "30d"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => changeRange(r)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${range === r ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}
            >
              {r === "today"
                ? "Today"
                : r === "7d"
                  ? "Last 7 Days"
                  : "Last 30 Days"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        {/* KPI Section */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 xl:gap-6">
          {loading
            ? Array(6)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="h-[120px] bg-white border border-slate-200 animate-pulse rounded-2xl"
                  />
                ))
            : kpis.map((k, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={k.label}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden"
                >
                  <div
                    className={`${k.bg} ${k.color} h-10 w-10 rounded-xl flex items-center justify-center text-lg mb-3 shadow-sm group-hover:scale-110 transition-transform`}
                  >
                    {k.icon}
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                      {k.label}
                    </h4>
                    <p className="text-2xl font-bold text-slate-900 leading-none">
                      {k.val}
                    </p>
                  </div>
                </motion.div>
              ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Trend Chart Section */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 px-1">
              Patient Volume Trends
            </h2>
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative h-[400px]">
              <div className="absolute inset-0 p-8 flex flex-col justify-end pointer-events-none">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="border-t border-slate-100 w-full mb-16 last:mb-8"
                  />
                ))}
              </div>
              <div className="h-full w-full flex items-end gap-2 md:gap-6 relative z-10 pb-4">
                {loading ? (
                  <div className="h-full w-full bg-slate-50 animate-pulse rounded-xl" />
                ) : (
                  data?.appointmentTrends?.map((t: any, i: number) => (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center group relative h-full justify-end"
                    >
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(t.count / maxTrend) * 100}%` }}
                        className="w-full max-w-[48px] bg-blue-500 rounded-t-lg group-hover:bg-blue-600 transition-colors shadow-sm"
                      />
                      <div className="mt-3 text-[10px] font-medium text-slate-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity rotate-45 md:rotate-0 origin-left">
                        {t.date}
                      </div>
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all bg-slate-900 text-white text-[11px] px-2.5 py-1 rounded font-bold whitespace-nowrap shadow-lg">
                        {t.count} visits
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Operational High-Level Cards */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 px-1">
              Operational Insights
            </h2>
            <div className="grid gap-4">
              {[
                {
                  label: "Busiest Departure",
                  val: data?.operationalInsights?.busiestDay,
                  sub: "High Traffic Day",
                  icon: <FaCalendarCheck className="text-blue-500" />,
                  bg: "bg-blue-50",
                },
                {
                  label: "Peak Slot",
                  val: data?.operationalInsights?.busiestSlot,
                  sub: "Max Resource Demand",
                  icon: <FaClock className="text-indigo-500" />,
                  bg: "bg-indigo-50",
                },
                {
                  label: "Top Department",
                  val: data?.operationalInsights?.topDepartment,
                  sub: "Highest Volume",
                  icon: <FaStethoscope className="text-emerald-500" />,
                  bg: "bg-emerald-50",
                },
                {
                  label: "Active Doctors",
                  val: data?.operationalInsights?.activeDoctors,
                  sub: "Working in Range",
                  icon: <FaUsers className="text-amber-500" />,
                  bg: "bg-amber-50",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 group hover:shadow-md hover:border-blue-200 transition-all"
                >
                  <div
                    className={`h-12 w-12 ${item.bg} rounded-xl flex items-center justify-center text-lg shadow-sm group-hover:scale-110 transition-transform`}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {item.label}
                    </h4>
                    <p className="text-lg font-bold text-slate-900 leading-tight">
                      {item.val || "—"}
                    </p>
                    <p className="text-[10px] font-medium text-slate-400">
                      {item.sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Retention Donut Mock/Simple */}
            <div className="p-6 rounded-2xl bg-slate-900 text-white shadow-lg relative overflow-hidden mt-6 group">
              <div className="relative z-10">
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                  <FaChartPie className="text-blue-400" /> Patient Retention
                </h4>
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between text-[11px] font-bold uppercase mb-1.5">
                      <span className="text-slate-300">New Patients</span>
                      <span className="text-blue-400">
                        {data?.summary?.newPatients || 0}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(data?.summary?.newPatients / (data?.summary?.total || 1)) * 100}%`,
                        }}
                        className="h-full bg-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] font-bold uppercase mb-1.5">
                      <span className="text-slate-300">Returning</span>
                      <span className="text-indigo-400">
                        {data?.summary?.returningPatients || 0}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(data?.summary?.returningPatients / (data?.summary?.total || 1)) * 100}%`,
                        }}
                        className="h-full bg-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <FaUsers className="absolute -bottom-6 -right-6 text-[8rem] text-white/5 rotate-12 group-hover:rotate-6 transition-transform duration-700" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
