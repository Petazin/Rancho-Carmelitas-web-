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
  let whatsappNumber = '56912345678'; // fallback

  // Fetch configuraciones globales
  const { data: settingsData } = await supabase
    .from('settings')
    .select('key, value')
    .eq('key', 'whatsapp_number')
    .single();

  if (settingsData && settingsData.value) {
    whatsappNumber = settingsData.value;
  }

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
          <a 
            href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola, acabo de realizar una reserva a nombre de ${guestName} con el código de referencia ${bookingId.slice(0,8)}. Quiero gestionar mi abono.`)}`}
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full sm:w-auto"
          >
            <Button size="lg" className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Contactar por WhatsApp
            </Button>
          </a>
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
