import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reglamento Oficial y Normas de Convivencia • Rancho Carmelitas",
  description: "Conoce las 14 normas generales de estadía y el reglamento oficial de uso de piscina en Rancho Carmelitas, Pullally, Papudo.",
  alternates: {
    canonical: "/reglamento",
  },
  openGraph: {
    title: "Reglamento Oficial y Normas de Convivencia • Rancho Carmelitas",
    description: "Normas de convivencia, horarios de check-in/out y uso responsable de instalaciones en Rancho Carmelitas.",
    url: "https://ranchocarmelitas.com/reglamento",
  },
};

export default function ReglamentoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
