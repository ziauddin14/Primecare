"use client";

import { useEffect, useState } from "react";
import Container from "@/components/Container";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaUserMd, FaClock, FaAward, FaArrowRight } from "react-icons/fa";

type Doctor = {
  _id: string;
  name: string;
  department: string;
  schedule: {
    days: string[];
    startTime: string;
    endTime: string;
  };
  bio?: string;
  initial?: string;
};

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function DoctorsClient() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    }
    fetchDoctors();
  }, []);

  return (
    <main className="bg-white min-h-screen">
      <motion.div
        initial="initial"
        animate="animate"
        variants={fadeInUp}
        className="bg-slate-50 border-b border-slate-100"
      >
        <Container>
          <div className="section-tight flex flex-col gap-4 text-center items-center py-12 sm:py-20">
            <h1 className="h1-tight flex items-center gap-4">
              Our Specialists
            </h1>
            <p className="subtext font-medium max-w-2xl text-center italic text-xl">
              Experienced medical practitioners dedicated to ethical,
              evidence-based healthcare.
            </p>
          </div>
        </Container>
      </motion.div>

      <Container>
        {loading ? (
          <div className="section-tight text-center py-20 font-bold text-slate-400">
            Synchronizing specialist database...
          </div>
        ) : (
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger}
            className="section-tight grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
          >
            {doctors.map((d) => (
              <motion.div
                key={d._id}
                variants={fadeInUp}
                whileHover={{
                  y: -10,
                  boxShadow: "0 20px 30px -5px rgba(0,0,0,0.08)",
                }}
                className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm transition-all text-center flex flex-col group"
              >
                <div className="mx-auto h-24 w-24 rounded-full bg-blue-50 flex items-center justify-center text-4xl font-black text-blue-600 border border-blue-100 mb-6 overflow-hidden relative shadow-inner">
                  {d.initial ? d.initial : <FaUserMd />}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 0.1 }}
                    className="absolute inset-0 bg-blue-600"
                  />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                  {d.name}
                </h2>
                <p className="text-sm font-black text-blue-600 uppercase tracking-widest mt-2">
                  {d.department}
                </p>

                <div className="mt-4 flex items-center justify-center gap-1.5 text-blue-500">
                  {[...Array(5)].map((_, i) => (
                    <FaAward key={i} className="text-xs" />
                  ))}
                </div>

                <p className="mt-6 text-[15px] text-slate-600 font-medium leading-relaxed italic flex-grow">
                  {d.bio ||
                    "Patient-centric care focused on delivering optimal clinical outcomes with compassionate expertise."}
                </p>

                <div className="mt-6 rounded-2xl bg-slate-50 p-4 border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <FaClock className="text-slate-400 text-sm" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      Available Hours
                    </p>
                  </div>
                  <p className="text-sm font-bold text-slate-700 leading-tight">
                    {d.schedule.startTime}–{d.schedule.endTime} (
                    {d.schedule.days.join("–")})
                  </p>
                </div>

                <Link
                  href={`/appointment?doctor=${encodeURIComponent(d.name)}`}
                  className="mt-8 px-6 py-4 rounded-2xl bg-blue-600 text-white font-bold shadow-md hover:bg-blue-700 active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                >
                  Book with this doctor <FaArrowRight className="text-xs" />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </Container>
    </main>
  );
}
