"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FaSyncAlt,
  FaSearch,
  FaCalendarCheck,
  FaClock,
  FaCheckCircle,
  FaStethoscope,
  FaTimesCircle,
  FaUserInjured,
  FaChevronRight,
  FaCalendarAlt,
  FaEllipsisV,
  FaTimes,
  FaFilter,
  FaEdit,
  FaDollarSign,
  FaNotesMedical,
  FaList,
  FaCalendarWeek,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const statusFlow = [
  {
    key: "REQUESTED",
    label: "Requested",
    color: "bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
    border: "border-slate-200",
  },
  {
    key: "CONFIRMED",
    label: "Confirmed",
    color: "bg-blue-50 text-blue-600",
    dot: "bg-blue-500",
    border: "border-blue-200",
  },
  {
    key: "COMPLETED",
    label: "Completed",
    color: "bg-emerald-50 text-emerald-600",
    dot: "bg-emerald-500",
    border: "border-emerald-200",
  },
  {
    key: "CANCELLED",
    label: "Cancelled",
    color: "bg-red-50 text-red-600",
    dot: "bg-red-500",
    border: "border-red-200",
  },
  {
    key: "NO_SHOW",
    label: "No-Show",
    color: "bg-rose-50 text-rose-600",
    dot: "bg-rose-500",
    border: "border-rose-200",
  },
];

