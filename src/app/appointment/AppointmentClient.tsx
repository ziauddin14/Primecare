"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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

type Doctor = {
  _id: string;
  name: string;
  department: string;
};

type FormState = {
  name: string;
  phone: string;
  email: string;
  doctorId: string; // Changed from doctor (string) to doctorId (mongoId)
  date: string;
  time: string;
};

const initialState: FormState = {
  name: "",
  phone: "",
  email: "",
  doctorId: "",
  date: "",
  time: "",
};

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function AppointmentClient() {
  const searchParams = useSearchParams();
  const [form, setForm] = useState<FormState>(initialState);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const minDate = useMemo(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  }, []);

  useEffect(() => {
    async function fetchDoctors() {
      try {
        const res = await fetch("/api/doctors");
        const json = await res.json();
        if (json.ok) {
          setDoctors(json.doctors || []);
        }
      } catch (err) {
        console.error("Failed to fetch doctors", err);
      }
    }
    fetchDoctors();
  }, []);

  useEffect(() => {
    const docParam = searchParams.get("doctor");
    if (docParam && doctors.length > 0) {
      const match = doctors.find(
        (d) =>
          d.name.toLowerCase().includes(docParam.toLowerCase()) ||
          d.department.toLowerCase().includes(docParam.toLowerCase()),
      );
      if (match) {
        setForm((prev) => ({ ...prev, doctorId: match._id }));
      }
    }
  }, [searchParams, doctors]);

  // Fetch Available Slots
  useEffect(() => {
    if (!form.doctorId || !form.date) {
      setAvailableSlots([]);
      return;
    }

    async function fetchSlots() {
      setSlotsLoading(true);
      try {
        const res = await fetch(
          `/api/slots?doctorId=${form.doctorId}&date=${form.date}`,
        );
        const json = await res.json();
        if (json.ok) {
          setAvailableSlots(json.availableSlots || []);
          // Reset time if selected slot is no longer available
          if (form.time && !json.availableSlots.includes(form.time)) {
            setForm((prev) => ({ ...prev, time: "" }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch slots", err);
      } finally {
        setSlotsLoading(false);
      }
    }
    fetchSlots();
  }, [form.doctorId, form.date]);

  useEffect(() => {
    if (!successMsg && !errorMsg) return;
    const t = setTimeout(() => {
      setSuccessMsg("");
      setErrorMsg("");
    }, 6000);
    return () => clearTimeout(t);
  }, [successMsg, errorMsg]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setSuccessMsg("");
    setErrorMsg("");
    setErrors((prev) => ({ ...prev, [key]: "" }));
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = "Required";
    if (!form.phone.trim()) nextErrors.phone = "Required";
    if (!form.doctorId) nextErrors.doctorId = "Required";
    if (!form.date) nextErrors.date = "Required";
    if (!form.time) nextErrors.time = "Required";

    // Email is optional in new patient model but we'll keep it for better communication if provided
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

      if (res.ok) {
        setSuccessMsg(json.message);
        setForm(initialState);
      } else {
        setErrorMsg(json.message || "Something went wrong.");
      }
    } catch (err) {
      setErrorMsg("Connection error. Please try again.");
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
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mb-8 rounded-2xl border border-red-100 bg-red-50 px-6 py-4 text-base font-bold text-red-800 flex items-center gap-3"
                >
                  <FaShieldAlt className="text-xl" /> {errorMsg}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={onSubmit} className="space-y-8">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                    <FaUser className="text-[14px]" /> Name
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className={`w-full rounded-2xl border ${errors.name ? "border-red-500" : "border-slate-200"} px-5 py-4 text-base font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all`}
                    placeholder="Full Name"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                    <FaPhone className="text-[14px]" /> Phone
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className={`w-full rounded-2xl border ${errors.phone ? "border-red-500" : "border-slate-200"} px-5 py-4 text-base font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all`}
                    placeholder="03001234567"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                  <FaEnvelope className="text-[14px]" /> Email Address
                  (Optional)
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className={`w-full rounded-2xl border ${errors.email ? "border-red-500" : "border-slate-200"} px-5 py-4 text-base font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all`}
                  placeholder="you@example.com"
                  disabled={loading}
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                    <FaUserMd className="text-[14px]" /> Clinical Specialist
                  </label>
                  <select
                    value={form.doctorId}
                    onChange={(e) => updateField("doctorId", e.target.value)}
                    className={`w-full rounded-2xl border ${errors.doctorId ? "border-red-500" : "border-slate-200"} px-5 py-4 text-base font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all appearance-none bg-white`}
                    disabled={loading}
                  >
                    <option value="">Select Specialist...</option>
                    {doctors.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name} ({d.department})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                    <FaCalendarAlt className="text-[14px]" /> Preferred Date
                  </label>
                  <input
                    type="date"
                    min={minDate}
                    value={form.date}
                    onChange={(e) => updateField("date", e.target.value)}
                    className={`w-full rounded-2xl border ${errors.date ? "border-red-500" : "border-slate-200"} px-5 py-4 text-base font-bold text-slate-900`}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                  <FaClock className="text-[14px]" />{" "}
                  {slotsLoading
                    ? "Synchronizing Slots..."
                    : "Available Time Slots"}
                </label>

                {!form.doctorId || !form.date ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs font-bold text-slate-400 italic">
                    Please select a doctor and date to view available slots.
                  </div>
                ) : slotsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => updateField("time", slot)}
                        className={`rounded-xl border py-2 text-sm font-black transition-all ${
                          form.time === slot
                            ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100"
                            : "border-slate-200 text-slate-600 hover:border-blue-600 hover:text-blue-600"
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-red-50 border border-red-100 p-6 text-center text-xs font-bold text-red-600">
                    No slots available for this date. Please try another day.
                  </div>
                )}
                {errors.time && (
                  <p className="text-red-500 text-[10px] font-bold px-1 uppercase tracking-tighter">
                    Time slot is required
                  </p>
                )}
              </div>

              <motion.button
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                type="submit"
                disabled={loading}
                className="mt-4 w-full h-16 rounded-[1.5rem] bg-blue-600 text-white font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FaCalendarAlt className="text-xl" /> Confirm Appointment
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
