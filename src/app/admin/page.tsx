"use client";

import { useEffect, useState } from "react";
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

  return (
    <main className="bg-white min-h-screen">
      <div className="bg-slate-50 border-b border-slate-100 py-6 sm:py-10">
        <Container>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="h1-tight">Admin Console</h1>
              <p className="subtext font-medium">
                Manage clinical appointments.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
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
          {loading && (
            <p className="text-sm font-bold text-slate-500">Synchronizing...</p>
          )}
          {!loading && errMsg && (
            <p className="text-sm font-bold text-red-600">{errMsg}</p>
          )}
          {!loading && !data.length && !errMsg && (
            <p className="text-sm font-bold text-slate-600">
              No active appointments.
            </p>
          )}

          {!loading && data.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="w-full overflow-x-auto">
                <table className="min-w-[800px] w-full text-left">
                  <thead className="bg-slate-50 border-b">
                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="px-6 py-3">Patient</th>
                      <th className="px-6 py-3">Contact</th>
                      <th className="px-6 py-3">Specialist</th>
                      <th className="px-6 py-3">Schedule</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.map((a) => (
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
                            {a.startTime} - {a.endTime}
                          </span>
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
