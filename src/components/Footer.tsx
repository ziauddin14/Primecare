import Container from "./Container";

export default function Footer() {
  return (
    <footer className="border-t bg-white">
      <Container>
        <div className="py-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-600">
          <p className="font-medium text-slate-500">
            © {new Date().getFullYear()} PrimeCare Clinic.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 font-semibold text-slate-700">
            <span>9AM–8PM (Mon-Sat)</span>
            <span>0300-XXXXXXX</span>
            <span>Main Boulevard, Lahore</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
