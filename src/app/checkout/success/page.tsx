import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const bookingId = resolvedSearchParams.bookingId as string;

  let guestName = 'Huésped';
  let isError = false;

  if (bookingId) {
    // Buscar la reserva para confirmar que existe y obtener el nombre
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('guest_name')
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      isError = true;
    } else {
      guestName = booking.guest_name;
    }
  } else {
    isError = true;
  }

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface px-4">
        <h1 className="text-3xl font-bold mb-4 text-red-600">Error en la reserva</h1>
        <p className="text-gray-600 mb-8 max-w-md text-center">
          No pudimos encontrar la información de esta reserva o el código es inválido.
        </p>
        <Link href="/">
          <Button variant="outline">Volver al Inicio</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center py-12 px-4">
      <div className="bg-white rounded-3xl premium-shadow p-8 md:p-12 max-w-2xl w-full text-center border border-gray-100 animate-in fade-in zoom-in-95 duration-500">
        
        <div className="w-24 h-24 bg-[#11d442]/10 rounded-full flex items-center justify-center mx-auto mb-8 border-[6px] border-[#11d442]/20">
          <svg className="w-12 h-12 text-[#11d442]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
          ¡Reserva Recibida, {guestName}!
        </h1>
        
        <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-lg mx-auto">
          Tu solicitud de reserva ha sido guardada exitosamente en Rancho Carmelitas. 
          En breve nos pondremos en contacto contigo para procesar el abono del 50%.
        </p>

        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 mb-8 inline-block text-left w-full max-w-md">
          <p className="text-sm text-gray-500 font-medium uppercase mb-1">Código de Referencia</p>
          <p className="font-mono text-gray-900 font-bold overflow-hidden text-ellipsis xs:text-sm">
            {bookingId}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" fullWidth>
              Volver al Inicio
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}
