import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad y Protección de Datos • Rancho Carmelitas",
  description: "Conoce nuestra política de privacidad, resguardo y tratamiento de datos personales en Rancho Carmelitas bajo la Ley N° 19.628.",
  alternates: {
    canonical: "/privacidad",
  },
  openGraph: {
    title: "Política de Privacidad y Protección de Datos • Rancho Carmelitas",
    description: "Tratamiento transparente y seguro de los datos personales de nuestros huéspedes en Rancho Carmelitas.",
    url: "https://ranchocarmelitas.com/privacidad",
  },
};

export default function PrivacidadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
