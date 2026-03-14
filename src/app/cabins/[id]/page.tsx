import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { BookingForm } from "@/components/ui/BookingForm";

export default async function CabinDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Buscar cabaña en Supabase
  const { data: cabinData, error } = await supabase
    .from('cabins')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !cabinData) {
    console.error("Error al cargar cabaña desde Supabase:", error);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4">Cabaña no encontrada</h1>
        <Link href="/">
          <Button variant="outline">Volver al Inicio</Button>
        </Link>
      </div>
    );
  }

  // Mapeamos los datos de base de datos para empatar con la estructura que el componente espera
  const cabin = {
    ...cabinData,
    galleryUrls: cabinData.gallery_urls?.length ? cabinData.gallery_urls : ['/cabins/default.jpg'],
    price: cabinData.price_per_night,
    bedrooms: Math.ceil(cabinData.capacity / 2),
    amenities: cabinData.amenities || ["Wi-Fi de alta velocidad", "Terraza Privada"] 
  };

  if (!cabin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4">Cabaña no encontrada</h1>
        <Link href="/">
          <Button variant="outline">Volver al Inicio</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* Header Minimalista */}
      <header className="fixed top-0 z-50 w-full glass-effect border-b border-gray-200/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium text-gray-900">Volver</span>
          </Link>
          <div className="font-semibold text-gray-900">{cabin.name}</div>
          <div className="w-16" /> {/* Spacer */}
        </div>
      </header>

      <main className="flex-1 pb-24">
        {/* Hero Image */}
        <div className="relative h-[50vh] min-h-[400px] max-h-[600px] w-full mt-16">
          <Image
            src={cabin.galleryUrls[0]}
            alt={cabin.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 w-full p-8 container mx-auto">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 inline-block px-4 py-1.5 rounded-full text-white text-sm font-medium mb-4">
              ✨ Cabaña Premium
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{cabin.name}</h1>
          </div>
        </div>

        <div className="container mx-auto px-4 mt-12">
          <div className="flex flex-col lg:flex-row gap-12">
            
            {/* Detalles Principales */}
            <div className="flex-1">
              <div className="flex flex-wrap gap-4 mb-8 pb-8 border-b border-gray-200">
                <div className="flex items-center gap-2 text-gray-700">
                  <svg className="w-6 h-6 text-[#11d442]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="text-lg font-medium">{cabin.capacity} Huéspedes max.</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <svg className="w-6 h-6 text-[#11d442]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="text-lg font-medium">{cabin.bedrooms} Habitaciones</span>
                </div>
              </div>

              <div className="mb-10">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Sobre esta cabaña</h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {cabin.description || 'Una hermosa cabaña lista para tu descanso.'}
                </p>
              </div>

              {/* Galería Secundaria (Scroller horizontal) */}
              {cabin.galleryUrls.length > 1 && (
                <div className="mb-10">
                  <h2 className="text-2xl font-bold mb-4 text-gray-900">Galería de Fotos</h2>
                  <div className="flex gap-4 overflow-x-auto pb-4 snap-x custom-scrollbar">
                    {cabin.galleryUrls.slice(1).map((url: string, index: number) => (
                      <div key={index} className="relative w-64 md:w-80 h-48 md:h-56 flex-shrink-0 snap-center rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                        <Image src={url} alt={`Vista ${index+2} de ${cabin.name}`} fill className="object-cover hover:scale-105 transition-transform duration-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Lo que ofrece este lugar</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cabin.amenities.map((item: string, index: number) => (
                    <li key={index} className="flex items-center gap-3 text-gray-700">
                      <svg className="w-5 h-5 text-[#11d442]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Sticky Reserva Card */}
            <div className="w-full lg:w-[400px]">
              <BookingForm cabin={cabin} cabinId={id} />
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
