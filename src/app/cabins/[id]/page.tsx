import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { BookingForm } from "@/components/ui/BookingForm";
import { CabinDetailTabs } from "@/components/ui/CabinDetailTabs";

export const dynamic = 'force-dynamic';

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
    amenities: cabinData.amenities || ["Wi-Fi de alta velocidad", "Terraza Privada"],
    slogan: cabinData.slogan,
    origin_title: cabinData.origin_title,
    origin_description: cabinData.origin_description,
    fun_fact: cabinData.fun_fact
  };

  const baseCapacity = cabin.capacity || 2;
  const maxExtra = cabin.max_extra_guests || 0;
  const pricePerNight = cabin.price_per_night || 0;
  const surchargePct = cabin.extra_guest_surcharge_percentage || 100;
  const pricePerPerson = pricePerNight / baseCapacity;
  const surchargePerExtraPerson = pricePerPerson * (surchargePct / 100);

  const formatMoney = (amount: number) => {
    const formatted = new Intl.NumberFormat('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
    return `$${formatted}`;
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
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-4 mb-8 pb-8 border-b border-gray-200">
                <div className="flex items-center gap-2 text-gray-700">
                  <svg className="w-6 h-6 text-[#11d442]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="text-lg font-medium">{cabin.capacity} Huéspedes base {maxExtra > 0 ? `(+${maxExtra} Adicionales)` : ''}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <svg className="w-6 h-6 text-[#11d442]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="text-lg font-medium">{cabin.bedrooms} Habitaciones</span>
                </div>
              </div>

              {/* Bloque de Capacidad y Tarifas Adicionales Transparentes */}
              <div className="mb-10 p-6 rounded-2xl bg-orange-50/60 border border-orange-100 shadow-sm animate-in fade-in">
                <h3 className="text-sm font-bold text-orange-950 uppercase tracking-wider mb-3 flex items-center gap-2">
                  📣 Políticas de Capacidad y Huéspedes Adicionales
                </h3>
                <div className="text-xs text-orange-850 space-y-2.5 leading-relaxed">
                  <p>
                    • Esta cabaña cuenta con una capacidad base de <strong className="text-orange-950 font-extrabold">{baseCapacity} huéspedes</strong> incluida en la tarifa por noche de <strong className="text-orange-950 font-extrabold">{formatMoney(pricePerNight)}</strong>.
                  </p>
                  {maxExtra > 0 ? (
                    <>
                      <p>
                        • Se permite alojar un máximo de <strong className="text-orange-950 font-extrabold">{maxExtra} personas adicionales</strong> pagando un recargo por persona por noche.
                      </p>
                      <div className="bg-white/70 p-3.5 rounded-xl border border-orange-250/50 font-bold text-xs text-orange-900 mt-2 flex items-center justify-between flex-wrap gap-2 shadow-inner">
                        <span className="text-[13px] tracking-wide text-orange-950">Recargo por Huésped Adicional:</span>
                        <strong className="text-orange-950 font-extrabold text-base bg-orange-100 px-3 py-1 rounded-lg border border-orange-250 shadow-sm">{formatMoney(surchargePerExtraPerson)} / noche</strong>
                      </div>
                    </>
                  ) : (
                    <p>
                      • No se admiten huéspedes adicionales sobre la capacidad base estipulada.
                    </p>
                  )}
                </div>
              </div>

              <div className="mb-10">
                <CabinDetailTabs cabin={cabin} />
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
