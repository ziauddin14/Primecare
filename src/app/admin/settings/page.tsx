"use client";

import { useEffect, useState } from "react";
import {
  FaCog,
  FaHospital,
  FaClock,
  FaPalette,
  FaSave,
  FaSyncAlt,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
} from "react-icons/fa";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [message, setMessage] = useState("");

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      const json = await res.json();
      if (json.ok) {
        setConfig(json.config);
      }
    } catch (err) {
      console.error("Failed to load settings", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const json = await res.json();
      if (json.ok) {
        setMessage("Settings saved successfully!");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      setMessage("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  if (loading)
    return (
      <div className="p-12 flex justify-center">
        <FaSyncAlt className="animate-spin text-4xl text-blue-600" />
      </div>
    );

  return (
    <div className="p-8 space-y-8 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <FaCog className="text-blue-600" /> Clinic Configuration
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Manage your clinic's identity, branding, and operational rules for
            the demo.
          </p>
        </div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-xs font-bold"
          >
            {message}
          </motion.div>
        )}
      </div>

      <form onSubmit={handleSave} className="grid lg:grid-cols-2 gap-8">
        {/* Basic Identity */}
        <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
            <FaHospital className="text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Clinic Identity
            </h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                Clinic Name
              </label>
              <input
                value={config?.name || ""}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                className="w-full p-4 rounded-xl bg-slate-50 border border-slate-100 font-bold text-slate-900 text-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                placeholder="e.g. Primecare Health Center"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                  Public Phone
                </label>
                <div className="relative">
                  <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input
                    value={config?.phone || ""}
                    onChange={(e) =>
                      setConfig({ ...config, phone: e.target.value })
                    }
                    className="w-full p-4 pl-11 rounded-xl bg-slate-50 border border-slate-100 font-bold text-slate-900 text-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                  Public Email
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input
                    value={config?.email || ""}
                    onChange={(e) =>
                      setConfig({ ...config, email: e.target.value })
                    }
                    className="w-full p-4 pl-11 rounded-xl bg-slate-50 border border-slate-100 font-bold text-slate-900 text-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                Physical Address
              </label>
              <div className="relative">
                <FaMapMarkerAlt className="absolute left-4 top-4 text-slate-300" />
                <textarea
                  rows={3}
                  value={config?.address || ""}
                  onChange={(e) =>
                    setConfig({ ...config, address: e.target.value })
                  }
                  className="w-full p-4 pl-11 rounded-xl bg-slate-50 border border-slate-100 font-bold text-slate-900 text-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Operational Flow */}
        <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
            <FaClock className="text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Operational Flow
            </h2>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                  Shift Start
                </label>
                <input
                  type="time"
                  value={config?.workingHours?.start || "09:00"}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      workingHours: {
                        ...config.workingHours,
                        start: e.target.value,
                      },
                    })
                  }
                  className="w-full p-4 rounded-xl bg-slate-50 border border-slate-100 font-bold text-slate-900 text-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                  Shift End
                </label>
                <input
                  type="time"
                  value={config?.workingHours?.end || "18:00"}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      workingHours: {
                        ...config.workingHours,
                        end: e.target.value,
                      },
                    })
                  }
                  className="w-full p-4 rounded-xl bg-slate-50 border border-slate-100 font-bold text-slate-900 text-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                Slot Duration (Min)
              </label>
              <div className="flex items-center gap-4">
                {[15, 20, 30, 45, 60].map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() =>
                      setConfig({ ...config, appointmentDuration: dur })
                    }
                    className={`flex-1 py-3 rounded-xl border text-xs font-bold transition-all ${config?.appointmentDuration === dur ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100" : "bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300"}`}
                  >
                    {dur}m
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-slate-400 font-medium pt-2 italic">
                Sets the baseline for the automated booking calendar.
              </p>
            </div>

            <div className="space-y-1 pt-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                Branding Theme
              </label>
              <div className="flex items-center gap-4">
                <div className="flex-1 p-4 rounded-2xl bg-blue-50 border border-blue-100 text-center">
                  <div className="h-6 w-full bg-blue-600 rounded-lg mb-2 shadow-sm" />
                  <span className="text-[10px] font-black text-blue-800 uppercase">
                    Primary Blue
                  </span>
                </div>
                <div className="flex-1 p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-center">
                  <div className="h-6 w-full bg-indigo-600 rounded-lg mb-2 shadow-sm" />
                  <span className="text-[10px] font-black text-indigo-800 uppercase">
                    Modern Navy
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="lg:col-span-2 flex justify-end">
          <button
            disabled={saving}
            className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-50"
          >
            {saving ? <FaSyncAlt className="animate-spin" /> : <FaSave />}
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
