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
  FaSyncAlt,
  FaHospital,
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
  const [clinic, setClinic] = useState<any>(null);
  const [appointmentDetails, setAppointmentDetails] = useState<any>(null);

  const minDate = useMemo(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  }, []);

  useEffect(() => {
    async function fetchData() {
      setDataLoading(true);
      try {
        const [srvRes, docsRes, clinicRes] = await Promise.all([
          fetch("/api/services"),
          fetch("/api/doctors"),
          fetch("/api/admin/settings"),
        ]);

        if (srvRes.ok) {
          const srvJson = await srvRes.json();
          setServices(srvJson.services || []);
        }

        if (docsRes.ok) {
          const docsJson = await docsRes.json();
          setDoctors(docsJson.doctors || []);
        }

        if (clinicRes.ok) {
          const clinicJson = await clinicRes.json();
          setClinic(clinicJson.config);
        }
      } catch (err) {
        console.error("Failed to fetch reference data", err);
      } finally {
        setDataLoading(false);
      }
    }
    fetchData();
  }, []);

  // Fetch slots whenever doctor/date changes
  useEffect(() => {
    async function fetchSlots() {
      if (!form.date) return;
      setSlotsLoading(true);
      try {
        const query = new URLSearchParams({
          date: form.date,
          doctorId: form.doctorId || "",
        });
        const res = await fetch(`/api/appointments/slots?${query}`);
        const json = await res.json();
        if (json.ok) {
          setAvailableSlots(json.slots || []);
          // Clear time if not in new slots
          if (form.time && !json.slots.includes(form.time)) {
            setForm((f) => ({ ...f, time: "" }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch slots", err);
      } finally {
        setSlotsLoading(false);
      }
    }
    fetchSlots();
  }, [form.date, form.doctorId]);

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      const next = { ...errors };
      delete next[field];
      setErrors(next);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setErrorMsg("");

    const nextErrors: Record<string, string> = {};
    if (!form.name) nextErrors.name = "Full name is required";
    if (!form.phone) nextErrors.phone = "Phone number is required";
    if (!form.email) nextErrors.email = "Valid email is required";
    if (!form.serviceId) nextErrors.serviceId = "Please select a service";
    if (!form.date) nextErrors.date = "Please pick a date";
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
        const selectedDoctor = doctors.find((d) => d._id === form.doctorId);
        const selectedService = services.find((s) => s._id === form.serviceId);
        setAppointmentDetails({
          ...form,
          doctorName: selectedDoctor?.name || "Any Specialist",
          serviceTitle: selectedService?.title || "General Consultation",
          id: json.id,
        });
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

  if (dataLoading) {
    return (
      <div className="min-h-screen py-24 flex flex-col items-center justify-center gap-6 bg-slate-50">
        <div className="h-16 w-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">
          Initializing Portal...
        </p>
      </div>
    );
  }

  if (appointmentDetails) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[700px] bg-white rounded-[4rem] shadow-2xl shadow-blue-100 border border-slate-100 overflow-hidden"
        >
          <div className="bg-blue-600 p-12 text-center text-white relative">
            <FaCheckCircle className="text-7xl mx-auto mb-6 drop-shadow-lg" />
            <h2 className="text-4xl font-black tracking-tight mb-2">
              Request Confirmed!
            </h2>
            <p className="text-blue-100 font-bold uppercase tracking-widest text-xs">
              Reference ID: {appointmentDetails.id?.slice(-8).toUpperCase()}
            </p>
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-blue-600 text-3xl rotate-12">
              <FaHospitalSymbol />
            </div>
          </div>

          <div className="p-12 pt-20 space-y-8">
            <div className="text-center">
              <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto">
                Thank you for choosing{" "}
                <span className="font-black text-slate-900">
                  {clinic?.name || "Primecare"}
                </span>
                . Your request has been synchronized with our medical records.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Patient
                </p>
                <h4 className="text-lg font-black text-slate-900">
                  {appointmentDetails.name}
                </h4>
              </div>
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Scheduled For
                </p>
                <h4 className="text-lg font-black text-slate-900">
                  {new Date(appointmentDetails.date).toLocaleDateString()} at{" "}
                  {appointmentDetails.time}
                </h4>
              </div>
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Service
                </p>
                <h4 className="text-lg font-black text-slate-900">
                  {appointmentDetails.serviceTitle}
                </h4>
              </div>
              <div className="p-6 rounded-3xl bg-blue-50 border border-blue-100">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">
                  Specialist
                </p>
                <h4 className="text-lg font-black text-blue-600">
                  {appointmentDetails.doctorName}
                </h4>
              </div>
            </div>

            <div className="pt-8 flex flex-col items-center gap-4">
              <button
                onClick={() => setAppointmentDetails(null)}
                className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-black transition-all active:scale-95"
              >
                Book Another Session
              </button>
              <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase">
                <FaShieldAlt className="text-blue-500" /> Secure Transmission
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="bg-white min-h-screen pb-20">
      {/* Clinic Header Branding */}
      <div className="bg-white border-b border-slate-100 py-6">
        <Container>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-3 rounded-2xl text-white text-xl shadow-lg shadow-blue-100">
                <FaHospital />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {clinic?.name || "Primecare Clinic"}
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {clinic?.address || "Medical District"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-slate-400 uppercase">
                  Support
                </p>
                <p className="text-sm font-black text-blue-600">
                  {clinic?.phone || "+92 300 0000000"}
                </p>
              </div>
              <div className="h-10 w-px bg-slate-100 hidden sm:block" />
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 text-slate-600">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-tighter">
                  Live Portal
                </span>
              </div>
            </div>
          </div>
        </Container>
      </div>

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
                  strings: ["Book Appointment", "Medical Consultation"],
                  autoStart: true,
                  loop: true,
                  delay: 100,
                  deleteSpeed: 50,
                }}
              />
            </h1>
            <p className="subtext font-medium leading-relaxed max-w-2xl text-lg">
              Synchronize your intake with{" "}
              <span className="font-black text-slate-900">
                {clinic?.name || "our specialists"}
              </span>
              . Secure and automated scheduling.
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
              <FaShieldAlt className="text-blue-600 text-3xl" /> Clinical Policy
            </h2>
            <div className="space-y-4">
              {[
                {
                  text: "Real-time session synchronization",
                  icon: <FaCheckCircle />,
                },
                {
                  text: "Encrypted patient identity management",
                  icon: <FaShieldAlt />,
                },
                {
                  text: "Automated status notification alerts",
                  icon: <FaBell />,
                },
              ].map((item, i) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-center gap-5 rounded-3xl border border-slate-100 bg-slate-50/50 p-6 text-base font-black text-slate-700 hover:bg-white hover:border-blue-100 transition-all shadow-sm group"
                >
                  <span className="text-blue-600 text-2xl group-hover:scale-110 transition-transform">
                    {item.icon}
                  </span>
                  {item.text}
                </motion.div>
              ))}
            </div>

            <div className="mt-12 p-8 rounded-[3rem] bg-slate-900 text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10 space-y-4">
                <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">
                  Our Location
                </p>
                <p className="text-lg font-bold leading-tight">
                  {clinic?.address || "Medical District Center"}
                </p>
                <div className="pt-4 flex items-center gap-6">
                  <div>
                    <p className="text-[8px] font-black text-white/30 uppercase mb-1">
                      Phone
                    </p>
                    <p className="text-sm font-black text-blue-400">
                      {clinic?.phone || "+92 300 1234567"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-white/30 uppercase mb-1">
                      Email
                    </p>
                    <p className="text-sm font-black text-blue-400">
                      {clinic?.email || "care@primecare.com"}
                    </p>
                  </div>
                </div>
              </div>
              <FaHospital className="absolute -right-10 -bottom-10 text-[12rem] text-white/5 -rotate-12" />
            </div>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl shadow-slate-100 p-8 sm:p-12 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 text-slate-50 text-8xl pointer-events-none">
              <FaNotesMedical />
            </div>

            <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl bg-red-50 border border-red-100 p-4 text-xs font-bold text-red-600 flex items-center gap-3"
                >
                  <FaShieldAlt /> {errorMsg}
                </motion.div>
              )}

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                    Full Name
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    required
                    className="w-full rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all"
                    placeholder="John Doe"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                    Phone
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    required
                    className="w-full rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all"
                    placeholder="+92..."
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  required
                  className="w-full rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all"
                  placeholder="john@example.com"
                  disabled={loading}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                    Specialist
                  </label>
                  <div className="relative">
                    <select
                      value={form.doctorId}
                      onChange={(e) => updateField("doctorId", e.target.value)}
                      className="w-full appearance-none rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all"
                      disabled={loading}
                    >
                      <option value="">Any Specialist</option>
                      {doctors.map((doc) => (
                        <option key={doc._id} value={doc._id}>
                          {doc.name}
                        </option>
                      ))}
                    </select>
                    <FaChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                    Service
                  </label>
                  <div className="relative">
                    <select
                      value={form.serviceId}
                      onChange={(e) => updateField("serviceId", e.target.value)}
                      required
                      className="w-full appearance-none rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all"
                      disabled={loading}
                    >
                      <option value="">Choose Service</option>
                      {services.map((srv) => (
                        <option key={srv._id} value={srv._id}>
                          {srv.title}
                        </option>
                      ))}
                    </select>
                    <FaChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                    Date
                  </label>
                  <input
                    type="date"
                    min={minDate}
                    value={form.date}
                    onChange={(e) => updateField("date", e.target.value)}
                    required
                    className="w-full rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                    Reason
                  </label>
                  <input
                    value={form.reasonForVisit}
                    onChange={(e) =>
                      updateField("reasonForVisit", e.target.value)
                    }
                    placeholder="Regular checkup"
                    className="w-full rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                  Available Slots
                </label>
                {slotsLoading ? (
                  <div className="flex items-center gap-3 text-blue-600 text-[10px] font-black animate-pulse">
                    <FaSyncAlt className="animate-spin" /> SYNCING...
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => updateField("time", slot)}
                        className={`rounded-xl border py-2 text-[10px] font-black transition-all ${
                          form.time === slot
                            ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100"
                            : "bg-white border-slate-100 text-slate-500 hover:border-blue-600 hover:text-blue-600"
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-[10px] font-black text-red-500 uppercase">
                    No slots available
                  </div>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="mt-6 w-full h-16 rounded-[2rem] bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <FaSyncAlt className="animate-spin" />
                ) : (
                  <>
                    <FaCalendarAlt /> Submit Request
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

const FaHospitalSymbol = ({ className }: { className?: string }) => (
  <svg
    stroke="currentColor"
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 512 512"
    className={className}
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M256 160c17.7 0 32 14.3 32 32v128c0 17.7-14.3 32-32 32s-32-14.3-32-32V192c0-17.7 14.3-32 32-32zm160 0c17.7 0 32 14.3 32 32v128c0 17.7-14.3 32-32 32s-32-14.3-32-32V192c0-17.7 14.3-32 32-32zM96 160c17.7 0 32 14.3 32 32v128c0 17.7-14.3 32-32 32s-32-14.3-32-32V192c0-17.7 14.3-32 32-32zm400 240H16c-8.8 0-16 7.2-16 16s7.2 16 16 16h480c8.8 0 16-7.2 16-16s-7.2-16-16-16zM256 32C132.3 32 32 132.3 32 256s100.3 224 224 224 224-100.3 224-224S379.7 32 256 32z"></path>
  </svg>
);
