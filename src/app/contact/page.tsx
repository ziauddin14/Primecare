"use client";

import { useState } from "react";
import Container from "@/components/Container";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaPaperPlane,
  FaHeadset,
  FaCheckCircle,
} from "react-icons/fa";

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

export default function ContactPage() {
  const [sent, setSent] = useState(false);

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
              <FaHeadset className="text-blue-600 text-5xl" /> Contact Us
            </h1>
            <p className="subtext font-medium leading-relaxed max-w-2xl text-xl">
              Reach out via our dedicated channels or the secure form below. Our
              support team is available for coordination.
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
          className="section-tight grid gap-16 lg:grid-cols-2 lg:items-start max-w-6xl mx-auto py-12 sm:py-20"
        >
          <motion.div variants={fadeInUp}>
            <h2 className="text-2xl font-bold text-slate-900 mb-10">
              Communication Channels
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {[
                {
                  label: "Helpline",
                  val: "+92 300 1234567",
                  icon: <FaPhoneAlt />,
                },
                {
                  label: "Email",
                  val: "contact@primecare.com",
                  icon: <FaEnvelope />,
                },
                {
                  label: "Address",
                  val: "Main Blvd, Lahore",
                  icon: <FaMapMarkerAlt />,
                },
                { label: "Hours", val: "9AM–8PM", icon: <FaClock /> },
              ].map((item) => (
                <motion.div
                  key={item.label}
                  whileHover={{ scale: 1.05 }}
                  className="rounded-[2rem] border border-slate-100 bg-slate-50/50 p-8 shadow-sm group transition-all"
                >
                  <div className="text-4xl text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                    {item.label}
                  </h3>
                  <p className="text-lg font-bold text-slate-900">{item.val}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="rounded-[2.5rem] border border-slate-200 bg-white p-10 lg:p-14 shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-10 flex items-center gap-4">
              <FaPaperPlane className="text-blue-600 text-2xl" /> Inquiry Node
            </h2>

            <AnimatePresence>
              {sent && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-8 rounded-2xl border border-green-100 bg-green-50 p-5 text-base font-bold text-green-700 flex items-center gap-3 overflow-hidden"
                >
                  <FaCheckCircle className="text-xl" /> Message logged
                  successfully.
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-6">
              <div className="space-y-2">
                <input
                  placeholder="Your Name"
                  className="w-full rounded-2xl border border-slate-200 px-6 py-4 text-base font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all bg-slate-50/30"
                />
              </div>
              <div className="space-y-2">
                <input
                  placeholder="Email Address"
                  className="w-full rounded-2xl border border-slate-200 px-6 py-4 text-base font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all bg-slate-50/30"
                />
              </div>
              <div className="space-y-2">
                <textarea
                  rows={4}
                  placeholder="Describe your inquiry..."
                  className="w-full rounded-2xl border border-slate-200 px-6 py-4 text-base font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all bg-slate-50/30 resize-none"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSent(true)}
                className="w-full h-16 rounded-[1.5rem] bg-blue-600 text-white font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-4"
              >
                <FaPaperPlane className="text-xl" /> Send Message
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </main>
  );
}
