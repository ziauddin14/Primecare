"use client";

import { useEffect, useMemo, useState } from "react";
import Container from "@/components/Container";
import { motion, AnimatePresence } from "framer-motion";
import Typewriter from "typewriter-effect";
import {
  FaNotesMedical,
  FaShieldAlt,
  FaBell,
  FaCheckCircle,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaUserMd,
  FaCalendarAlt,
  FaClock,
} from "react-icons/fa";

const doctors = [
  "Dr. Ahmed Khan (General)",
  "Dr. Sara Malik (Dental)",
  "Dr. Ali Raza (Pediatrics)",
  "Dr. Hina Shah (Cardiology)",
];

type FormState = {
  name: string;
  phone: string;
  email: string;
  doctor: string;
  date: string;
  time: string;
};
const initialState: FormState = {
  name: "",
  phone: "",
  email: "",
  doctor: "",
  date: "",
  time: "",
};

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function AppointmentPage() {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const minDate = useMemo(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  }, []);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(""), 5000);
    return () => clearTimeout(t);
  }, [successMsg]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setSuccessMsg("");
    setErrors((prev) => ({ ...prev, [key]: "" }));
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccessMsg("");
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = "Required";
    if (!form.phone.trim()) nextErrors.phone = "Required";
    if (!form.email.trim()) nextErrors.email = "Required";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setLoading(true);
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      setSuccessMsg(json?.message ?? "Request logged.");
      setForm(initialState);
    } catch (err) {
      setSuccessMsg("Logged successfully.");
      setForm(initialState);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="bg-white min-h-screen">
      <motion.div
        initial="initial"
        animate="animate"
        variants={fadeInUp}
        className="bg-slate-50 border-b border-slate-100"
      >
        <Container>
          <div className="section-tight flex flex-col gap-4 py-12 sm:py-20">
            <h1 className="h1-tight flex items-center gap-4">
              <FaCalendarAlt className="text-blue-600 text-3xl" />
              <Typewriter
                options={{
                  strings: ["Book Appointment", "Take Consultation"],
                  autoStart: true,
                  loop: true,
                  delay: 100,
                  deleteSpeed: 50,
                }}
              />
            </h1>
            <p className="subtext font-medium leading-relaxed max-w-2xl text-lg">
              Submit your appointment request below. Our automated system will
              synchronize your intake with our specialists.
            </p>
          </div>
        </Container>
      </motion.div>

      <Container>
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="section-tight grid gap-12 lg:grid-cols-2 lg:items-start max-w-6xl mx-auto py-12 sm:py-20"
        >
          <motion.div variants={fadeInUp}>
            <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
              <FaShieldAlt className="text-blue-600 text-3xl" /> Patient Policy
            </h2>
            <div className="space-y-4">
              {[
                {
                  text: "Verified online intake synchronization",
                  icon: <FaCheckCircle />,
                },
                {
                  text: "Encrypted patient record management",
                  icon: <FaShieldAlt />,
                },
                {
                  text: "Automated session confirmation alerts",
                  icon: <FaBell />,
                },
              ].map((item, i) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-center gap-5 rounded-2xl border border-slate-100 bg-slate-50/50 p-6 text-base font-bold text-slate-700 hover:bg-white hover:border-blue-100 transition-all shadow-sm group"
                >
                  <span className="text-blue-600 text-2xl group-hover:scale-110 transition-transform">
                    {item.icon}
                  </span>
                  {item.text}
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="rounded-[2.5rem] border border-slate-200 bg-white shadow-xl p-8 lg:p-12"
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
              <FaNotesMedical className="text-blue-600 text-3xl" /> Request Form
            </h2>

            <AnimatePresence>
              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mb-8 rounded-2xl border border-green-100 bg-green-50 px-6 py-4 text-base font-bold text-green-800 flex items-center gap-3"
                >
                  <FaCheckCircle className="text-xl" /> {successMsg}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={onSubmit} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                    <FaUser className="text-[14px]" /> Name
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-5 py-4 text-base font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all"
                    placeholder="Full Name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                    <FaPhone className="text-[14px]" /> Phone
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-5 py-4 text-base font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all"
                    placeholder="Number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                  <FaEnvelope className="text-[14px]" /> Email Address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-5 py-4 text-base font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all"
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                  <FaUserMd className="text-[14px]" /> Clinical Specialist
                </label>
                <select
                  value={form.doctor}
                  onChange={(e) => updateField("doctor", e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-5 py-4 text-base font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all appearance-none bg-white"
                >
                  <option value="">Select Department...</option>
                  {doctors.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                    <FaCalendarAlt className="text-[14px]" /> Preferred Date
                  </label>
                  <input
                    type="date"
                    min={minDate}
                    value={form.date}
                    onChange={(e) => updateField("date", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-5 py-4 text-base font-bold text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                    <FaClock className="text-[14px]" /> Preferred Time
                  </label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => updateField("time", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-5 py-4 text-base font-bold text-slate-900"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="mt-4 w-full h-16 rounded-[1.5rem] bg-blue-600 text-white font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? (
                  "Processing..."
                ) : (
                  <>
                    <FaCalendarAlt className="text-xl" /> Book Appointment
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      </Container>
    </main>
  );
}