export default function AppointmentsPage() {
  const [data, setData] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Filters
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDoc, setFilterDoc] = useState("");
  const [filterService, setFilterService] = useState("");

  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Reschedule / Note state
  const [rescheduleData, setRescheduleData] = useState({
    date: "",
    time: "",
    doctorId: "",
  });
  const [notesDraft, setNotesDraft] = useState("");
  const [paymentDraft, setPaymentDraft] = useState("");

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appRes, docRes, srvRes] = await Promise.all([
        fetch("/api/appointments"),
        fetch("/api/doctors"),
        fetch("/api/services"),
      ]);
      const appJson = await appRes.json();
      const docJson = await docRes.json();
      const srvJson = await srvRes.json();

      if (appJson.ok) setData(appJson.appointments || []);
      if (docJson.ok) setDoctors(docJson.doctors || []);
      if (srvJson.ok) setServices(srvJson.services || []);
    } catch (err) {
      console.error("Failed to load appointments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync state when selecting
  useEffect(() => {
    if (selectedApp) {
      setNotesDraft(selectedApp.internalNotes || "");
      setPaymentDraft(selectedApp.paymentStatus || "UNPAID");
      setRescheduleData({
        date: selectedApp.date,
        time: selectedApp.startTime,
        doctorId: selectedApp.doctorId || "",
      });
    }
  }, [selectedApp]);

  // Fetch Slots for reschedule
  useEffect(() => {
    if (!rescheduleData.date) {
      setAvailableSlots([]);
      return;
    }
    async function fetchSlots() {
      setSlotsLoading(true);
      try {
        const url = `/api/slots?date=${rescheduleData.date}${rescheduleData.doctorId ? "&doctorId=" + rescheduleData.doctorId : ""}`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.ok) {
          setAvailableSlots(json.availableSlots || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSlotsLoading(false);
      }
    }
    fetchSlots();
  }, [rescheduleData.date, rescheduleData.doctorId]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await loadData();
        if (selectedApp && selectedApp._id === id) {
          setSelectedApp((prev: any) => ({ ...prev, status }));
        }
      } else {
        const json = await res.json();
        alert(json.message || "Failed to update status");
      }
    } catch (err) {
      console.error("Update failed", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const updateNotes = async () => {
    if (!selectedApp) return;
    try {
      const res = await fetch(`/api/appointments/${selectedApp._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_notes", note: notesDraft }),
      });
      if (res.ok) {
        alert("Notes updated");
        await loadData();
        setSelectedApp((prev: any) => ({ ...prev, internalNotes: notesDraft }));
      }
    } catch (err) {
      alert("Failed to update notes");
    }
  };

  const updatePayment = async () => {
    if (!selectedApp) return;
    try {
      const res = await fetch(`/api/appointments/${selectedApp._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_payment",
          paymentStatus: paymentDraft,
        }),
      });
      if (res.ok) {
        alert("Payment updated");
        await loadData();
        setSelectedApp((prev: any) => ({
          ...prev,
          paymentStatus: paymentDraft,
        }));
      }
    } catch (err) {
      alert("Failed to update payment");
    }
  };

  const handleReschedule = async () => {
    if (!selectedApp) return;
    setUpdatingId(selectedApp._id);
    try {
      const res = await fetch(`/api/appointments/${selectedApp._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reschedule",
          date: rescheduleData.date,
          time: rescheduleData.time,
          doctorId: rescheduleData.doctorId,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        alert(json.message);
        await loadData();
        setSelectedApp(null);
      } else {
        alert(json.message || "Failed to reschedule");
      }
    } catch (err) {
      alert("Failed to reschedule");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter((a) => {
      // Search
      const sl = search.toLowerCase();
      const matchSearch =
        !search ||
        a.patientInfo?.fullName.toLowerCase().includes(sl) ||
        a.patientInfo?.phone.includes(search);

      // Filters
      const matchDate = !filterDate || a.date === filterDate;
      const matchStatus = !filterStatus || a.status === filterStatus;
      const matchDoc =
        !filterDoc ||
        a.doctorId === filterDoc ||
        (!a.doctorId && filterDoc === "any");
      const matchSrv = !filterService || a.serviceId === filterService;

      return matchSearch && matchDate && matchStatus && matchDoc && matchSrv;
    });
  }, [data, search, filterDate, filterStatus, filterDoc, filterService]);

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
              <FaCalendarAlt />
            </div>
            Appointments Management
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Review, confirm, and schedule clinic appointments.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group flex-1 sm:min-w-[200px]">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient name, phone..."
              className="pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all w-full"
            />
          </div>
          <button
            onClick={loadData}
            className="p-3.5 rounded-2xl bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm active:scale-95"
          >
            <FaSyncAlt className={loading ? "animate-spin" : "text-sm"} />
          </button>

          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${viewMode === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <FaList /> List
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${viewMode === "calendar" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <FaCalendarWeek /> Daily
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider pl-1">
            Date
          </label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-sm font-bold outline-none focus:border-blue-500 text-slate-700 shadow-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider pl-1">
            Status
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-sm font-bold outline-none focus:border-blue-500 text-slate-700 shadow-sm appearance-none"
          >
            <option value="">All Statuses</option>
            {statusFlow.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider pl-1">
            Specialist
          </label>
          <select
            value={filterDoc}
            onChange={(e) => setFilterDoc(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-sm font-bold outline-none focus:border-blue-500 text-slate-700 shadow-sm appearance-none"
          >
            <option value="">All Specialists</option>
            <option value="any">Any Specialist</option>
            {doctors.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider pl-1">
            Service
          </label>
          <select
            value={filterService}
            onChange={(e) => setFilterService(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-sm font-bold outline-none focus:border-blue-500 text-slate-700 shadow-sm appearance-none"
          >
            <option value="">All Services</option>
            {services.map((s) => (
              <option key={s._id} value={s._id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Specialist / Service
                  </th>
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Schedule
                  </th>
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <AnimatePresence mode="popLayout">
                  {filteredData.map((app) => {
                    const status =
                      statusFlow.find((s) => s.key === app.status) ||
                      statusFlow[0];
                    return (
                      <motion.tr
                        layout
                        key={app._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`group hover:bg-slate-50/50 transition-colors ${updatingId === app._id ? "opacity-50 pointer-events-none" : ""}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600 uppercase">
                              {app.patientInfo?.fullName[0]}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900">
                                {app.patientInfo?.fullName}
                              </span>
                              <span className="text-xs font-medium text-slate-500">
                                {app.patientInfo?.phone}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700">
                              {app.doctorInfo?.name || "Any Specialist"}
                            </span>
                            <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md mt-1 w-max">
                              {app.serviceInfo?.title || app.department}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                              <FaCalendarAlt className="text-blue-500 text-xs" />
                              {app.date}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                              <FaClock className="text-blue-500 text-xs" />
                              {app.startTime}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 space-y-2">
                          <div>
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${status.color}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${status.dot}`}
                              />
                              {status.label}
                            </span>
                          </div>
                          <div>
                            {app.paymentStatus === "UNPAID" ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded uppercase">
                                Unpaid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                                Paid
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="p-2.5 bg-white text-slate-400 rounded-xl shadow-sm border border-slate-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all active:scale-95"
                          >
                            <FaChevronRight className="text-xs" />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
                {!loading && filteredData.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-16 text-center text-slate-400 italic text-sm font-medium"
                    >
                      No appointments found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden min-h-[500px] p-6 lg:p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-slate-900">
              Daily Schedule View
            </h2>
            {!filterDate && (
              <p className="text-sm font-bold text-rose-500 bg-rose-50 px-3 py-1 rounded-lg">
                Please select a Date in the filter above to see daily schedule.
              </p>
            )}
          </div>

          {filterDate ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredData.map((app) => {
                const status =
                  statusFlow.find((s) => s.key === app.status) || statusFlow[0];
                return (
                  <div
                    key={app._id}
                    onClick={() => setSelectedApp(app)}
                    className="border border-slate-200 rounded-2xl p-5 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer bg-slate-50 relative overflow-hidden group"
                  >
                    <div
                      className={`absolute top-0 left-0 w-1.5 h-full ${status.dot}`}
                    />
                    <div className="flex justify-between items-start mb-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase ${status.color}`}
                      >
                        {status.label}
                      </span>
                      <div className="text-xs font-black text-slate-800 bg-white px-2 py-1 rounded shadow-sm border border-slate-100 flex items-center gap-1">
                        <FaClock className="text-blue-500" /> {app.startTime}
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">
                      {app.patientInfo?.fullName}
                    </h3>
                    <p className="text-xs font-bold text-slate-500 mb-4">
                      {app.patientInfo?.phone}
                    </p>

                    <div className="border-t border-slate-200 pt-4 space-y-2">
                      <p className="text-xs font-medium text-slate-600 flex items-center gap-2">
                        <FaStethoscope className="text-slate-400" />{" "}
                        {app.doctorInfo?.name || "Any Specialist"}
                      </p>
                      <p className="text-xs font-medium text-slate-600 flex items-center gap-2">
                        <FaNotesMedical className="text-slate-400" />{" "}
                        {app.serviceInfo?.title || "No Service"}
                      </p>
                    </div>
                  </div>
                );
              })}
              {filteredData.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 italic text-sm font-medium">
                  No appointments found for {filterDate}.
                </div>
              )}
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl">
              <div className="text-center text-slate-400">
                <FaCalendarWeek className="mx-auto text-4xl text-slate-200 mb-3" />
                <p className="font-bold">Select a date to view slots</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Drawer */}
      <AnimatePresence>
        {selectedApp && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedApp(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-[500px] bg-white z-[110] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-600 text-white shadow-md shadow-blue-200 rounded-xl">
                    <FaUserInjured />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 leading-tight">
                      Booking Detail
                    </h2>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                      Source: {selectedApp.bookingSource || "Website"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="p-2 bg-white text-slate-400 rounded-lg border border-slate-200 shadow-sm hover:text-rose-500 hover:border-rose-200 transition-colors"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Patient / Visit Info Box */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl font-black text-indigo-600 shadow-sm">
                      {selectedApp.patientInfo?.fullName[0]}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900">
                        {selectedApp.patientInfo?.fullName}
                      </h3>
                      <p className="text-sm font-bold text-slate-500">
                        {selectedApp.patientInfo?.phone}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Service Requested
                      </p>
                      <p className="text-sm font-bold text-slate-800">
                        {selectedApp.serviceInfo?.title || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Reason for Visit / Symptoms
                      </p>
                      <p className="text-sm font-medium text-slate-700">
                        {selectedApp.reasonForVisit || (
                          <span className="text-slate-400 italic">
                            None provided
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Patient Notes
                      </p>
                      <p className="text-sm font-medium text-slate-700">
                        {selectedApp.notes || (
                          <span className="text-slate-400 italic">
                            None provided
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Workflow & Status */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Workflow & Status
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {statusFlow.map((s) => (
                      <button
                        key={s.key}
                        onClick={() => updateStatus(selectedApp._id, s.key)}
                        className={`px-4 py-2.5 rounded-xl text-[11px] font-black uppercase transition-all border ${selectedApp.status === s.key ? `${s.color} ${s.border} ring-2 ring-blue-100 shadow-sm` : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"}`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reschedule Box */}
                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <FaCalendarAlt /> Reschedule & Assignment
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block">
                        Specialist
                      </label>
                      <select
                        value={rescheduleData.doctorId}
                        onChange={(e) =>
                          setRescheduleData({
                            ...rescheduleData,
                            doctorId: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 outline-none"
                      >
                        <option value="">Any Specialist</option>
                        {doctors.map((d) => (
                          <option key={d._id} value={d._id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block">
                        Date
                      </label>
                      <input
                        type="date"
                        value={rescheduleData.date}
                        onChange={(e) =>
                          setRescheduleData({
                            ...rescheduleData,
                            date: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block">
                        Time
                      </label>
                      <select
                        value={rescheduleData.time}
                        onChange={(e) =>
                          setRescheduleData({
                            ...rescheduleData,
                            time: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 outline-none"
                      >
                        <option value="">Select Time...</option>
                        {rescheduleData.date === selectedApp.date &&
                          rescheduleData.doctorId === selectedApp.doctorId && (
                            <option value={selectedApp.startTime}>
                              {selectedApp.startTime} (Current)
                            </option>
                          )}
                        {slotsLoading && <option>Loading...</option>}
                        {availableSlots.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={handleReschedule}
                    className="w-full py-3 bg-slate-900 hover:bg-black text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                    disabled={slotsLoading || updatingId === selectedApp._id}
                  >
                    Update Schedule
                  </button>
                </div>

                {/* Internal Notes & Payment */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3 bg-orange-50/50 p-4 border border-orange-100 rounded-2xl">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <FaDollarSign className="text-orange-500" /> Finance
                    </h4>
                    <select
                      value={paymentDraft}
                      onChange={(e) => setPaymentDraft(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-orange-200 text-sm font-bold bg-white text-slate-700 outline-none"
                    >
                      <option value="UNPAID">Unpaid</option>
                      <option value="PAID">Paid</option>
                    </select>
                    <button
                      onClick={updatePayment}
                      className="w-full py-2 bg-white border border-orange-200 text-orange-600 rounded-lg text-xs font-bold hover:bg-orange-100 transition-all"
                    >
                      Save Payment
                    </button>
                  </div>

                  <div className="space-y-3 bg-blue-50/50 p-4 border border-blue-100 rounded-2xl">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <FaEdit className="text-blue-500" /> Internal Note
                    </h4>
                    <textarea
                      value={notesDraft}
                      placeholder="Private clinic notes..."
                      onChange={(e) => setNotesDraft(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl border border-blue-200 text-xs font-medium bg-white outline-none resize-none"
                    />
                    <button
                      onClick={updateNotes}
                      className="w-full py-2 bg-white border border-blue-200 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all"
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
