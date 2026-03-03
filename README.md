# PrimeCare 🏥 | Premium Clinical Management & Patient Portal

PrimeCare is a modern, high-performance web application designed for elite private hospitals and clinics. Built with a focus on **Premium UI/UX**, **Dynamic Animations**, and **Smart Automation**, it provides a seamless bridge between patients and medical specialists.

## ✨ Key Features

- **🚀 Performance First**: Built with Next.js 16 and React 19 for lightning-fast server-side rendering and static generation.
- **🎨 Premium UI**: A highly refined, professional aesthetic using Tailwind CSS 4 with custom typography and a curated clinical color palette.
- **🎬 Fluid Animations**: Immersive user experience powered by **Framer Motion**, featuring staggered entrances, spring physics, and hover interactions.
- **✍️ Interactive Elements**: Dynamic typewriter effects for brand messaging and real-time form validation.
- **🤖 Smart AI Assistant**: Integrated rule-based chatbot to handle patient inquiries about services, timings, and appointments.
- **📅 Automated Booking Terminal**: A streamlined appointment intake system allowing patients to synchronize their consultation requests directly with clinical departments.
- **🛡️ Secure Data Layer**: Robust backend integration with MongoDB Atlas using cached serverless-safe connections.
- **📱 Zero-Compromise Responsiveness**: Meticulously crafted for all viewports—from mobile-first designs to 4K desktop layouts.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Database**: [MongoDB](https://www.mongodb.com/) (Native Driver)
- **Icons**: [React Icons](https://react-icons.github.io/react-icons/)
- **Interactive**: [Typewriter Effect](https://www.npmjs.com/package/typewriter-effect)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/primecare.git
cd primecare
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory and add your MongoDB connection string:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```text
src/
├── app/               # Next.js App Router (Pages & API Routes)
│   ├── api/           # Backend API Handlers
│   ├── appointment/   # Booking Portal
│   ├── services/      # Clinical Services Page
│   └── admin/         # Private Admin Dashboard
├── components/        # Reusable UI Components (Navbar, Footer, Chat)
├── lib/               # Utility functions & DB connection helper
└── globals.css        # Global styles & Tailwind entry
```

## 🔐 Deployment

The project is optimized for **Vercel**. When deploying, ensure the `MONGODB_URI` environment variable is added to your project settings.

## 👨‍💻 Author

**PrimeCare Development Team**
_Architected for Clinical Excellence._

---

_Note: This is a professional-grade demonstration of a medical portal. All data is handled according to modern web security benchmarks._
