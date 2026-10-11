import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Consultar Mi Reserva • Rancho Carmelitas",
  description: "Revisa el estado de tu reserva en Rancho Carmelitas ingresando tu código de reserva o correo electrónico.",
  alternates: {
    canonical: "/reserva",
  },
  openGraph: {
    title: "Consultar Mi Reserva • Rancho Carmelitas",
    description: "Revisa el estado de tu estadía y reserva de cabañas en Rancho Carmelitas, Pullally, Papudo.",
    url: "https://ranchocarmelitas.com/reserva",
  },
};

export default function ReservaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
