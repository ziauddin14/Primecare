"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaComments,
  FaTimes,
  FaRobot,
  FaPaperPlane,
  FaCalendarAlt,
} from "react-icons/fa";

type Msg = { from: "user" | "bot"; text: string };

function getBotReply(inputRaw: string) {
  const input = inputRaw.trim().toLowerCase();
  if (input.includes("appointment") || input.includes("book"))
    return `To book, please click "Book Now" below.`;
  if (input.includes("services"))
    return `General Medicine, Dental, Pediatrics, Cardiology.`;
  if (input.includes("timing")) return `Open 9AM–8PM (Mon–Sat).`;
  if (input.includes("location")) return `Main Boulevard, Lahore.`;
  return `Try: appointment, services, timings, or location.`;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "bot", text: "How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMsgs((p) => [...p, { from: "user", text: userMsg }]);
    setInput("");
    setTimeout(() => {
      setMsgs((p) => [...p, { from: "bot", text: getBotReply(userMsg) }]);
    }, 600);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setOpen(true)}
            className="h-14 w-14 rounded-full bg-blue-600 text-white shadow-xl hover:bg-blue-700 transition flex items-center justify-center text-2xl"
          >
            <FaComments />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="flex w-[92vw] sm:w-80 flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between border-b p-3 bg-white">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-sm">
                  <FaRobot />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  PrimeCare AI
                </h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <FaTimes className="text-sm" />
              </button>
            </div>

            <div className="h-72 overflow-y-auto p-3 space-y-3 bg-slate-50/30">
              {msgs.map((m, i) => (
                <motion.div
                  initial={{ opacity: 0, x: m.from === "user" ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i}
                  className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm font-medium shadow-sm flex items-start gap-2 ${
                      m.from === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-slate-100 text-slate-900"
                    }`}
                  >
                    {m.text}
                  </div>
                </motion.div>
              ))}
              <div ref={endRef} />
            </div>

            <div className="border-t p-3 space-y-2 bg-white">
              <Link
                href="/appointment"
                onClick={() => setOpen(false)}
                className="block w-full rounded-xl bg-blue-50 py-2 text-center text-xs font-bold text-blue-700 hover:bg-blue-100 transition active:scale-95 flex items-center justify-center gap-2"
              >
                <FaCalendarAlt /> Go to Appointment Form
              </Link>
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Ask something..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-100 transition"
                />
                <button
                  onClick={send}
                  className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-blue-700 active:scale-95 shadow-md flex items-center justify-center"
                >
                  <FaPaperPlane />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
