"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Container from "@/components/Container";
import {
  FaSyncAlt,
  FaUserInjured,
  FaChevronRight,
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaArrowRight,
  FaArrowLeft,
  FaNotesMedical,
  FaHistory,
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
    <div className="py-12">
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">
              Master Directory
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              Patient Profiles & Clinical Records
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Name / Phone..."
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

        <div className="py-10 space-y-10">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden min-h-[500px]">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <th className="px-8 py-6">Patient Identifier</th>
                    <th className="px-8 py-6">Demographics</th>
                    <th className="px-8 py-6">Pipeline Status</th>
                    <th className="px-8 py-6 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <AnimatePresence mode="popLayout">
                    {filteredData.map((p) => (
                      <motion.tr
                        key={p._id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                        onClick={() => router.push(`/admin/patients/${p._id}`)}
                      >
                        <td className="px-8 py-7">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-blue-600 text-sm border border-slate-200 shadow-inner">
                              {p.fullName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </div>
                            <div>
                              <h3 className="text-[15px] font-black text-slate-900 leading-tight mb-0.5 group-hover:text-blue-600 transition-colors">
                                {p.fullName}
                              </h3>
                              <p className="text-[11px] font-bold text-slate-400 tracking-wider font-mono">
                                ID: {p._id.slice(-6).toUpperCase()}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-7">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-black text-slate-800">
                              {p.phone}
                            </span>
                            <span className="text-[10px] font-black uppercase text-slate-400">
                              {p.gender || "Gender N/A"} • {p.age || "??"} Years
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-7">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                Total Visits:{" "}
                                <span className="font-black text-slate-800">
                                  {p.totalVisits}
                                </span>
                              </span>
                            </div>
                            {p.upcomingAppointment ? (
                              <div className="flex items-center gap-2 text-blue-600">
                                <div className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-tight">
                                  Next: {p.upcomingAppointment.date}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-slate-300">
                                <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                                <span className="text-[10px] font-bold uppercase tracking-tight italic">
                                  No Upcoming
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-7 text-center">
                          <button className="h-10 w-10 mx-auto rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all active:scale-95 shadow-sm border border-slate-200">
                            <FaChevronRight className="text-xs group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {!loading && filteredData.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-4 text-slate-300">
                          <FaSearch className="text-5xl" />
                          <p className="text-sm font-black uppercase tracking-widest text-slate-400">
                            No patient records matched your search.
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
      </Container>
    </div>
  );
}
