"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Container from "@/components/Container";
import { FaSyncAlt, FaSignOutAlt } from "react-icons/fa";

type Appointment = {
  _id?: string;
  name: string;
  phone: string;
  email: string;
  doctor: string;
  date: string;
  time: string;
  createdAt?: string;
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
      setData(Array.isArray(json) ? json : (json?.appointments ?? []));
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.map((a, i) => (
                      <tr
                        key={a._id ?? i}
                        className="text-sm font-semibold text-slate-800 hover:bg-slate-50 transition"
                      >
                        <td className="px-6 py-4">{a.name}</td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {a.phone}
                          <br />
                          {a.email}
                        </td>
                        <td className="px-6 py-4">{a.doctor}</td>
                        <td className="px-6 py-4 text-xs">
                          <span className="text-slate-900 font-bold">
                            {a.date}
                          </span>
                          <span className="block text-blue-600 font-black">
                            {a.time}
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
