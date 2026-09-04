# PrimeCare 🏥 | Premium Clinical Management & Patient Portal

PrimeCare is a modern, high-performance web application designed for elite private hospitals and clinics. Built with a focus on **Security**, **SEO**, and **Premium UI/UX**, it provides a robust platform for patient scheduling and clinical administration.

## ✨ Key Features

- **🛡️ Advanced Security**:
  - Secure **Admin Session Management** using HTTP-only cookies.
  - Protected Admin Dashboard (`/admin`) and secure API endpoints.
  - Server-side **Request Validation** powered by Zod.
  - In-memory **Rate Limiting** to prevent spam and bot abuse.
- **🔍 SEO & Performance Optimized**:
  - Dynamic **Sitemap & Robots.txt** generation for better indexing.
  - **Structured Data (JSON-LD)** for rich snippets in Google Search.
  - Page-level optimized metadata for all clinical departments.
  - Zero layout shift (CLS) with **Google Font optimization** (Outfit).
- **📅 Smart Booking Logic**:
  - **Real-time Slot Generation**: Dynamic availability based on specialist schedules and existing bookings.
  - **Duplicate Prevention**: Prevents overlapping appointments for the same patient at the same time.
  - **Input Normalization**: Case-insensitive email and standardized phone matching.
  - **Specialist Pre-selection**: Seamlessly link from doctor profiles to the booking terminal.
- **💼 Elite Admin Console**:
  - **Appointments Management**: Full-lifecycle tracking (Requested ➔ Confirmed ➔ Completed | Cancelled | No-Show).
  - **Rescheduling & Assignment**: Drag-and-drop style rescheduling with real-time slot validation.
  - **Patient CRM**: Centralized database for patient history and contact management.
  - **Internal Notes & Payments**: Securely track clinical notes and payment statuses (Paid/Unpaid) per visit.
- **🎨 Premium UI/UX**:
  - Professional aesthetic using **Tailwind CSS 4**.
  - Fluid animations powered by **Framer Motion**.
  - Brand-integrated **Success Confirmation Cards** and interactive loading states.
- **📱 Full Responsiveness**: Meticulously crafted for all viewports—from mobile-first designs to 4K desktop layouts.

## 🛠️ Tech Stack

- **Framework**: [Next.js (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Validation**: [Zod](https://zod.dev/)
- **Database**: [MongoDB](https://www.mongodb.com/) (Native Driver)
- **Icons**: [React Icons](https://react-icons.github.io/react-icons/)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/ziauddin14/Primecare.git
cd primecare
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Copy `.env.example` to `.env.local` and set your MongoDB connection string:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
```

### 4. Create an Admin Account

There is no default/demo login. Create the first admin user with:

```bash
ADMIN_NAME="Clinic Owner" ADMIN_EMAIL="owner@clinic.com" ADMIN_PASSWORD="a-strong-password" MONGODB_URI="..." node scripts/create_admin.mjs
```

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```text
src/
├── app/               # Next.js App Router
│   ├── api/           # Secured API Handlers (Auth, Appointments, Slots, CRM)
│   ├── admin/         # Private Management Console (Dashboard, Appointments, Patients)
│   ├── login/         # Secure Admin Sign-in
│   ├── appointment/    # Specialized Booking Terminal
│   └── doctors/       # Specialist Profiles & Availability
├── components/        # Optimized UI Components (Navbar, Footer, Admin Layouts)
├── lib/               # Utility functions, Database connectivity & Slot Logic
└── middleware.ts      # Auth & API Protection Layer
```

## 🔐 Admin Access

Access the dashboard via `/admin`, signing in with an account created by `scripts/create_admin.mjs` (see above). Passwords are hashed (bcrypt); sessions are server-side records, not client-trusted cookies.

## 👨‍💻 Author

**PrimeCare Development Team**
_Architected for Clinical Excellence._

---

_Note: This is a professional-grade demonstration of a medical portal. All data is handled according to modern web security benchmarks and SEO best practices._
