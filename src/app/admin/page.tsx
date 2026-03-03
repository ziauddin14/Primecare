"use client";

import { useEffect, useMemo, useState } from "react";
import Container from "@/components/Container";

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

  const load = async () => {
    setLoading(true);
    setErrMsg("");
    try {
      const res = await fetch("/api/appointments");
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

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="bg-white min-h-screen">
      <div className="bg-slate-50 border-b border-slate-100">
        <Container>
          <div className="section-tight flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="h1-tight">Admin Console</h1>
              <p className="subtext font-medium">
                Manage clinical 상담 appointments.
              </p>
            </div>
            <button
              onClick={load}
              className="btn-tight border border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
            >
              Refresh Node
            </button>
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
