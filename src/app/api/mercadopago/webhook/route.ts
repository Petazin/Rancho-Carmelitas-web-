import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mpPayment } from '@/lib/mercadopago';

// Supabase con Service Role para acceso seguro de backend
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));

    // Mercado Pago puede enviar el ID de pago en el body o en query parameters
    const topic = url.searchParams.get('topic') || url.searchParams.get('type') || body.type || body.topic;
    const paymentId = url.searchParams.get('data.id') || url.searchParams.get('id') || body.data?.id || body.id;

    if (!paymentId || (topic && topic !== 'payment')) {
      // Ignorar otros eventos como merchant_order que no sean de pago directo
      return NextResponse.json({ received: true }, { status: 200 });
    }

    console.log(`[MercadoPago Webhook] Procesando notificación de pago: ${paymentId}`);

    // Consultar el estado real del pago en la API oficial de Mercado Pago
    const payment = await mpPayment.get({ id: String(paymentId) });

    if (!payment) {
      console.warn(`[MercadoPago Webhook] No se encontró el pago ${paymentId}`);
      return NextResponse.json({ error: 'Pago no encontrado en Mercado Pago' }, { status: 404 });
    }

    const { status, external_reference, transaction_amount, date_approved, payment_method_id, payment_type_id } = payment;

    console.log(`[MercadoPago Webhook] Pago ${paymentId}: Estado = ${status}, Ref = ${external_reference}`);

    if (status === 'approved' && external_reference) {
      // Parsear la referencia externa: "bookingId__type__amount"
      const [bookingId, paymentType, expectedAmount] = external_reference.split('__');

      if (!bookingId) {
        console.error('[MercadoPago Webhook] external_reference no contiene bookingId válido:', external_reference);
        return NextResponse.json({ error: 'Referencia inválida' }, { status: 400 });
      }

      // 1. Verificar si este pago ya fue registrado para evitar duplicados (Idempotencia)
      const { data: existingPayment } = await supabaseAdmin
        .from('booking_payments')
        .select('id')
        .eq('reference', `MP-${paymentId}`)
        .maybeSingle();

      if (existingPayment) {
        console.log(`[MercadoPago Webhook] El pago MP-${paymentId} ya estaba registrado. Idempotencia asegurada.`);
        return NextResponse.json({ message: 'Pago ya procesado anteriormente' }, { status: 200 });
      }

      const amountToRegister = Number(transaction_amount) || Number(expectedAmount) || 0;
      const methodLabel = payment_method_id ? payment_method_id.toUpperCase() : 'WEB';
      const paymentMethodName = `Pago Online (${methodLabel})`;

      // 2. Registrar el pago en booking_payments
      const { error: insertPayError } = await supabaseAdmin
        .from('booking_payments')
        .insert([{
          booking_id: bookingId,
          amount: amountToRegister,
          payment_method: paymentMethodName,
          reference: `MP-${paymentId}`,
          notes: `Acreditado automáticamente vía Pago Online (${paymentType === 'saldo' ? 'Saldo Restante' : 'Abono Inicial'})`
        }]);

      if (insertPayError) {
        console.error('[MercadoPago Webhook] Error al insertar en booking_payments:', insertPayError);
      }

      // 3. Recalcular el total abonado en la reserva
      const { data: allPayments } = await supabaseAdmin
        .from('booking_payments')
        .select('amount')
        .eq('booking_id', bookingId);

      const totalAbonadoAcumulado = (allPayments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      // 4. Obtener la reserva actual para validar su estado
      const { data: currentBooking } = await supabaseAdmin
        .from('bookings')
        .select('id, status')
        .eq('id', bookingId)
        .maybeSingle();

      const updateBookingData: any = {
        payment_amount: totalAbonadoAcumulado,
        payment_reference: `MP-${paymentId}`
      };

      // Si la reserva fue cancelada manualmente por el administrador, no reactivar a 'Confirmada'
      if (currentBooking?.status?.toLowerCase() !== 'cancelada') {
        updateBookingData.status = 'Confirmada';
        updateBookingData.confirmed_at = date_approved || new Date().toISOString();
        updateBookingData.confirmed_by = 'Pago Online (Auto-Webhook)';
      }

      // Actualizar en la tabla bookings
      const { data: updatedBooking, error: updateBookingError } = await supabaseAdmin
        .from('bookings')
        .update(updateBookingData)
        .eq('id', bookingId)
        .select('*, cabins(name)')
        .single();

      if (updateBookingError) {
        console.error('[MercadoPago Webhook] Error actualizando reserva:', updateBookingError);
      } else {
        console.log(`[MercadoPago Webhook] Reserva ${bookingId} procesada con éxito. Total abonado: $${totalAbonadoAcumulado}`);
      }

      // 5. Despachar correo de confirmación de pago automático si la reserva sigue activa
      if (updatedBooking && updatedBooking.guest_email && currentBooking?.status?.toLowerCase() !== 'cancelada') {
        try {
          const originUrl = process.env.NODE_ENV === 'production' ? 'https://ranchocarmelitas.cl' : 'http://localhost:3005';
          await fetch(`${originUrl}/api/send-payment-confirmation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingId: updatedBooking.id,
              guestName: updatedBooking.guest_name,
              guestEmail: updatedBooking.guest_email,
              cabinName: updatedBooking.cabins?.name || 'Cabaña Rancho Carmelitas',
              checkIn: updatedBooking.check_in,
              checkOut: updatedBooking.check_out,
              totalPrice: updatedBooking.total_price,
              paymentAmount: amountToRegister,
              paymentMethod: paymentMethodName,
              paymentReference: `MP-${paymentId}`,
              totalAbonado: totalAbonadoAcumulado
            })
          });
          console.log(`[MercadoPago Webhook] Correo de confirmación enviado a ${updatedBooking.guest_email}`);
        } catch (mailErr) {
          console.warn('[MercadoPago Webhook] Advertencia enviando correo de confirmación:', mailErr);
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: any) {
    console.error('[MercadoPago Webhook] Error crítico:', error);
    return NextResponse.json({ error: 'Internal server error en webhook' }, { status: 500 });
  }
}
