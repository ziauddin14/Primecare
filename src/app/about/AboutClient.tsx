"use client";

import Container from "@/components/Container";
import { motion } from "framer-motion";
import {
  FaCheckCircle,
  FaBullseye,
  FaHospital,
  FaUserNurse,
  FaMicroscope,
  FaAmbulance,
  FaHandHoldingHeart,
} from "react-icons/fa";

const highlights = [
  {
    title: "Patient-First",
    desc: "Designed for professional guidance.",
    icon: <FaHandHoldingHeart />,
  },
  {
    title: "Smart Intake",
    desc: "Efficient medical clarity system.",
    icon: <FaMicroscope />,
  },
  {
    title: "Expert Specialists",
    desc: "Integrated care practitioners.",
    icon: <FaUserNurse />,
  },
  {
    title: "24/7 Support",
    desc: "Real-time automated assistance.",
    icon: <FaAmbulance />,
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

export default function AboutClient() {
  return (
    <main className="bg-white min-h-screen">
      <motion.div
        initial="initial"
        animate="animate"
        variants={fadeInUp}
        className="bg-slate-50 border-b border-slate-100"
      >
        <Container>
          <div className="section-tight flex flex-col gap-4 py-12 sm:py-20">
            <h1 className="h1-tight flex items-center gap-4">
              About PrimeCare
            </h1>
            <p className="subtext font-medium leading-relaxed max-w-2xl text-xl">
              PrimeCare represents the intersection of clinical excellence and
              patient-centric technology. We are committed to establishing a
              higher standard of healthcare.
            </p>
          </div>
        </Container>
      </motion.div>

      <Container>
        <div className="section-tight flex flex-col gap-16 py-12 sm:py-20">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger}
            className="grid gap-16 lg:grid-cols-2 lg:items-center"
          >
            <motion.div
              variants={fadeInUp}
              className="flex flex-col items-start gap-4"
            >
              <h2 className="text-3xl font-bold text-slate-900 leading-tight flex items-center gap-4">
                <FaHospital className="text-blue-600 text-4xl" /> Precision &
                Comfort
              </h2>
              <p className="text-lg text-slate-600 font-medium leading-relaxed">
                Integrated medical facility providing specialty consultations,
                preventive screenings, and acute clinical interventions. We
                leverage digital intelligence to ensure your journey is
                seamless.
              </p>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-xl group"
            >
              <h3 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-4">
                <FaBullseye className="text-blue-600 text-3xl" /> Our Mission
              </h3>
              <div className="grid gap-4">
                {[
                  "Standardized Medical Protocols",
                  "Advanced Specialist Intake Flow",
                  "Real-time Coordination Technology",
                ].map((item, i) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="text-base font-bold text-slate-700 flex items-center gap-4"
                  >
                    <FaCheckCircle className="text-blue-600 text-2xl" /> {item}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {highlights.map((h) => (
              <motion.div
                key={h.title}
                variants={fadeInUp}
                whileHover={{ y: -10 }}
                className="rounded-[2rem] border border-slate-100 bg-slate-50/50 p-8 shadow-sm transition-all group"
              >
                <div className="text-4xl text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                  {h.icon}
                </div>
                <h3 className="text-base font-black uppercase tracking-tight text-blue-600">
                  {h.title}
                </h3>
                <p className="mt-3 text-[15px] text-slate-600 font-medium leading-relaxed">
                  {h.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Container>
    </main>
  );
}
