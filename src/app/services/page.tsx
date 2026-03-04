import ServicesClient from "./ServicesClient";

export const metadata = {
  title: "Services",
  description:
    "Explore PrimeCare medical services including General Medicine, Dental Care, Pediatrics and Cardiology.",
};

export default function ServicesPage() {
  return <ServicesClient />;
}
