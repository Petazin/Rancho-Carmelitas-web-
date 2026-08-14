import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { VercelAnalytics } from "@/components/analytics/VercelAnalytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rancho Carmelitas • Exclusivas Cabañas en Pullally, Papudo",
  description: "Descubre nuestras exclusivas cabañas totalmente equipadas en el corazón de Pullally, Papudo. Tu refugio de descanso perfecto entre el bosque, la piscina y el mar.",
  keywords: ["cabañas papudo", "cabañas pullally", "arriendo cabañas papudo", "rancho carmelitas", "cabañas equipadas papudo", "turismo papudo", "turismo pullally"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <VercelAnalytics />
      </body>
    </html>
  );
}
