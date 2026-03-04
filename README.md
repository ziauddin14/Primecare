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
  - **Duplicate Prevention**: Prevents overlapping appointments for the same patient at the same time.
  - **Input Normalization**: Case-insensitive email and standardized phone matching.
  - **Specialist Pre-selection**: Seamlessly link from doctor profiles to the booking terminal.
- **🎨 Premium UI/UX**:
  - Professional aesthetic using **Tailwind CSS 4**.
  - Fluid animations powered by **Framer Motion**.
  - **AI Chat Support** for instant patient guidance and FAQs.
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

Create a `.env.local` file in the root directory and add your credentials:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
ADMIN_USER=admin
ADMIN_PASS=primecare123
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```text
src/
├── app/               # Next.js App Router
│   ├── api/           # Secured API Handlers (Auth, Appointments, Contact)
│   ├── admin/         # Private Management Console
│   ├── login/         # Secure Admin Sign-in
│   ├── appointment/    # Specialized Booking Terminal
│   └── doctors/       # Specialist Profiles
├── components/        # Optimized UI Components (Navbar, Footer, Client-side Wrappers)
├── lib/               # Utility functions & Database connectivity
└── middleware.ts      # Auth & API Protection Layer
```

## 🔐 Admin Access

Access the dashboard via `/admin`. Default credentials (if using values in `.env.local` above):

- **User**: `admin`
- **Pass**: `primecare123`

## 👨‍💻 Author

**PrimeCare Development Team**
_Architected for Clinical Excellence._

---

_Note: This is a professional-grade demonstration of a medical portal. All data is handled according to modern web security benchmarks and SEO best practices._
