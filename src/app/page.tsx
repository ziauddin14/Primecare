"use client";

import Link from "next/link";
import Container from "@/components/Container";
import { motion } from "framer-motion";
import Typewriter from "typewriter-effect";
import {
  FaStethoscope,
  FaTooth,
  FaBaby,
  FaHeartbeat,
  FaCalendarCheck,
  FaClock,
  FaRobot,
  FaUserMd,
  FaQuoteLeft,
  FaClinicMedical,
} from "react-icons/fa";

const services = [
  {
    title: "General Medicine",
    desc: "Complete health checkups and preventive care for all ages.",
    icon: <FaStethoscope />,
  },
  {
    title: "Dental Care",
    desc: "Modern dental treatments with gentle service and hygiene.",
    icon: <FaTooth />,
  },
  {
    title: "Pediatrics",
    desc: "Trusted child specialists with compassionate care and guidance.",
    icon: <FaBaby />,
  },
  {
    title: "Cardiology",
    desc: "Heart health diagnostics, monitoring, and specialist consultation.",
    icon: <FaHeartbeat />,
  },
];

const features = [
  {
    title: "24/7 Online Booking",
    desc: "Book anytime from any device.",
    icon: <FaCalendarCheck />,
  },
  {
    title: "Instant Confirmation",
    desc: "Quick submission with clear next steps.",
    icon: <FaClock />,
  },
  {
    title: "Smart Assistance",
    desc: "Get fast answers via our dedicated chat.",
    icon: <FaRobot />,
  },
  {
    title: "Expert Doctors",
    desc: "Qualified specialists you can trust.",
    icon: <FaUserMd />,
  },
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
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

export default function Home() {
  return (
    <main>
      {/* SECTION 1: HERO */}
      <section className="bg-gradient-to-b from-white to-blue-50/60 overflow-hidden">
        <Container>
          <motion.div
            initial="initial"
            animate="animate"
            variants={stagger}
            className="section-tight grid gap-10 lg:grid-cols-2 lg:items-center"
          >
            <motion.div
              variants={fadeInUp}
              className="flex flex-col items-start min-h-[400px]"
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-700 mb-4">
                <FaStethoscope className="text-sm" /> Healthcare Reimagined
              </span>

              <h1 className="h1-tight min-h-[120px] sm:min-h-[160px]">
                Premium Care with <br />
                <span className="text-blue-600">
                  <Typewriter
                    options={{
                      strings: [
                        "Smart Technology",
                        "Expert Specialists",
                        "Patient Comfort",
                        "Elite Standards",
                      ],
                      autoStart: true,
                      loop: true,
                      delay: 75,
                      deleteSpeed: 50,
                    }}
                  />
                </span>
              </h1>

              <p className="mt-4 subtext max-w-xl leading-relaxed font-medium">
                Experience healthcare that respects your time. Book appointments
                instantly with a clinical environment built for your comfort and
                peace of mind.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/appointment"
                  className="px-8 py-3.5 rounded-2xl bg-blue-600 text-white font-bold shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2"
                >
                  <FaCalendarCheck className="text-xl" /> Book Appointment Now
                </Link>

                <Link
                  href="/services"
                  className="px-8 py-3.5 rounded-2xl border border-slate-200 bg-white text-slate-900 font-bold hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-2"
                >
                  Explore Services
                </Link>
              </div>
            </motion.div>

            {/* Right Side - Hero Image placeholder / Card */}
            <motion.div variants={fadeInUp} className="hidden lg:block">
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <FaClinicMedical className="text-blue-600 text-2xl" /> Why
                  PrimeCare?
                </h3>
                <div className="grid gap-4">
                  {features.slice(0, 3).map((f, i) => (
                    <motion.div
                      key={f.title}
                      initial={{ x: 50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="flex items-center gap-4 rounded-2xl border border-slate-50 bg-slate-50/50 p-4 hover:border-blue-100 transition-colors shadow-sm"
                    >
                      <div className="text-blue-600 text-2xl">{f.icon}</div>
                      <span className="text-base font-bold text-slate-800">
                        {f.title}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </Container>
      </section>

      {/* SECTION 2: SERVICES */}
      <section className="bg-white">
        <Container>
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger}
            className="section-tight"
          >
            <motion.div variants={fadeInUp} className="mb-10 max-w-2xl">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
                Expert Medical Services
              </h2>
              <p className="mt-3 subtext font-medium italic">
                World-class healthcare tailored to your needs.
              </p>
            </motion.div>

            <motion.div
              variants={stagger}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            >
              {services.map((s) => (
                <motion.div
                  key={s.title}
                  variants={fadeInUp}
                  whileHover={{
                    y: -8,
                    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
                  }}
                  className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 cursor-default group"
                >
                  <div className="h-16 w-16 rounded-2xl bg-blue-50 flex items-center justify-center text-4xl mb-6 group-hover:bg-blue-600 text-blue-600 group-hover:text-white transition-all duration-300">
                    {s.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    {s.title}
                  </h3>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    {s.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </Container>
      </section>

      {/* SECTION 3: WHY CHOOSE US */}
      <section className="bg-slate-50 border-y border-slate-100">
        <Container>
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger}
            className="section-tight"
          >
            <motion.div variants={fadeInUp} className="mb-10 max-w-2xl">
              <h2 className="text-3xl font-bold text-slate-900">
                Why Choose Us
              </h2>
              <p className="mt-3 subtext font-medium italic">
                The PrimeCare advantage for your health and wellness.
              </p>
            </motion.div>

            <motion.div
              variants={stagger}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            >
              {features.map((f) => (
                <motion.div
                  key={f.title}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.03 }}
                  className="rounded-2xl bg-white border border-slate-100 p-8 shadow-sm transition-all group"
                >
                  <div className="text-4xl text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                    {f.icon}
                  </div>
                  <h3 className="text-base font-black uppercase tracking-tight text-blue-600">
                    {f.title}
                  </h3>
                  <p className="mt-3 text-sm text-slate-600 font-medium leading-relaxed">
                    {f.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </Container>
      </section>

      {/* SECTION 4: TESTIMONIALS */}
      <section className="bg-white">
        <Container>
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger}
            className="section-tight"
          >
            <motion.div variants={fadeInUp} className="mb-10 text-center">
              <h2 className="text-3xl font-bold text-slate-900">
                Patient Success Stories
              </h2>
            </motion.div>

            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  name: "Ayesha K.",
                  text: "Excellent service and easy online booking. The clinic feels premium.",
                },
                {
                  name: "Usman R.",
                  text: "Doctors were professional and the request was super quick to submit.",
                },
                {
                  name: "Hina S.",
                  text: "Very smooth experience. Chat support helped me find info instantly.",
                },
              ].map((t) => (
                <motion.div
                  key={t.name}
                  variants={fadeInUp}
                  whileHover={{ y: -5 }}
                  className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm italic relative overflow-hidden group"
                >
                  <FaQuoteLeft className="absolute -top-6 -right-6 text-8xl text-blue-50/50 group-hover:text-blue-100/50 transition-colors" />
                  <p className="text-base text-slate-700 font-medium leading-relaxed relative z-10">
                    “{t.text}”
                  </p>
                  <p className="mt-6 text-sm font-black uppercase tracking-widest text-blue-600 relative z-10">
                    — {t.name}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </Container>
      </section>
    </main>
  );
}
