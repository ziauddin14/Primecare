import Link from "next/link";
import Container from "./Container";
import {
  FaClinicMedical,
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
  FaInstagram,
} from "react-icons/fa";

const col1 = [
  { label: "About Us", href: "/about" },
  { label: "Annual Checkup", href: "/services" },
  { label: "Blog", href: "#" },
  { label: "Careers", href: "#" },
];

const col2 = [
  { label: "Get a Diagnosis", href: "#" },
  { label: "How it works", href: "#" },
  { label: "Privacy Policy", href: "/privacy" },
];

const col3 = [
  { label: "Contact Us", href: "/contact" },
  { label: "FAQ’s", href: "#" },
  { label: "Health Plans", href: "#" },
  { label: "View More", href: "#" },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <Container>
        {/* TOP FOOTER */}
        <div className="py-12 lg:py-16 grid gap-12 lg:grid-cols-12">
          {/* Logo / Brand */}
          <div className="lg:col-span-3">
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
            <p className="mt-4 text-sm text-slate-500 leading-relaxed max-w-xs">
              PrimeCare is a modern clinic demo focused on clean experience and
              smart booking. We provide world-class healthcare with a human
              touch.
            </p>
          </div>

          {/* Link Columns */}
          <div className="lg:col-span-7 grid gap-8 sm:grid-cols-3">
            <FooterCol links={col1} />
            <FooterCol links={col2} />
            <FooterCol links={col3} />
          </div>

          {/* Social */}
          <div className="lg:col-span-2">
            <p className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
              Follow Us
            </p>
            <div className="flex items-center gap-3">
              <SocialIcon label="Facebook" icon={<FaFacebookF />} />
              <SocialIcon label="Twitter" icon={<FaTwitter />} />
              <SocialIcon label="LinkedIn" icon={<FaLinkedinIn />} />
              <SocialIcon label="Instagram" icon={<FaInstagram />} />
            </div>
          </div>
        </div>

        {/* DIVIDER */}
        <div className="border-t border-slate-100" />

        {/* BOTTOM BAR */}
        <div className="py-6 flex flex-col items-center text-center gap-4 sm:flex-row sm:items-center sm:justify-between sm:text-left text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} PrimeCare Clinic. All rights reserved.
          </p>
          <div className="flex gap-6 font-medium">
            <Link href="#" className="hover:text-blue-600 transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-blue-600 transition-colors">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title?: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      {title ? (
        <p className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 group-hover:text-blue-600 transition-colors">
          {title}
        </p>
      ) : (
        <div className="h-4 sm:mb-4 lg:block" />
      )}
      <ul className="space-y-3">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-sm text-slate-600 hover:text-blue-600 hover:translate-x-1 inline-block transition-all duration-200"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialIcon({ label, icon }: { label: string; icon: React.ReactNode }) {
  // Mapping custom colors to tailwind or using brand-specific ones if logic needed
  // Since we want "Premium", I'll use subtle hover effects
  return (
    <button
      type="button"
      aria-label={label}
      className={`h-10 w-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:text-white hover:border-transparent hover:bg-blue-600 active:scale-90 transition-all duration-300`}
    >
      <span className="text-sm">{icon}</span>
    </button>
  );
}
