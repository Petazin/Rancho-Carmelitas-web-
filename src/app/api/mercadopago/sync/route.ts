import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mpPayment } from '@/lib/mercadopago';
import { isStaffOrAdmin } from '@/lib/server-auth';
import { sendEventEmails } from '@/lib/send-event-emails';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    // Blindaje de seguridad: Solo administradores o personal autorizado pueden sincronizar pagos
    const authorized = await isStaffOrAdmin();
    if (!authorized) {
      return NextResponse.json({ error: 'No autorizado para ejecutar sincronización de pagos' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { bookingId: specificBookingId } = body;

    // 1. Consultar a Mercado Pago los pagos recientes
    const searchRes = await mpPayment.search({
      options: {
        sort: 'date_created',
        criteria: 'desc',
        limit: 30
      }
    });

    const results = searchRes.results || [];
    let syncedCount = 0;
    const syncedPayments: any[] = [];

    for (const payment of results) {
      if (payment.status !== 'approved' || !payment.external_reference) continue;

      const refStr = `MP-${payment.id}`;
      const paymentMethodName = payment.payment_method_id ? `Pago Online (${payment.payment_method_id.toUpperCase()})` : 'Pago Online';

      // CASO ESPECIAL: Pago de Arriendo de Recinto Completo ("EVENT__quoteId__amount")
      if (payment.external_reference.startsWith('EVENT__')) {
        const [, quoteId, expectedAmount] = payment.external_reference.split('__');
        if (!quoteId) continue;
        if (specificBookingId && quoteId !== specificBookingId) continue;

        // Idempotencia: verificar si ya existe este pago en event_payments
        const { data: existingEventPay } = await supabaseAdmin
          .from('event_payments')
          .select('id')
          .eq('reference', refStr)
          .maybeSingle();

        if (existingEventPay) continue;

        // Verificar la cotización actual
        const { data: currentQuote } = await supabaseAdmin
          .from('event_quotes')
          .select('id, status, deposit_paid')
          .eq('id', quoteId)
          .maybeSingle();

        if (currentQuote) {
          const amountToRegister = Number(payment.transaction_amount) || Number(expectedAmount) || 0;

          // Insertar en event_payments (el trigger sincronizará deposit_paid en event_quotes)
          await supabaseAdmin
            .from('event_payments')
            .insert([{
              event_quote_id: quoteId,
              amount: amountToRegister,
              payment_method: paymentMethodName,
              reference: refStr,
              notes: 'Sincronizado automáticamente vía Mercado Pago',
              recorded_by: 'Sistema (Mercado Pago)'
            }]);

          if (currentQuote.status !== 'Confirmada') {
            const { error: eventErr } = await supabaseAdmin
              .from('event_quotes')
              .update({
                status: 'Confirmada',
                payment_method: paymentMethodName,
                payment_reference: refStr
              })
              .eq('id', quoteId);

            if (!eventErr) {
              syncedCount++;
              syncedPayments.push({ quoteId, paymentId: payment.id, amount: amountToRegister, type: 'event' });
              sendEventEmails({ action: 'confirmed', quoteId }).catch(e => console.warn('[MercadoPago Sync] Error despachando correo de evento:', e));
            }
          }
        }
        continue;
      }

      // CASO ESTÁNDAR: Reserva de Cabaña ("bookingId__paymentType__expectedAmount")
      const [bookingId, paymentType, expectedAmount] = payment.external_reference.split('__');

      if (!bookingId) continue;

      // Si se solicitó sincronizar una reserva específica y no coincide, saltar
      if (specificBookingId && bookingId !== specificBookingId) continue;

      const amountToRegister = Number(payment.transaction_amount) || Number(expectedAmount) || 0;

      // 2. Verificar si este pago ya fue registrado en booking_payments (Idempotencia)
      const { data: existingPay } = await supabaseAdmin
        .from('booking_payments')
        .select('id')
        .eq('reference', refStr)
        .maybeSingle();

      // Si el pago ya fue registrado y procesado anteriormente, saltar para no generar updates innecesarios ni ensuciar la bitácora
      if (existingPay) {
        continue;
      }

      // Obtener la reserva correspondiente para verificar su estado actual
      const { data: currentBooking } = await supabaseAdmin
        .from('bookings')
        .select('id, status, guest_name, guest_email, check_in, check_out, total_price, cabins(name)')
        .eq('id', bookingId)
        .maybeSingle();

      if (!currentBooking) continue;

      // 3. Insertar el nuevo pago en booking_payments
      const { error: insertErr } = await supabaseAdmin
        .from('booking_payments')
        .insert([{
          booking_id: bookingId,
          amount: amountToRegister,
          payment_method: paymentMethodName,
          reference: refStr,
          notes: `Acreditado automáticamente vía Pago Online (${paymentType === 'saldo' ? 'Saldo Restante' : 'Abono 50%'})`
        }]);

      if (insertErr) {
        console.error('[MercadoPago Sync] Error insertando abono:', insertErr);
        continue;
      }

      syncedCount++;
      syncedPayments.push({ bookingId, paymentId: payment.id, amount: amountToRegister, type: 'cabin' });

      // 4. Recalcular el total abonado acumulado
      const { data: allPayments } = await supabaseAdmin
        .from('booking_payments')
        .select('amount')
        .eq('booking_id', bookingId);

      const totalAbonado = (allPayments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      // Preparar los datos a actualizar en la reserva
      const updateData: any = {
        payment_amount: totalAbonado,
        payment_reference: refStr
      };

      // RESPETO ESTRICTO A CANCELACIONES:
      // Si la reserva fue cancelada manualmente por el administrador, JAMÁS revertir a 'Confirmada'
      if (currentBooking.status?.toLowerCase() !== 'cancelada') {
        updateData.status = 'Confirmada';
        updateData.confirmed_at = payment.date_approved || new Date().toISOString();
        updateData.confirmed_by = 'Pago Online (Auto-Sync)';
      }

      const { data: updatedBooking } = await supabaseAdmin
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)
        .select('*, cabins(name)')
        .single();

      // 5. Enviar correo de confirmación de pago al huésped si recién se acreditó y la reserva sigue vigente
      if (updatedBooking && updatedBooking.guest_email && currentBooking.status?.toLowerCase() !== 'cancelada') {
        try {
          const originUrl = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'production' ? 'https://ranchocarmelitas.com' : 'http://localhost:3000');
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
              paymentReference: refStr,
              totalAbonado: totalAbonado
            })
          });
        } catch (mErr) {
          console.warn('[MercadoPago Sync] Advertencia enviando correo:', mErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      syncedCount,
      syncedPayments
    });

  } catch (error: any) {
    console.error('[MercadoPago Sync] Error:', error);
    return NextResponse.json({ error: error.message || 'Error en sincronización' }, { status: 500 });
  }
}
