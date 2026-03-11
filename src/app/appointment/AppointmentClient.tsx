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
  FaBriefcaseMedical,
  FaChevronDown,
} from "react-icons/fa";

type Doctor = {
  _id: string;
  name: string;
  department: string;
};

type Service = {
  _id: string;
  title: string;
  department: string;
};

type FormState = {
  name: string;
  phone: string;
  email: string;
  doctorId: string; // Optional
  serviceId: string; // Required
  date: string;
  time: string;
  reasonForVisit: string;
  notes: string;
};

const initialState: FormState = {
  name: "",
  phone: "",
  email: "",
  doctorId: "",
  serviceId: "",
  date: "",
  time: "",
  reasonForVisit: "",
  notes: "",
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
  const [services, setServices] = useState<Service[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const minDate = useMemo(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  }, []);

  useEffect(() => {
    async function fetchData() {
      setDataLoading(true);
      try {
        // Fetch services
        const srvRes = await fetch("/api/services");
        if (srvRes.ok) {
          const srvJson = await srvRes.json();
          setServices(srvJson.services || []);
        } else {
          console.error("Failed to fetch services", srvRes.status);
        }

        // Fetch doctors
        const docsRes = await fetch("/api/doctors");
        if (docsRes.ok) {
          const docsJson = await docsRes.json();
          setDoctors(docsJson.doctors || []);
        } else {
          console.error("Failed to fetch doctors", docsRes.status);
        }
      } catch (err) {
        console.error("Failed to fetch reference data", err);
      } finally {
        setDataLoading(false);
      }
    }
    fetchData();
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
    if (!form.date) {
      setAvailableSlots([]);
      return;
    }

    async function fetchSlots() {
      setSlotsLoading(true);
      try {
        const url = `/api/slots?date=${form.date}${form.doctorId ? "&doctorId=" + form.doctorId : ""}`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.ok) {
          setAvailableSlots(json.availableSlots || []);
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
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = "Full Name is required";

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "Invalid email format";
    }

    if (!form.phone.trim()) {
      nextErrors.phone = "Phone number is required";
    } else if (!/^(\+92|0|92)?3\d{9}$/.test(form.phone)) {
      nextErrors.phone = "Invalid Pakistani phone format (e.g. 03001234567)";
    }

    if (!form.serviceId) nextErrors.serviceId = "Please select a service";
    if (!form.date) nextErrors.date = "Preferred date is required";
    if (!form.time) nextErrors.time = "Please pick a time slot";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setErrorMsg("Please complete all required fields correctly.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (res.ok) {
        setSuccessMsg(
          json.message || "Your appointment request has been received.",
        );
        setForm(initialState);
      } else {
        setErrorMsg(json.message || "Something went wrong.");
      }
    } catch (err) {
      setErrorMsg(
        "Connection error. Please check your internet and try again.",
      );
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

            <form onSubmit={onSubmit} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                    <FaUser className="text-[14px]" /> Full Name
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className={`w-full rounded-2xl border ${errors.name ? "border-red-500" : "border-slate-200"} px-5 py-4 text-base font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all`}
                    placeholder="John Doe"
                    disabled={loading}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs px-1">{errors.name}</p>
                  )}
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
                  {errors.phone && (
                    <p className="text-red-500 text-xs px-1">{errors.phone}</p>
                  )}
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
                {errors.email && (
                  <p className="text-red-500 text-xs px-1">{errors.email}</p>
                )}
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                    <FaBriefcaseMedical className="text-[14px]" /> Service
                    Required *
                  </label>
                  {services.length === 0 && !dataLoading ? (
                    <div className="w-full rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-600">
                      Services unavailable, please refresh or contact clinic.
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        value={form.serviceId}
                        onChange={(e) =>
                          updateField("serviceId", e.target.value)
                        }
                        className={`w-full rounded-2xl border ${errors.serviceId ? "border-red-500" : "border-slate-200"} px-5 py-4 text-base font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all appearance-none bg-white`}
                        disabled={loading || dataLoading}
                      >
                        <option value="">
                          {dataLoading
                            ? "Loading Services..."
                            : "Select Service..."}
                        </option>
                        {services.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.title}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-slate-400">
                        <FaChevronDown className="text-sm" />
                      </div>
                    </div>
                  )}
                  {errors.serviceId && (
                    <p className="text-red-500 text-xs px-1 font-bold italic">
                      {errors.serviceId}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                    <FaUserMd className="text-[14px]" /> Preferences (Optional)
                  </label>
                  <div className="relative">
                    <select
                      value={form.doctorId}
                      onChange={(e) => updateField("doctorId", e.target.value)}
                      className={`w-full rounded-2xl border ${errors.doctorId ? "border-red-500" : "border-slate-200"} px-5 py-4 text-base font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all appearance-none bg-white`}
                      disabled={loading || dataLoading}
                    >
                      <option value="">
                        {dataLoading ? "Loading Doctors..." : "Any Specialist"}
                      </option>
                      {doctors.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.name} ({d.department})
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-slate-400">
                      <FaChevronDown className="text-sm" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                  Symptoms / Reason for Visit
                </label>
                <input
                  value={form.reasonForVisit}
                  onChange={(e) =>
                    updateField("reasonForVisit", e.target.value)
                  }
                  className={`w-full rounded-2xl border border-slate-200 px-5 py-4 text-base font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all`}
                  placeholder="E.g. Fever, routine checkup"
                  disabled={loading}
                />
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
                {errors.date && (
                  <p className="text-red-500 text-xs px-1">{errors.date}</p>
                )}
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                  <FaClock className="text-[14px]" />{" "}
                  {slotsLoading
                    ? "Synchronizing Slots..."
                    : "Preferred Time Slot"}
                </label>

                {!form.date ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs font-bold text-slate-400 italic">
                    Please select a date to view available slots.
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

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                  Optional Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  className={`w-full rounded-2xl border border-slate-200 px-5 py-4 text-base font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all`}
                  placeholder="Any additional information..."
                  rows={3}
                  disabled={loading}
                />
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
                    Request
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
