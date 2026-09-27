import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mpPayment } from '@/lib/mercadopago';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
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

      const [bookingId, paymentType, expectedAmount] = payment.external_reference.split('__');

      if (!bookingId) continue;

      // Si se solicitó sincronizar una reserva específica y no coincide, saltar
      if (specificBookingId && bookingId !== specificBookingId) continue;

      const refStr = `MP-${payment.id}`;
      const amountToRegister = Number(payment.transaction_amount) || Number(expectedAmount) || 0;
      const paymentMethodName = payment.payment_method_id ? `Pago Online (${payment.payment_method_id.toUpperCase()})` : 'Pago Online';

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
      syncedPayments.push({ bookingId, paymentId: payment.id, amount: amountToRegister });

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
