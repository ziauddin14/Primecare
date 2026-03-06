"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Container from "@/components/Container";
import { FaSyncAlt, FaSignOutAlt } from "react-icons/fa";

type Appointment = {
  _id?: string;
  patientId: string;
  doctorId: string;
  department: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt?: string;
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

export default function AdminPage() {
  const [data, setData] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [filter, setFilter] = useState<"all" | "today">("all");
  const [sortBy, setSortBy] = useState<"time" | "doctor" | "none">("none");
  const router = useRouter();

  const load = async () => {
    setLoading(true);
    setErrMsg("");
    try {
      const res = await fetch("/api/appointments");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        setData([]);
        setErrMsg("System waiting for DB sync.");
        return;
      }
      const json = await res.json();
      setData(json.appointments || []);
    } catch {
      setErrMsg("Network error.");
    } finally {
      setLoading(false);
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

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Filter by Today
    if (filter === "today") {
      const today = new Date().toISOString().split("T")[0];
      result = result.filter((a) => a.date === today);
    }

    // Sort
    if (sortBy === "time") {
      result.sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.startTime.localeCompare(b.startTime);
      });
    } else if (sortBy === "doctor") {
      result.sort((a, b) =>
        (a.doctorInfo?.name || "").localeCompare(b.doctorInfo?.name || ""),
      );
    } else if (sortBy === "none") {
      // Default sort by creation date if available, otherwise no specific sort
      result.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        return 0; // Maintain original order if no createdAt or if equal
      });
    }

    return result;
  }, [data, filter, sortBy]);

  return (
    <main className="bg-white min-h-screen">
      <div className="bg-slate-50 border-b border-slate-100 py-6 sm:py-10">
        <Container>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="h1-tight">Admin Console</h1>
              <p className="subtext font-medium">
                Manage clinical appointments and schedules.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setFilter(filter === "all" ? "today" : "all")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border font-bold text-sm transition-all active:scale-95 shadow-sm ${
                  filter === "today"
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white border-slate-200 text-slate-900 hover:bg-slate-50"
                }`}
              >
                {filter === "today" ? "All Appointments" : "Today Only"}
              </button>
              <button
                onClick={load}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold text-sm hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
              >
                <FaSyncAlt className={loading ? "animate-spin" : ""} /> Refresh
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-all active:scale-95 shadow-sm border border-red-100"
              >
                <FaSignOutAlt /> Sign Out
              </button>
            </div>
          </div>
        </Container>
      </div>

      <Container>
        <div className="section-tight">
          <div className="mb-6 flex flex-wrap gap-4 items-center">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              Sort By:
            </span>
            <button
              onClick={() => setSortBy("doctor")}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${sortBy === "doctor" ? "bg-slate-900 border-slate-900 text-white" : "border-slate-200 text-slate-600 hover:border-slate-900"}`}
            >
              Doctor
            </button>
            <button
              onClick={() => setSortBy("time")}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${sortBy === "time" ? "bg-slate-900 border-slate-900 text-white" : "border-slate-200 text-slate-600 hover:border-slate-900"}`}
            >
              Time / Date
            </button>
            <button
              onClick={() => setSortBy("none")}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${sortBy === "none" ? "bg-slate-900 border-slate-900 text-white" : "border-slate-200 text-slate-600 hover:border-slate-900"}`}
            >
              Recent
            </button>
          </div>

          {loading && (
            <p className="text-sm font-bold text-slate-500">Synchronizing...</p>
          )}
          {!loading && errMsg && (
            <p className="text-sm font-bold text-red-600">{errMsg}</p>
          )}
          {!loading && !filteredAndSortedData.length && !errMsg && (
            <p className="text-sm font-bold text-slate-600">
              No active appointments found.
            </p>
          )}

          {!loading && filteredAndSortedData.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="w-full overflow-x-auto">
                <table className="min-w-[900px] w-full text-left">
                  <thead className="bg-slate-50 border-b">
                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="px-6 py-3">Patient</th>
                      <th className="px-6 py-3">Contact</th>
                      <th className="px-6 py-3">Specialist</th>
                      <th className="px-6 py-3">Schedule</th>
                      <th className="px-6 py-3">End Time</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAndSortedData.map((a) => (
                      <tr
                        key={a._id}
                        className="text-sm font-semibold text-slate-800 hover:bg-slate-50 transition"
                      >
                        <td className="px-6 py-4">
                          {a.patientInfo?.fullName || "Unknown"}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {a.patientInfo?.phone}
                          {a.patientInfo?.email && (
                            <>
                              <br />
                              {a.patientInfo.email}
                            </>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {a.doctorInfo?.name}
                          <span className="block text-[10px] text-slate-400 uppercase">
                            {a.doctorInfo?.department}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <span className="text-slate-900 font-bold">
                            {a.date}
                          </span>
                          <span className="block text-blue-600 font-black">
                            {a.startTime}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-500">
                          {a.endTime}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold ${
                              a.status === "NEW"
                                ? "bg-blue-50 text-blue-600"
                                : a.status === "CONFIRMED"
                                  ? "bg-green-50 text-green-600"
                                  : "bg-slate-50 text-slate-600"
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Container>
    </main>
  );
}
