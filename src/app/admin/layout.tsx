"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FaHospitalSymbol,
  FaChartPie,
  FaUserInjured,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaUserMd,
  FaCalendarCheck,
  FaClipboardList,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState("User");
  const [userRole, setUserRole] = useState("Unknown");
  const [loading, setLoading] = useState(true);

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Helper to get simple cookie by name
    const getCookie = (name: string) => {
      if (typeof document === "undefined") return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(";").shift();
    };

    const cookieName = getCookie("user_name");
    const cookieRole = getCookie("user_role");

    if (cookieName) setUserName(decodeURIComponent(cookieName));
    if (cookieRole) setUserRole(cookieRole);

    setLoading(false);
  }, []);

  const menuItems = [
    {
      label: "Counter",
      path: "/admin",
      icon: <FaCalendarCheck />,
      roles: ["SUPER_ADMIN", "RECEPTIONIST"],
    },
    {
      label: "Doctor Hub",
      path: "/admin/doctor",
      icon: <FaUserMd />,
      roles: ["SUPER_ADMIN", "DOCTOR"],
    },
    {
      label: "Patient Records",
      path: "/admin/patients",
      icon: <FaUserInjured />,
      roles: ["SUPER_ADMIN", "RECEPTIONIST"],
    },
    {
      label: "Clinic Insights",
      path: "/admin/analytics",
      icon: <FaChartPie />,
      roles: ["SUPER_ADMIN"],
    },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const navLinks = menuItems.filter((item) => item.roles.includes(userRole));

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-slate-100 shadow-sm z-30">
        <div className="p-8 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-100 text-white">
              <FaHospitalSymbol className="text-xl" />
            </div>
            <span className="text-xl font-black text-slate-800 tracking-tight">
              Primecare
            </span>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-2 mt-4">
          {navLinks.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-4 p-4 rounded-2xl transition-all font-bold text-sm group ${pathname === item.path ? "bg-blue-600 text-white shadow-xl shadow-blue-100" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"}`}
            >
              <span
                className={`text-lg transition-transform ${pathname === item.path ? "scale-110" : "group-hover:scale-110"}`}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-8 mt-auto border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 transition-all font-black text-xs uppercase tracking-widest group shadow-sm border border-red-100"
          >
            <span className="flex items-center gap-3">
              <FaSignOutAlt /> Logout
            </span>
            <FaSignOutAlt className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Toggle & Header */}
        <header className="lg:hidden h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0 relative z-40">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white">
              <FaHospitalSymbol />
            </div>
            <span className="font-black text-slate-800 tracking-tight">
              Primecare
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-3 bg-slate-50 text-slate-900 rounded-xl border border-slate-100 active:scale-95 transition-transform"
          >
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
        </header>

        {/* Identity Bar (Desktop Only - integrated) */}
        <div className="hidden lg:flex absolute top-8 right-12 z-50 pointer-events-none">
          <div className="bg-white/80 backdrop-blur-md border border-slate-100 p-2.5 px-6 rounded-full shadow-2xl flex items-center gap-5 pointer-events-auto">
            <div className="flex flex-col text-right">
              <span className="text-xs font-black text-slate-900 leading-none mb-1">
                {userName}
              </span>
              <span
                className={`text-[9px] font-black uppercase tracking-widest ${userRole === "SUPER_ADMIN" ? "text-blue-600" : userRole === "DOCTOR" ? "text-indigo-600" : "text-slate-400"}`}
              >
                {userRole.replace("_", " ")}
              </span>
            </div>
            <div className="h-10 w-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-blue-600 font-black text-xs">
              {userName[0]}
            </div>
          </div>
        </div>

        {/* Mobile Menu AnimatePresence */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="lg:hidden fixed left-0 top-0 bottom-0 w-80 bg-white z-50 flex flex-col p-8"
              >
                <div className="flex items-center gap-3 mb-12">
                  <div className="bg-blue-600 p-2.5 rounded-2xl text-white">
                    <FaHospitalSymbol className="text-xl" />
                  </div>
                  <span className="text-xl font-black text-slate-800 tracking-tight">
                    Primecare
                  </span>
                </div>
                <nav className="flex-1 flex flex-col gap-3">
                  {navLinks.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-4 p-5 rounded-2xl font-bold transition-all ${pathname === item.path ? "bg-blue-600 text-white shadow-xl shadow-blue-100" : "text-slate-400"}`}
                    >
                      {item.icon} {item.label}
                    </Link>
                  ))}
                </nav>
                <button
                  onClick={handleLogout}
                  className="p-5 rounded-2xl bg-red-50 text-red-600 font-black text-xs uppercase tracking-widest mt-10"
                >
                  Sign Out
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <main className="flex-1 overflow-y-auto bg-[#fcfcfd]">{children}</main>
      </div>
    </div>
  );
}
