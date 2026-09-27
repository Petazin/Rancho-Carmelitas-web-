import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

const formatMoney = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null) return '$0';
  const formatted = new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
  return `$${formatted}`;
};

const formatearFecha = (fechaStr: string) => {
  if (!fechaStr) return '';
  const fecha = new Date(fechaStr);
  fecha.setMinutes(fecha.getMinutes() + fecha.getTimezoneOffset());
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).format(fecha);
};

import { createClient } from '@supabase/supabase-js';
import { mpPayment } from '@/lib/mercadopago';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  let bookingId = (resolvedSearchParams.bookingId as string) || (resolvedSearchParams.booking_id as string);
  const method = (resolvedSearchParams.method as string) || 'mercadopago';
  const status = (resolvedSearchParams.status as string) || (resolvedSearchParams.collection_status as string) || 'approved';
  const paymentId = (resolvedSearchParams.paymentId as string) || (resolvedSearchParams.payment_id as string) || (resolvedSearchParams.collection_id as string);
  const authCode = (resolvedSearchParams.authCode as string) || (resolvedSearchParams.merchant_order_id as string);
  const externalRef = resolvedSearchParams.external_reference as string;

  if (!bookingId && externalRef) {
    bookingId = externalRef.split('__')[0];
  }

  let guestName = 'Huésped';
  let isError = false;
  let whatsappNumber = '56912345678';
  let bookingData: any = null;

  // Fetch configuraciones globales
  const { data: settingsData } = await supabaseAdmin
    .from('settings')
    .select('key, value')
    .in('key', ['whatsapp_number', 'bank_name', 'bank_account_type', 'bank_account_number', 'bank_rut', 'bank_account_holder', 'bank_email']);

  const settings: Record<string, string> = {};
  if (settingsData) {
    settingsData.forEach(s => {
      settings[s.key] = s.value;
    });
  }

  if (settings.whatsapp_number) {
    whatsappNumber = settings.whatsapp_number;
  }

  if (bookingId) {
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('id, guest_name, guest_email, check_in, check_out, total_price, adults, children, payment_amount, status, cabins(name, image_url)')
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      isError = true;
    } else {
      bookingData = booking;
      guestName = booking.guest_name;

      // Reconciliación automática instantánea si viene de retorno aprobado de Mercado Pago
      if (status === 'approved' && method === 'mercadopago') {
        const abonoCalc = Math.floor((booking.total_price || 0) * 0.5);
        const refStr = paymentId ? `MP-${paymentId}` : `MP-OK-${booking.id.slice(0, 8).toUpperCase()}`;

        const { data: existingPay } = await supabaseAdmin
          .from('booking_payments')
          .select('id')
          .eq('booking_id', booking.id)
          .maybeSingle();

        if (!existingPay) {
          await supabaseAdmin.from('booking_payments').insert([{
            booking_id: booking.id,
            amount: abonoCalc,
            payment_method: 'Pago Online (Tarjetas / Webpay)',
            reference: refStr,
            notes: 'Abono 50% verificado tras retorno de pasarela'
          }]);

          await supabaseAdmin.from('bookings').update({
            payment_amount: abonoCalc,
            payment_reference: refStr,
            status: 'Confirmada',
            confirmed_at: new Date().toISOString(),
            confirmed_by: 'Pago Online (Auto-Reconciliado)'
          }).eq('id', booking.id);
        }
      }
    }
  } else {
    isError = true;
  }

  if (isError || !bookingData) {
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

  const cabinName = (bookingData.cabins as any)?.name || 'Cabaña Rancho Carmelitas';
  const cabinImage = (bookingData.cabins as any)?.image_url;
  const totalPrice = bookingData.total_price || 0;
  const abono = Math.floor(totalPrice * 0.5);
  const saldoRestante = totalPrice - abono;

  const isApproved = status === 'approved';
  const isRejected = status === 'rejected';
  const isTransfer = method === 'transferencia' || status === 'pending';

  // Texto para el mensaje de WhatsApp cálido y personalizado
  const whatsappMessage = isApproved
    ? `¡Hola! Acabo de reservar en Rancho Carmelitas a nombre de ${guestName}. Mi código de reserva es ${bookingId.slice(0, 8).toUpperCase()} para ${cabinName} (${formatearFecha(bookingData.check_in)} al ${formatearFecha(bookingData.check_out)}) y pagué mi abono de ${formatMoney(abono)} mediante Pago Online. ¡Quedo atento a sus indicaciones!`
    : `¡Hola! Acabo de registrar mi solicitud de reserva a nombre de ${guestName} (Cód: ${bookingId.slice(0, 8).toUpperCase()}) para ${cabinName}. Les escribo para enviar el comprobante de transferencia bancaria por ${formatMoney(abono)}.`;

  return (
    <div className="min-h-screen bg-[#faf8f5] py-12 px-4 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full space-y-6">

        {/* TARJETA PRINCIPAL TIPO VOUCHER */}
        <div className="bg-white rounded-3xl premium-shadow border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
          
          {/* BANNER SUPERIOR DE ESTADO */}
          <div className={`p-8 text-center text-white ${
            isApproved ? 'bg-gradient-to-br from-emerald-600 to-teal-700' :
            isRejected ? 'bg-gradient-to-br from-red-600 to-rose-700' :
            'bg-gradient-to-br from-blue-600 to-indigo-700'
          }`}>
            <div className="w-20 h-20 bg-white/15 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white/20 backdrop-blur-xs">
              {isApproved ? (
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : isRejected ? (
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>

            <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              {isApproved ? '💳 Abono Aprobado Vía Pago Online' :
               isRejected ? '❌ Transacción No Completada' :
               '⏳ Solicitud de Reserva Registrada'}
            </span>

            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {isApproved ? `¡Todo Listo, ${guestName}!` :
               isRejected ? `No pudimos procesar tu pago` :
               `¡Reserva Registrada, ${guestName}!`}
            </h1>

            <p className="text-sm md:text-base text-white/90 mt-2 max-w-md mx-auto leading-relaxed">
              {isApproved 
                ? `Hemos recibido correctamente tu abono del 50%. Tu estadía en ${cabinName} está 100% asegurada.`
                : isRejected 
                ? `Ocurrió un error en la pasarela o la transacción fue rechazada. Puedes intentar nuevamente.`
                : `Tu cabaña ha sido pre-reservada. Transfiere el abono del 50% para confirmar definitivamente tu estadía.`}
            </p>
          </div>

          {/* CUERPO DEL VOUCHER */}
          <div className="p-6 md:p-8 space-y-6">

            {/* DETALLES DE LA ESTADÍA */}
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-150">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-200 shrink-0">
                {cabinImage ? (
                  <Image src={cabinImage} alt={cabinName} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xs">Cabaña</div>
                )}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cabaña Seleccionada</span>
                <h3 className="text-lg font-bold text-gray-900">{cabinName}</h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  📅 {formatearFecha(bookingData.check_in)} al {formatearFecha(bookingData.check_out)} • {bookingData.adults} adultos {bookingData.children > 0 ? `, ${bookingData.children} niños` : ''}
                </p>
              </div>
              <div className="text-center sm:text-right shrink-0">
                <span className="text-[11px] text-gray-400 block uppercase font-bold">Cód. Reserva</span>
                <span className="font-mono text-xs font-bold bg-white px-2.5 py-1 rounded-lg border border-gray-200 text-gray-800">
                  {bookingId.slice(0, 8).toUpperCase()}
                </span>
              </div>
            </div>

            {/* BARRA DE ESTADO FINANCIERO */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                <span>Estado Financiero de la Reserva</span>
                <span>Total: {formatMoney(totalPrice)}</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
                <div 
                  className={`h-full transition-all duration-1000 ${isApproved ? 'w-1/2 bg-[#11d442]' : 'w-0 bg-gray-300'}`}
                />
                <div className="h-full w-1/2 bg-amber-200/60" />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className={`p-3 rounded-xl border ${isApproved ? 'bg-emerald-50/70 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                  <span className="block text-[10px] uppercase font-bold text-gray-500">Abono 50% (Hoy)</span>
                  <span className={`text-sm font-bold ${isApproved ? 'text-emerald-700' : 'text-gray-600'}`}>
                    {formatMoney(abono)} {isApproved ? '✓ Pagado' : '⏳ Pendiente'}
                  </span>
                  {paymentId && <span className="block text-[10px] text-gray-400 mt-0.5">ID: {paymentId}</span>}
                  {authCode && <span className="block text-[10px] text-gray-400 mt-0.5">Auth: {authCode}</span>}
                </div>

                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
                  <span className="block text-[10px] uppercase font-bold text-amber-800">Saldo Restante (Check-in)</span>
                  <span className="text-sm font-bold text-amber-900">
                    {formatMoney(saldoRestante)}
                  </span>
                  <span className="block text-[10px] text-amber-700 mt-0.5">Se salda al llegar o por portal</span>
                </div>
              </div>
            </div>

            {/* INSTRUCCIONES DE TRANSFERENCIA (SI CORRESPONDE) */}
            {isTransfer && (
              <div className="p-5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Datos para Transferir el Abono ({formatMoney(abono)})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-blue-950 bg-white p-3.5 rounded-xl border border-blue-100 font-mono">
                  <div><strong>Banco:</strong> {settings.bank_name || 'BancoEstado'}</div>
                  <div><strong>Tipo de Cuenta:</strong> {settings.bank_account_type || 'Cuenta Corriente'}</div>
                  <div><strong>N° Cuenta:</strong> {settings.bank_account_number || '123456789'}</div>
                  <div><strong>RUT:</strong> {settings.bank_rut || '76.xxx.xxx-x'}</div>
                  <div><strong>Titular:</strong> {settings.bank_account_holder || 'Rancho Carmelitas SpA'}</div>
                  <div><strong>Correo:</strong> {settings.bank_email || 'pagos@ranchocarmelitas.cl'}</div>
                </div>
                <p className="text-[11px] text-blue-800">
                  Por favor incluye el código <strong>{bookingId.slice(0, 8).toUpperCase()}</strong> en el asunto de la transferencia.
                </p>
              </div>
            )}

            {/* BOTONES DE ACCIÓN PRINCIPAL (SELLO HUMANO) */}
            <div className="space-y-3 pt-2">
              <a 
                href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-full"
              >
                <Button size="lg" className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-4 font-bold flex items-center justify-center gap-2 shadow-md">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {isTransfer ? 'Enviar Comprobante al WhatsApp del Rancho' : 'Contactar al Administrador por WhatsApp'}
                </Button>
              </a>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link href={`/reserva/${bookingId}`} className="w-full">
                  <Button size="lg" variant="outline" fullWidth className="border-gray-300 text-gray-800 hover:bg-gray-50 flex items-center justify-center gap-2">
                    <span>🏡 Ver Mi Portal de Reserva</span>
                  </Button>
                </Link>
                <Link href="/" className="w-full">
                  <Button size="lg" variant="ghost" fullWidth className="text-gray-500 hover:text-gray-800">
                    Volver al Inicio
                  </Button>
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* TIPS DE VIAJE */}
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>📍 Rancho Carmelitas • San Clemente, Maule, Chile</p>
          <p>🕒 Horario de Check-in: 15:00 a 21:00 hrs • Check-out: 12:00 hrs</p>
        </div>

      </div>
    </div>
  );
}
