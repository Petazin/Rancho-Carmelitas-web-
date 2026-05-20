import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { CheckoutForm } from "@/components/ui/CheckoutForm";
import { supabase } from "@/lib/supabase";

export default async function CheckoutPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  
  // Buscar cabaña en Supabase
  const { data: cabinData, error } = await supabase
    .from('cabins')
    .select('id, name, price_per_night, image_url, capacity, max_extra_guests, extra_guest_surcharge_percentage')
    .eq('id', id)
    .single();

  if (error || !cabinData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface">
        <h1 className="text-3xl font-bold mb-4">Cabaña no encontrada</h1>
        <Link href="/">
          <Button variant="outline">Volver al Inicio</Button>
        </Link>
      </div>
    );
  }

  // Mapeamos los datos para empatar con la estructura del componente 
  const cabin = {
    id: cabinData.id,
    name: cabinData.name,
    price: cabinData.price_per_night,
    imageUrl: cabinData.image_url,
    capacity: cabinData.capacity,
    max_extra_guests: cabinData.max_extra_guests || 0,
    extra_guest_surcharge_percentage: cabinData.extra_guest_surcharge_percentage || 100
  };

  // Extraer valores de la URL con fallbacks por defecto
  const checkIn = resolvedSearchParams.checkIn as string || new Date().toISOString().split('T')[0];
  const checkOut = resolvedSearchParams.checkOut as string || new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const adults = parseInt(resolvedSearchParams.adults as string) || 1;
  const children = parseInt(resolvedSearchParams.children as string) || 0;

  // Cálculos de reserva
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  const nights = Math.max(1, Math.ceil((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24)));
  
  const totalGuests = adults + children;
  const extraGuests = Math.max(0, totalGuests - cabin.capacity);
  const pricePerPerson = cabin.price / cabin.capacity;
  const surchargePerExtraPerson = pricePerPerson * (cabin.extra_guest_surcharge_percentage / 100);
  const extraCostPerNight = extraGuests * surchargePerExtraPerson;
  const extraCostTotal = extraCostPerNight * nights;

  const totalBase = (nights * cabin.price) + extraCostTotal;

  const checkoutData = { checkIn, checkOut, adults, children, nights, totalBase, extraCostTotal, extraGuests };

  return (
    <div className="min-h-screen bg-surface py-12">
      {/* Header Minimalista (Logo solamente) */}
      <header className="fixed top-0 z-50 w-full glass-effect border-b border-gray-200/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={`/cabins/${id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium text-gray-900">Volver a la Cabaña</span>
          </Link>
          <span className="text-xl font-bold tracking-tight text-gray-900">
            Rancho<span className="text-[#11d442]">Carmelitas</span>
          </span>
          <div className="w-24" /> {/* Spacer */}
        </div>
      </header>

      <main className="container mx-auto px-4 mt-20 max-w-5xl">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Confirma tu reserva</h1>
        
        <CheckoutForm cabin={cabin} checkoutData={checkoutData} />
      </main>
    </div>
  );
}
