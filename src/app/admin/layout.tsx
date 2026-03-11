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
  FaSearch,
  FaBell,
  FaChevronDown,
  FaCog,
  FaThLarge,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState("User");
  const [userRole, setUserRole] = useState("Unknown");
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
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
      label: "Dashboard",
      path: "/admin",
      icon: <FaThLarge />,
      roles: ["SUPER_ADMIN", "RECEPTIONIST"],
    },
    {
      label: "New Booking",
      path: "/appointment",
      icon: <FaCalendarCheck />,
      roles: ["SUPER_ADMIN", "RECEPTIONIST"],
    },
    {
      label: "Doctors",
      path: "/admin/doctor",
      icon: <FaUserMd />,
      roles: ["SUPER_ADMIN", "DOCTOR"],
    },
    {
      label: "Live Schedule",
      path: "/admin/doctor/schedule",
      icon: <FaCalendarCheck />,
      roles: ["SUPER_ADMIN", "RECEPTIONIST", "DOCTOR"],
    },
    {
      label: "Patients",
      path: "/admin/patients",
      icon: <FaUserInjured />,
      roles: ["SUPER_ADMIN", "RECEPTIONIST"],
    },
    {
      label: "Appointments",
      path: "/admin/appointments",
      icon: <FaCalendarCheck />,
      roles: ["SUPER_ADMIN", "RECEPTIONIST", "DOCTOR"],
    },
    {
      label: "Analytics",
      path: "/admin/analytics",
      icon: <FaChartPie />,
      roles: ["SUPER_ADMIN"],
    },
    {
      label: "Settings",
      path: "#",
      icon: <FaCog />,
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

  const navLinks =
    userRole === "Unknown"
      ? menuItems
      : menuItems.filter((item) => item.roles.includes(userRole));

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 88 }}
        className="hidden lg:flex flex-col bg-white border-r border-slate-200 shadow-sm z-30 transition-all duration-300 relative"
      >
        <div
          className={`p-6 border-b border-slate-100 flex items-center ${sidebarOpen ? "justify-between" : "justify-center"}`}
        >
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-100 text-white">
                <FaHospitalSymbol className="text-xl" />
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">
                PrimeCare
              </span>
            </div>
          )}
          {!sidebarOpen && (
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-100 text-white">
              <FaHospitalSymbol className="text-xl" />
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`absolute -right-3 top-20 bg-white border border-slate-200 p-1 rounded-full shadow-sm hover:bg-slate-50 transition-colors z-40 hidden lg:block`}
          >
            <FaBars className="text-[10px] text-slate-400" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-1">
          {navLinks.map((item) => (
            <Link
              key={item.label}
              href={item.path}
              className={`flex items-center gap-4 p-3.5 rounded-xl transition-all font-medium text-sm group relative ${
                pathname === item.path
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span
                className={`text-lg ${pathname === item.path ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`}
              >
                {item.icon}
              </span>
              {sidebarOpen && <span>{item.label}</span>}
              {pathname === item.path && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-2 bottom-2 w-1 bg-blue-600 rounded-r-full"
                />
              )}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${sidebarOpen ? "justify-between" : "justify-center"} p-3.5 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all font-medium text-sm group`}
          >
            <div className="flex items-center gap-4">
              <FaSignOutAlt className="text-lg" />
              {sidebarOpen && <span>Log Out</span>}
            </div>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navbar */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 relative z-20 shadow-sm">
          <div className="flex items-center gap-4 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-slate-600 bg-slate-50 rounded-lg border border-slate-200"
            >
              <FaBars />
            </button>
            <span className="font-bold text-slate-900">PrimeCare</span>
          </div>

          <div className="hidden md:flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 w-full max-w-md group focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all">
            <FaSearch className="text-slate-400 text-sm" />
            <input
              type="text"
              placeholder="Search appointments, patients..."
              className="bg-transparent border-none outline-none text-sm font-medium text-slate-900 w-full placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-5">
            <button className="relative p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition-all">
              <FaBell />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>

            <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden sm:block" />

            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200"
              >
                <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                  {userName[0]}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-bold text-slate-900 leading-tight">
                    {userName}
                  </p>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">
                    {userRole.replace("_", " ")}
                  </p>
                </div>
                <FaChevronDown
                  className={`text-[10px] text-slate-400 transition-transform ${profileOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 p-2"
                  >
                    <div className="p-3 border-b border-slate-50 lg:hidden">
                      <p className="text-sm font-bold text-slate-900">
                        {userName}
                      </p>
                      <p className="text-xs text-slate-400 uppercase">
                        {userRole}
                      </p>
                    </div>
                    <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-slate-600 text-sm font-medium transition-all">
                      <FaUserMd className="text-slate-400" /> Account Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 text-red-600 text-sm font-medium transition-all"
                    >
                      <FaSignOutAlt /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Backdrop for mobile search/dropdowns */}
        {profileOpen && (
          <div
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setProfileOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]"
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="lg:hidden fixed left-0 top-0 bottom-0 w-[280px] bg-white z-[70] flex flex-col p-6 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-100">
                      <FaHospitalSymbol className="text-xl" />
                    </div>
                    <span className="text-xl font-bold text-slate-900">
                      PrimeCare
                    </span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
                  >
                    <FaTimes />
                  </button>
                </div>
                <nav className="flex-1 flex flex-col gap-1">
                  {navLinks.map((item) => (
                    <Link
                      key={item.label}
                      href={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-4 p-4 rounded-xl font-medium transition-all ${
                        pathname === item.path
                          ? "bg-blue-50 text-blue-600 shadow-sm"
                          : "text-slate-500"
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <button
                  onClick={handleLogout}
                  className="p-4 rounded-xl bg-red-50 text-red-600 font-bold text-sm flex items-center justify-center gap-3 mt-auto"
                >
                  <FaSignOutAlt /> Sign Out
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <main className="flex-1 overflow-y-auto bg-slate-50/50">
          <div className="h-full relative overflow-x-hidden">{children}</div>
        </main>
      </div>
    </div>
  );
}
