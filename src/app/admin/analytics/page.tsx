"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Container from "@/components/Container";
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
} from "react-icons/fa";
import { motion } from "framer-motion";

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
        color: "text-green-600",
        bg: "bg-green-50",
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
        color: "text-purple-600",
        bg: "bg-purple-50",
      },
      {
        label: "Success Rate",
        val: `${Math.round(rate)}%`,
        icon: <FaChartLine />,
        color: "text-indigo-600",
        bg: "bg-indigo-50",
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
    <div className="py-12">
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">
              Clinic Performance
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              Owner Intelligence Dashboard
            </p>
          </div>

          <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 rounded-[1.8rem] border border-slate-200 shadow-inner">
            {(["today", "7d", "30d"] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => changeRange(r)}
                className={`px-6 py-2.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${range === r ? "bg-white text-blue-600 shadow-md" : "text-slate-400 hover:text-slate-600"}`}
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

        <div className="space-y-12">
          {/* KPI Section */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {loading
              ? Array(6)
                  .fill(0)
                  .map((_, i) => (
                    <div
                      key={i}
                      className="h-32 bg-slate-200 animate-pulse rounded-[2rem]"
                    />
                  ))
              : kpis.map((k, i) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={k.label}
                    className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-blue-200 transition-all group"
                  >
                    <div
                      className={`${k.bg} ${k.color} h-12 w-12 rounded-2xl flex items-center justify-center text-xl mb-4 shadow-inner`}
                    >
                      {k.icon}
                    </div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      {k.label}
                    </h4>
                    <p className="text-2xl font-black text-slate-800 leading-none">
                      {k.val}
                    </p>
                  </motion.div>
                ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-10">
            {/* Trend Chart Section */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-3 px-2">
                <FaChartLine className="text-blue-600" /> Patient Volume Trends
              </h2>
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden relative">
                <div className="h-64 w-full flex items-end gap-2 md:gap-4 relative pt-10">
                  <div className="absolute inset-0 flex flex-col justify-between pt-10 pointer-events-none">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="border-t border-slate-50 w-full"
                      />
                    ))}
                  </div>
                  {loading ? (
                    <div className="h-full w-full bg-slate-50 animate-pulse rounded-2xl" />
                  ) : (
                    data?.appointmentTrends?.map((t: any, i: number) => (
                      <div
                        key={i}
                        className="flex-1 flex flex-col items-center group relative z-10 h-full justify-end"
                      >
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${(t.count / maxTrend) * 100}%` }}
                          className="w-full max-w-[40px] bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-xl group-hover:from-blue-500 group-hover:to-indigo-400 transition-all shadow-lg shadow-blue-100"
                        />
                        <div className="mt-4 text-[9px] font-black text-slate-400 uppercase rotate-45 origin-left whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                          {t.date}
                        </div>
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] px-2 py-1 rounded-lg font-black">
                          {t.count}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Operational High-Level Cards */}
            <div className="space-y-6">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-3 px-2">
                <FaRegLightbulb className="text-amber-500" /> Operational
                Insights
              </h2>
              <div className="grid gap-4">
                {[
                  {
                    label: "Busiest Departure",
                    val: data?.operationalInsights?.busiestDay,
                    sub: "High Traffic Day",
                    icon: <FaCalendarCheck className="text-blue-600" />,
                    bg: "bg-blue-50",
                  },
                  {
                    label: "Peak Slot",
                    val: data?.operationalInsights?.busiestSlot,
                    sub: "Max Resource Demand",
                    icon: <FaClock className="text-purple-600" />,
                    bg: "bg-purple-50",
                  },
                  {
                    label: "Top Department",
                    val: data?.operationalInsights?.topDepartment,
                    sub: "Highest Volume",
                    icon: <FaStethoscope className="text-green-600" />,
                    bg: "bg-green-50",
                  },
                  {
                    label: "Active Doctors",
                    val: data?.operationalInsights?.activeDoctors,
                    sub: "Working in Range",
                    icon: <FaUsers className="text-slate-600" />,
                    bg: "bg-slate-50",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 group hover:border-blue-200 transition-all"
                  >
                    <div
                      className={`h-14 w-14 ${item.bg} rounded-2xl flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform`}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {item.label}
                      </h4>
                      <p className="text-base font-black text-slate-900">
                        {item.val || "..."}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 italic">
                        {item.sub}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Retention Donut Mock/Simple */}
              <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                  <h4 className="text-xs font-black uppercase tracking-widest text-white/50 mb-6 flex items-center gap-2">
                    <FaUsers className="text-blue-500" /> Patient Retention
                  </h4>
                  <div className="flex items-end justify-between gap-4">
                    <div className="space-y-4 flex-1">
                      <div>
                        <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                          <span>New Patients</span>
                          <span className="text-blue-400">
                            {data?.summary?.newPatients || 0}
                          </span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
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
                        <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                          <span>Returning</span>
                          <span className="text-indigo-400">
                            {data?.summary?.returningPatients || 0}
                          </span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
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
                </div>
                <FaChartPie className="absolute -bottom-8 -right-8 text-[12rem] text-white/5 rotate-12" />
              </div>
            </div>
          </div>

          {/* Doctor Performance Detailed Table */}
          <div className="space-y-6">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-3 px-2">
              <FaStethoscope className="text-purple-600" /> Specialist
              Performance Scorecard
            </h2>
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="px-10 py-6">Doctor & Department</th>
                      <th className="px-10 py-6">Volume</th>
                      <th className="px-10 py-6">Efficiency (Completed)</th>
                      <th className="px-10 py-6">Canceled/No-Show</th>
                      <th className="px-10 py-6 text-center">Success Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading
                      ? Array(3)
                          .fill(0)
                          .map((_, i) => (
                            <tr key={i}>
                              <td
                                colSpan={5}
                                className="h-20 bg-slate-50/50 animate-pulse"
                              />
                            </tr>
                          ))
                      : data?.doctorPerformance?.map((doc: any, i: number) => (
                          <tr
                            key={i}
                            className="hover:bg-slate-50/50 transition-colors group"
                          >
                            <td className="px-10 py-7">
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs border border-blue-100 group-hover:scale-110 transition-transform">
                                  {doc.name
                                    .split(" ")
                                    .map((n: any) => n[0])
                                    .join("")}
                                </div>
                                <div>
                                  <p className="text-[15px] font-black text-slate-900">
                                    {doc.name}
                                  </p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {doc.department}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-10 py-7 text-sm font-black text-slate-700">
                              {doc.total}
                            </td>
                            <td className="px-10 py-7">
                              <span className="px-4 py-1.5 rounded-full bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest border border-green-100">
                                {doc.completed}
                              </span>
                            </td>
                            <td className="px-10 py-7">
                              <div className="flex items-center gap-4 text-[10px] font-black uppercase text-slate-400">
                                <span className="text-red-400">
                                  Can: {doc.cancelled}
                                </span>
                                <span className="text-amber-400">
                                  N-S: {doc.noShow}
                                </span>
                              </div>
                            </td>
                            <td className="px-10 py-7">
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-sm font-black text-slate-900">
                                  {Math.round(doc.rate)}%
                                </span>
                                <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${doc.rate > 80 ? "bg-green-500" : doc.rate > 50 ? "bg-amber-400" : "bg-red-400"}`}
                                    style={{ width: `${doc.rate}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
