"use client";

import Container from "@/components/Container";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FaStethoscope,
  FaTooth,
  FaBaby,
  FaHeartbeat,
  FaChevronRight,
} from "react-icons/fa";

const services = [
  {
    title: "General Medicine",
    desc: "Complete checkups, routine screenings, and preventive care for adults and seniors.",
    points: [
      "Blood pressure & vitals",
      "Routine diagnosis",
      "Preventive guidance",
    ],
    icon: <FaStethoscope />,
  },
  {
    title: "Dental Care",
    desc: "Modern dental services with gentle treatment and hygienic standards.",
    points: ["Cleaning & scaling", "Cavity treatment", "Oral hygiene guidance"],
    icon: <FaTooth />,
  },
  {
    title: "Pediatrics",
    desc: "Compassionate child specialists for healthy growth and development.",
    points: ["Child checkups", "Fever & infection care", "Nutrition guidance"],
    icon: <FaBaby />,
  },
  {
    title: "Cardiology",
    desc: "Heart health consultation, monitoring, and diagnostic support.",
    points: ["ECG screening", "Heart risk assessment", "Specialist consult"],
    icon: <FaHeartbeat />,
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

export default function ServicesClient() {
  return (
    <main className="bg-white min-h-screen">
      <motion.div
        initial="initial"
        animate="animate"
        variants={fadeInUp}
        className="bg-slate-50 border-b border-slate-100"
      >
        <Container>
          <div className="section-tight flex flex-col gap-4 py-12 sm:py-16">
            <h1 className="h1-tight flex items-center gap-4">
              Clinical Services
            </h1>
            <p className="subtext font-medium max-w-2xl leading-relaxed text-lg">
              PrimeCare provides world-class clinical services with a
              patient-first philosophy. We combine advanced medical diagnostic
              technology with compassionate care.
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
          className="section-tight grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {services.map((s) => (
            <motion.div
              key={s.title}
              variants={fadeInUp}
              whileHover={{
                y: -10,
                boxShadow: "0 25px 30px -5px rgba(0,0,0,0.05)",
              }}
              className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm transition-all flex flex-col group"
            >
              <div className="h-16 w-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-3xl mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                {s.icon}
              </div>
              <h2 className="text-2xl font-bold text-slate-900 leading-tight mb-4">
                {s.title}
              </h2>
              <p className="text-base text-slate-600 font-medium leading-relaxed mb-6">
                {s.desc}
              </p>

              <ul className="space-y-3 flex-grow">
                {s.points.map((p) => (
                  <li
                    key={p}
                    className="flex items-center gap-3 text-sm font-bold text-slate-700"
                  >
                    <FaChevronRight className="text-[10px] text-blue-600 font-black" />
                    {p}
                  </li>
                ))}
              </ul>

              <Link
                href="/appointment"
                className="mt-10 px-6 py-4 rounded-2xl bg-blue-600 text-white font-bold shadow-md hover:bg-blue-700 active:scale-95 transition-all text-center flex items-center justify-center gap-2"
              >
                Book Consultation
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </main>
  );
}
