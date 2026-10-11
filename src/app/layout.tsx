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

const baseUrl = "https://ranchocarmelitas.com";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Rancho Carmelitas • Exclusivas Cabañas en Pullally, Papudo",
    template: "%s | Rancho Carmelitas",
  },
  description:
    "Descubre nuestras exclusivas cabañas totalmente equipadas en el corazón de Pullally, Papudo. Tu refugio de descanso perfecto entre el bosque, la piscina y el mar.",
  keywords: [
    "cabañas papudo",
    "cabañas pullally",
    "arriendo cabañas papudo",
    "rancho carmelitas",
    "cabañas equipadas papudo",
    "turismo papudo",
    "turismo pullally",
    "alojamiento pullally",
    "cabañas con piscina papudo",
    "escapada cerca de santiago",
    "descanso familiar papudo",
  ],
  authors: [{ name: "Rancho Carmelitas" }],
  creator: "Rancho Carmelitas",
  publisher: "Rancho Carmelitas",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: baseUrl,
    siteName: "Rancho Carmelitas",
    title: "Rancho Carmelitas • Exclusivas Cabañas en Pullally, Papudo",
    description:
      "Descubre nuestras exclusivas cabañas totalmente equipadas en el corazón de Pullally, Papudo. Tu refugio de descanso perfecto entre el bosque, la piscina y el mar.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Rancho Carmelitas • Cabañas y piscina en Pullally, Papudo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rancho Carmelitas • Exclusivas Cabañas en Pullally, Papudo",
    description:
      "Descubre nuestras exclusivas cabañas totalmente equipadas en Pullally, Papudo. Piscina, descanso y naturaleza.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/logo.png", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png" },
    ],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "LodgingBusiness",
  "@id": `${baseUrl}/#lodging`,
  "name": "Rancho Carmelitas",
  "alternateName": "Cabañas Rancho Carmelitas Pullally",
  "url": baseUrl,
  "logo": `${baseUrl}/logo.png`,
  "image": `${baseUrl}/og-image.png`,
  "description":
    "Exclusivas cabañas totalmente equipadas en el corazón de Pullally, Papudo. Entorno campestre con piscina, bosque y descanso a sólo 2 horas de Santiago.",
  "telephone": "+56984012748",
  "email": "contacto@ranchocarmelitas.cl",
  "priceRange": "$$$",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Avenida Las Salinas № 104 D-4",
    "addressLocality": "Pullally",
    "addressRegion": "Región de Valparaíso",
    "addressCountry": "CL",
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": -32.4175,
    "longitude": -71.4089,
  },
  "hasMap": "https://maps.app.goo.gl/6W1fhgChaMWaQzbK8",
  "checkinTime": "15:00",
  "checkoutTime": "12:00",
  "petsAllowed": false,
  "smokingAllowed": false,
  "amenityFeature": [
    { "@type": "LocationFeatureSpecification", "name": "Piscina al aire libre", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Cocina totalmente equipada", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Estacionamiento privado gratuito", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Aire acondicionado", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Áreas verdes y entorno campestre", "value": true },
  ],
  "sameAs": [
    "https://www.instagram.com/ranchocarmelitas/",
    "https://www.facebook.com/rancho.c.pullally",
    "https://maps.app.goo.gl/6W1fhgChaMWaQzbK8",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <VercelAnalytics />
      </body>
    </html>
  );
}

