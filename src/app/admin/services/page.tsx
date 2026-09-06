"use client";

import { useEffect, useState } from "react";
import {
  FaConciergeBell,
  FaSyncAlt,
  FaPlus,
  FaEdit,
  FaBan,
  FaCheckCircle,
  FaTimes,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

interface ServiceRow {
  _id: string;
  title: string;
  department: string;
  description?: string;
  duration: number;
  price: number;
  isActive: boolean;
}

const EMPTY_FORM = { title: "", department: "", description: "", duration: "30", price: "0" };

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/services?all=true");
      const json = await res.json();
      if (json.ok) setServices(json.services);
    } catch (err) {
      console.error("Failed to load services", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const flash = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const startCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const startEdit = (s: ServiceRow) => {
    setEditingId(s._id);
    setForm({
      title: s.title,
      department: s.department,
      description: s.description || "",
      duration: String(s.duration),
      price: String(s.price),
    });
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        department: form.department,
        description: form.description || undefined,
        duration: Number(form.duration),
        price: Number(form.price),
      };

      const res = editingId
        ? await fetch(`/api/services/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/services", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const json = await res.json();
      if (json.ok) {
        flash(editingId ? "Service updated" : "Service created");
        setShowForm(false);
        await load();
      } else {
        flash(json.message || "Failed to save service");
      }
    } catch {
      flash("Failed to save service");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (s: ServiceRow) => {
    try {
      const res = s.isActive
        ? await fetch(`/api/services/${s._id}`, { method: "DELETE" })
        : await fetch(`/api/services/${s._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: true }),
          });
      const json = await res.json();
      if (json.ok) {
        flash(s.isActive ? "Service deactivated" : "Service reactivated");
        await load();
      } else {
        flash(json.message || "Failed to update service");
      }
    } catch {
      flash("Failed to update service");
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex justify-center">
        <FaSyncAlt className="animate-spin text-4xl text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <FaConciergeBell className="text-blue-600" /> Clinic Services
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Manage the services patients can book appointments for.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-xs font-bold"
            >
              {message}
            </motion.div>
          )}
          <button
            onClick={startCreate}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
          >
            <FaPlus /> New Service
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={submit}
            className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? "Edit Service" : "New Service"}
              </h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-900">
                <FaTimes />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Title</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full p-4 rounded-xl bg-slate-50 border border-slate-100 font-bold text-slate-900 text-sm focus:ring-4 focus:ring-blue-100 outline-none"
                  placeholder="e.g. Follow-up Consultation"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Department</label>
                <input
                  required
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full p-4 rounded-xl bg-slate-50 border border-slate-100 font-bold text-slate-900 text-sm focus:ring-4 focus:ring-blue-100 outline-none"
                  placeholder="e.g. General Medicine"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Duration (min)</label>
                <input
                  required
                  type="number"
                  min={5}
                  max={480}
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  className="w-full p-4 rounded-xl bg-slate-50 border border-slate-100 font-bold text-slate-900 text-sm focus:ring-4 focus:ring-blue-100 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Price</label>
                <input
                  required
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full p-4 rounded-xl bg-slate-50 border border-slate-100 font-bold text-slate-900 text-sm focus:ring-4 focus:ring-blue-100 outline-none"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Description (optional)</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full p-4 rounded-xl bg-slate-50 border border-slate-100 font-bold text-slate-900 text-sm focus:ring-4 focus:ring-blue-100 outline-none resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-black transition-all disabled:opacity-50"
              >
                {saving ? <FaSyncAlt className="animate-spin" /> : null}
                {editingId ? "Save Changes" : "Create Service"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="p-4">Title</th>
              <th className="p-4">Department</th>
              <th className="p-4">Duration</th>
              <th className="p-4">Price</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s._id} className="border-t border-slate-100">
                <td className="p-4 font-bold text-slate-900">{s.title}</td>
                <td className="p-4 text-slate-500">{s.department}</td>
                <td className="p-4 text-slate-500">{s.duration}m</td>
                <td className="p-4 text-slate-500">{s.price}</td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${s.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}
                  >
                    {s.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => startEdit(s)} className="text-slate-400 hover:text-blue-600" title="Edit">
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => toggleActive(s)}
                      className={s.isActive ? "text-slate-400 hover:text-red-600" : "text-slate-400 hover:text-emerald-600"}
                      title={s.isActive ? "Deactivate" : "Reactivate"}
                    >
                      {s.isActive ? <FaBan /> : <FaCheckCircle />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {services.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                  No services yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
