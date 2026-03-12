"use client";

import { useEffect, useState, useMemo } from "react";
import {
  FaUserMd,
  FaClock,
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaSyncAlt,
  FaUserInjured,
  FaSearch,
  FaCheckCircle,
  FaTimesCircle,
  FaBriefcaseMedical,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

type Doctor = {
  _id: string;
  name: string;
  department: string;
  specialization?: string;
};

type Appointment = {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  doctorId?: string;
  patientInfo?: {
    fullName: string;
    phone: string;
  };
  doctorInfo?: {
    name: string;
  };
  reasonForVisit?: string;
};

export default function DoctorSchedule() {
  const [selectedDate, setSelectedDate] = useState(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(
      new Date(),
    ),
  );
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/doctors/schedule?date=${selectedDate}`,
      );
      const json = await res.json();
      if (json.ok) {
        setDoctors(json.doctors || []);
        setAppointments(json.appointments || []);
      }
    } catch {
      console.error("Failed to load schedule");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const changeDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split("T")[0]);
  };

  // Grouping logic: Create columns for each doctor
  const appointmentsByDoctor = useMemo(() => {
    const map: Record<string, Appointment[]> = {
      unassigned: [],
    };

    doctors.forEach((d) => (map[d._id] = []));

    appointments.forEach((a) => {
      const key = a.doctorId || "unassigned";
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });

    return map;
  }, [doctors, appointments]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter(
      (d) =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.department.toLowerCase().includes(search.toLowerCase()),
    );
  }, [doctors, search]);

  const stats = useMemo(() => {
    return {
      total: appointments.length,
      confirmed: appointments.filter((a) => a.status === "CONFIRMED").length,
      requested: appointments.filter((a) => a.status === "REQUESTED").length,
      unassigned: appointments.filter((a) => !a.doctorId).length,
    };
  }, [appointments]);

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen">
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <FaCalendarCheck className="text-blue-600" /> Clinic Operational
            Timeline
          </h1>
          <p className="text-sm text-slate-500 font-medium tracking-tight">
            Comprehensive workload management and scheduling for today.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm shadow-slate-100">
            <button
              onClick={() => changeDate(-1)}
              className="p-2.5 rounded-xl hover:bg-slate-50 transition-all text-slate-400 hover:text-blue-600"
            >
              <FaChevronLeft className="text-sm" />
            </button>
            <div className="px-4 py-1.5 flex flex-col items-center min-w-[140px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                Selected Date
              </span>
              <span className="text-sm font-bold text-slate-900">
                {new Date(selectedDate).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            <button
              onClick={() => changeDate(1)}
              className="p-2.5 rounded-xl hover:bg-slate-50 transition-all text-slate-400 hover:text-blue-600"
            >
              <FaChevronRight className="text-sm" />
            </button>
          </div>

          <div className="relative group">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Filter by Specialist..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 border-blue-600 outline-none transition-all shadow-sm font-bold text-sm tracking-tight w-full sm:w-[260px]"
            />
          </div>

          <button
            onClick={loadData}
            className="p-3.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
          >
            <FaSyncAlt className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Summary Mini-Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
          <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
            <FaBriefcaseMedical />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Total Bookings
            </p>
            <h4 className="text-2xl font-black text-slate-900 leading-none">
              {stats.total}
            </h4>
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
          <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
            <FaCheckCircle />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Confirmed
            </p>
            <h4 className="text-2xl font-black text-slate-900 leading-none">
              {stats.confirmed}
            </h4>
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
          <div className="h-14 w-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
            <FaClock />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Waitlist / Req
            </p>
            <h4 className="text-2xl font-black text-slate-900 leading-none">
              {stats.requested}
            </h4>
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
          <div className="h-14 w-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
            <FaUserInjured />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Unassigned
            </p>
            <h4 className="text-2xl font-black text-slate-900 leading-none">
              {stats.unassigned}
            </h4>
          </div>
        </div>
      </div>

      {/* Main Schedule Container */}
      <div className="bg-slate-50/50 rounded-3xl border border-slate-200 shadow-inner p-8 overflow-x-auto min-h-[600px] custom-scrollbar">
        <div className="flex gap-8 min-w-max">
          {/* Unassigned Box (Special Case) */}
          <div className="w-[320px] flex flex-col gap-6">
            <div className="bg-white p-5 rounded-2xl border-2 border-dashed border-slate-200 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-lg">
                <FaUserInjured />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">
                  Patient Waitlist
                </h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Unassigned Bookings
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {appointmentsByDoctor["unassigned"]?.length > 0 ? (
                appointmentsByDoctor["unassigned"].map((a, i) => (
                  <ScheduleCard key={a._id} appointment={a} />
                ))
              ) : (
                <div className="py-12 flex flex-col items-center text-center opacity-30 italic">
                  <p className="text-sm font-bold text-slate-400">
                    Waitlist Empty
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="w-px bg-slate-200 h-auto self-stretch" />

          {/* Individual Doctor Columns */}
          {filteredDoctors.map((doc, idx) => (
            <div key={doc._id} className="w-[320px] flex flex-col gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-blue-200 transition-colors">
                <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm font-black">
                  {doc.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 truncate w-[180px]">
                    {doc.name}
                  </h4>
                  <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                    {doc.department}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {appointmentsByDoctor[doc._id]?.length > 0 ? (
                  appointmentsByDoctor[doc._id].map((a) => (
                    <ScheduleCard key={a._id} appointment={a} color="blue" />
                  ))
                ) : (
                  <div className="py-12 flex flex-col items-center text-center opacity-30 italic">
                    <p className="text-sm font-bold text-slate-400 px-4">
                      No appointments for {doc.name.split(" ")[0]}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScheduleCard({
  appointment,
  color = "slate",
}: {
  appointment: Appointment;
  color?: "blue" | "slate";
}) {
  const isRequested = appointment.status === "REQUESTED";
  const isConfirmed = appointment.status === "CONFIRMED";
  const isCompleted = appointment.status === "COMPLETED";
  const isCancelled =
    appointment.status === "CANCELLED" || appointment.status === "NO_SHOW";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`group bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden ${isCancelled ? "opacity-50" : ""}`}
    >
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 ${isCancelled ? "bg-red-400" : isCompleted ? "bg-emerald-500" : isConfirmed ? "bg-blue-500" : "bg-slate-300"}`}
      />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100 text-[10px] font-black text-slate-600 uppercase">
          <FaClock className="text-blue-500 text-[9px]" />{" "}
          {appointment.startTime}
        </div>
        <span
          className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${isCompleted ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : isConfirmed ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-slate-100 text-slate-500"}`}
        >
          {appointment.status.replace("_", "-")}
        </span>
      </div>

      <div className="space-y-1 mb-4">
        <h5 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">
          {appointment.patientInfo?.fullName || "Walk-in Patient"}
        </h5>
        <p className="text-xs font-medium text-slate-400">
          {appointment.patientInfo?.phone}
        </p>
      </div>

      {appointment.reasonForVisit && (
        <div className="p-3 rounded-xl bg-slate-50 text-[10px] font-medium text-slate-600 leading-relaxed italic mb-4">
          "{appointment.reasonForVisit}"
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Operational ID: {appointment._id.slice(-4)}
        </span>
        <button className="h-8 w-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm">
          <FaChevronRight className="text-[8px]" />
        </button>
      </div>
    </motion.div>
  );
}

// Reuse from page.tsx or lib/models - but keep local for standalone ease
const FaCalendarCheck = ({ className }: { className?: string }) => (
  <svg
    stroke="currentColor"
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 448 512"
    className={className}
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M128 0c17.7 0 32 14.3 32 32V64H288V32c0-17.7 14.3-32 32-32s32 14.3 32 32V64h48c26.5 0 48 21.5 48 48v48H0V112C0 85.5 21.5 64 48 64H96V32c0-17.7 14.3-32 32-32zM0 192H448V464c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V192zm313.5 129.5c-9.4-9.4-24.6-9.4-33.9 0L208 393.5l-45.5-45.5c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l62.4 62.4c9.4 9.4 24.6 9.4 33.9 0l92.5-92.5c9.4-9.4 9.4-24.6 0-33.9z"></path>
  </svg>
);
