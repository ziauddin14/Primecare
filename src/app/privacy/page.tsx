import Container from "@/components/Container";

export default function PrivacyPage() {
  return (
    <main className="bg-white min-h-screen py-20">
      <Container>
        <div className="max-w-3xl mx-auto space-y-10">
          <h1 className="text-4xl font-bold text-slate-900 border-b pb-6">
            Privacy Policy
          </h1>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-800">
              1. Data Collection
            </h2>
            <p className="text-slate-600 leading-relaxed">
              We collect information you provide directly to us through our
              appointment booking and contact forms. This typically includes
              your name, email address, phone number, and preferred clinical
              specialty.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-800">
              2. Appointment Data Usage
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Your information is used solely to coordinate and confirm your
              medical consultations. We leverage this data to synchronize our
              specialist schedules and provide you with timely sessions.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-800">
              3. User Privacy Protection
            </h2>
            <p className="text-slate-600 leading-relaxed">
              We implement industry-standard security measures, including data
              encryption and restricted admin access, to protect your personal
              information from unauthorized disclosure or alteration.
            </p>
          </section>

          <section className="space-y-4 p-8 bg-blue-50 rounded-3xl border border-blue-100 italic">
            <h2 className="text-xl font-bold text-blue-900 not-italic uppercase tracking-widest mb-2">
              Demo Disclaimer
            </h2>
            <p className="text-blue-800">
              This is a **demo healthcare website** built for showcase purposes.
              No real medical consultations or services are provided through
              this platform. Data entered here is handled with care for the demo
              experience but should not be considered for actual medical
              records.
            </p>
          </section>
        </div>
      </Container>
    </main>
  );
}
