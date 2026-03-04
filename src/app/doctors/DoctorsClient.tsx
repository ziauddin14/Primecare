"use client";

import Container from "@/components/Container";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaUserMd, FaClock, FaAward, FaArrowRight } from "react-icons/fa";

const doctors = [
  {
    name: "Dr. Ahmed Khan",
    specialty: "General Medicine",
    timings: "10AM–6PM (Mon–Sat)",
    bio: "Chief of Medicine with 15+ years experience in preventive diagnostic and wellness.",
    initial: "A",
  },
  {
    name: "Dr. Sara Malik",
    specialty: "Dental Care",
    timings: "12PM–7PM (Mon–Fri)",
    bio: "Dental Specialist focused on modern surgical treatments with high standards of comfort.",
    initial: "S",
  },
  {
    name: "Dr. Ali Raza",
    specialty: "Pediatrics",
    timings: "9AM–2PM (Mon–Sat)",
    bio: "Senior Pediatrician specializing in early childhood development and child immunity.",
    initial: "A",
  },
  {
    name: "Dr. Hina Shah",
    specialty: "Cardiology",
    timings: "2PM–8PM (Tue–Sun)",
    bio: "Heart Health Specialist providing advanced non-invasive cardiac diagnostics.",
    initial: "H",
  },
];

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
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={stagger}
          className="section-tight grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          {doctors.map((d) => (
            <motion.div
              key={d.name}
              variants={fadeInUp}
              whileHover={{
                y: -10,
                boxShadow: "0 20px 30px -5px rgba(0,0,0,0.08)",
              }}
              className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm transition-all text-center flex flex-col group"
            >
              <div className="mx-auto h-24 w-24 rounded-full bg-blue-50 flex items-center justify-center text-4xl font-black text-blue-600 border border-blue-100 mb-6 overflow-hidden relative shadow-inner">
                <FaUserMd />
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
                {d.specialty}
              </p>

              <div className="mt-4 flex items-center justify-center gap-1.5 text-blue-500">
                {[...Array(5)].map((_, i) => (
                  <FaAward key={i} className="text-xs" />
                ))}
              </div>

              <p className="mt-6 text-[15px] text-slate-600 font-medium leading-relaxed italic flex-grow">
                {d.bio}
              </p>

              <div className="mt-6 rounded-2xl bg-slate-50 p-4 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <FaClock className="text-slate-400 text-sm" />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Available Hours
                  </p>
                </div>
                <p className="text-sm font-bold text-slate-700 leading-tight">
                  {d.timings}
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
      </Container>
    </main>
  );
}
