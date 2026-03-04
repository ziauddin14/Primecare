"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Container from "@/components/Container";
import { motion } from "framer-motion";
import { FaLock, FaUser, FaShieldAlt, FaClinicMedical } from "react-icons/fa";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
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

      if (res.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-80px)] bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Container>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto"
        >
          {/* Brand Logo */}
          <div className="text-center mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 group mb-4"
            >
              <FaClinicMedical className="text-3xl text-blue-600 transition-transform group-hover:scale-110" />
              <div className="flex">
                <span className="text-3xl font-bold tracking-tighter text-blue-600">
                  Prime
                </span>
                <span className="text-3xl font-bold tracking-tighter text-slate-900">
                  Care
                </span>
              </div>
            </Link>
            <p className="text-slate-500 font-medium">
              Internal Management Console
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-blue-100/50 p-8 sm:p-10">
            <h1 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
              <FaShieldAlt className="text-blue-600" /> Admin Login
            </h1>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-800 text-sm font-bold flex items-center gap-2"
              >
                <FaShieldAlt className="flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                  <FaUser className="text-[12px]" /> Username
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-5 py-4 text-base font-bold text-slate-900 focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
                    placeholder="Enter username"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                  <FaLock className="text-[12px]" /> Password
                </label>
                <div className="relative group">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-5 py-4 text-base font-bold text-slate-900 focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full h-16 mt-4 rounded-3xl bg-blue-600 text-white font-black text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In <FaLock className="text-sm" />
                  </>
                )}
              </motion.button>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                Authorized Personnel Only. Unauthorized access is monitored and
                logged in compliance with clinic security policies.
              </p>
            </div>
          </div>
        </motion.div>
      </Container>
    </main>
  );
}
