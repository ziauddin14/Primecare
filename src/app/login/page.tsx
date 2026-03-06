"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Container from "@/components/Container";
import {
  FaHospitalSymbol,
  FaUserInjured,
  FaUserMd,
  FaCheckCircle,
  FaClock,
  FaNotesMedical,
  FaChartPie,
  FaShieldAlt,
  FaSyncAlt,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.ok) {
        router.push(data.role === "DOCTOR" ? "/admin/doctor" : "/admin");
        router.refresh();
      } else {
        setError(data.message || "Authentication failed");
      }
    } catch (err) {
      setError("Network connection issue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-20 text-[20rem] text-slate-100 opacity-50 select-none">
        <FaHospitalSymbol className="rotate-12" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[500px] bg-white rounded-[3rem] shadow-2xl shadow-blue-100 border border-slate-100 p-12 overflow-hidden relative z-10"
      >
        <div className="flex flex-col items-center gap-4 mb-12">
          <div className="bg-blue-600 p-5 rounded-[2rem] shadow-2xl shadow-blue-200 text-white text-3xl">
            <FaHospitalSymbol />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">
              Primecare
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] italic">
              Clinic Intelligence Log
            </p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">
              Access Key
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin / reception / doctor"
              required
              className="w-full h-16 rounded-2xl bg-slate-50 border border-slate-100 px-6 font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">
              Security Hash
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full h-16 rounded-2xl bg-slate-50 border border-slate-100 px-6 font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm"
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 rounded-xl bg-red-50 text-red-600 text-xs font-black uppercase tracking-widest border border-red-100 flex items-center gap-3"
              >
                <FaShieldAlt /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            disabled={loading}
            className="w-full h-16 rounded-[1.8rem] bg-blue-600 text-white font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? (
              <FaSyncAlt className="animate-spin text-lg" />
            ) : (
              "Verify Identity"
            )}
          </button>
        </form>

        {/* Demo Tip */}
        <div className="mt-12 p-6 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-blue-600 text-sm shadow-sm">
              <span className="font-black">?</span>
            </div>
            <div>
              <h4 className="text-[10px] font-black text-slate-900 uppercase">
                Demo Access
              </h4>
              <p className="text-[9px] font-bold text-slate-400">
                admin / admin123
              </p>
            </div>
          </div>
          <FaClock className="text-slate-200 group-hover:text-blue-200 transition-colors" />
        </div>
      </motion.div>
    </main>
  );
}
