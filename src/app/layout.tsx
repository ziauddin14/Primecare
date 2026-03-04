import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ClientWrapper from "@/components/ClientWrapper";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://primecareclinic.vercel.app"),
  title: {
    default: "PrimeCare Clinic — Smart Online Appointment Booking",
    template: "%s | PrimeCare Clinic",
  },
  description:
    "PrimeCare Clinic is a modern healthcare demo website with smart online appointment booking, experienced doctors and AI chat support.",
  keywords: [
    "PrimeCare Clinic",
    "doctor appointment",
    "clinic booking",
    "online healthcare",
    "medical clinic website",
  ],
  openGraph: {
    title: "PrimeCare Clinic — Smart Online Booking",
    description: "Book appointments instantly with PrimeCare Clinic.",
    type: "website",
    locale: "en_US",
    siteName: "PrimeCare Clinic",
  },
  twitter: {
    card: "summary_large_image",
    title: "PrimeCare Clinic",
    description: "Modern clinic demo with smart appointment booking.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${outfit.className} bg-white text-gray-900`}>
        <Navbar />
        <main className="min-h-[calc(100vh-64px)]">{children}</main>
        <Footer />
        <ClientWrapper />
      </body>
    </html>
  );
}
