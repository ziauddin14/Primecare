"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Container from "./Container";
import { FaClinicMedical } from "react-icons/fa";

const navLinks = [
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/doctors", label: "Doctors" },
  { href: "/appointment", label: "Appointment" },
  { href: "/contact", label: "Contact" },
  { href: "/admin", label: "Admin" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <Container>
        <div className="flex h-16 sm:h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 group">
            <FaClinicMedical className="text-2xl text-blue-600 transition-transform group-hover:scale-110" />
            <div className="flex">
              <span className="text-2xl font-bold tracking-tighter text-blue-600">
                Prime
              </span>
              <span className="text-2xl font-bold tracking-tighter text-slate-900">
                Care
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`text-sm font-bold transition-colors hover:text-blue-600 ${
                  pathname === l.href ? "text-blue-600" : "text-slate-600"
                }`}
              >
                {l.label}
              </Link>
            ))}

            <Link
              href="/appointment"
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md hover:bg-blue-700 active:scale-95 transition-all ml-2"
            >
              Book Now
            </Link>
          </nav>

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => setOpen((v) => !v)}
          >
            <div
              className={`h-0.5 w-6 bg-slate-900 transition-all ${open ? "rotate-45 translate-y-1.5" : ""}`}
            ></div>
            <div
              className={`h-0.5 w-6 bg-slate-900 mt-1.5 transition-all ${open ? "opacity-0" : ""}`}
            ></div>
            <div
              className={`h-0.5 w-6 bg-slate-900 mt-1.5 transition-all ${open ? "-rotate-45 -translate-y-1.5" : ""}`}
            ></div>
          </button>
        </div>

        {/* Mobile Menu */}
        {open && (
          <div className="md:hidden py-6 border-t border-gray-50 animate-in slide-in-from-top-5 duration-300">
            <div className="flex flex-col gap-3 px-2">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`px-4 py-3 text-base font-bold rounded-xl transition-colors ${
                    pathname === l.href
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-600 hover:bg-gray-50"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </Container>
    </header>
  );
}
