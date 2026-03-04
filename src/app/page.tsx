import HomeClient from "./HomeClient";

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    name: "PrimeCare Clinic",
    url: "https://primecareclinic.vercel.app",
    telephone: "+923001234567",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Main Boulevard",
      addressLocality: "Lahore",
      addressRegion: "Punjab",
      postalCode: "54000",
      addressCountry: "PK",
    },
    openingHours: "Mo-Sa 09:00-20:00",
    description:
      "Modern healthcare clinic with smart online appointment booking and experienced specialists.",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient />
    </>
  );
}
