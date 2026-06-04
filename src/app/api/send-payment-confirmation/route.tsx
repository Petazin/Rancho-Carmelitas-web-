import { Resend } from 'resend';
import { PaymentConfirmationTemplate } from '@/components/emails/PaymentConfirmationTemplate';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import React from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);

// Cliente Supabase server-side
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY no configurada');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { 
      guestName, 
      guestEmail, 
      cabinName, 
      checkIn, 
      checkOut, 
      totalPrice, 
      discountApplied,
      extraGuestsCost,
      paymentAmount,
      paymentReference,
      paymentReceiptUrl,
      adults,
      children,
      bookingId,
      plataformaNombre,
      plataformaComisionAplicada,
      requiresInvoice
    } = body;

    // Leer datos de la empresa desde Supabase settings
    const { data: settingsData } = await supabaseAdmin
      .from('settings')
      .select('key, value')
      .in('key', ['company_name', 'company_rut', 'company_address', 'company_phone', 'company_email', 'email_sender']);

    const settings: Record<string, string> = {};
    if (settingsData) {
      settingsData.forEach((s: { key: string; value: string }) => {
        settings[s.key] = s.value;
      });
    }

    // Consultar todos los abonos registrados para esta reserva en la base de datos
    // Esto asegura que el correo muestre los abonos acumulados correctos y no solo el pago individual
    let abonoAcumulado = 0;
    let ultimaReferencia = paymentReference || '';

    console.log(`[API SendPaymentConfirmation] Procesando bookingId: ${bookingId}, paymentAmount recibido: ${paymentAmount}, paymentReference recibido: ${paymentReference}`);

    if (bookingId) {
      const { data: paymentsData, error: paymentsError } = await supabaseAdmin
        .from('booking_payments')
        .select('amount, reference')
        .eq('booking_id', bookingId);
        
      if (paymentsError) {
        console.error('[API SendPaymentConfirmation] Error al consultar booking_payments:', paymentsError);
      } else {
        console.log(`[API SendPaymentConfirmation] Se encontraron ${paymentsData?.length || 0} abonos en booking_payments para bookingId ${bookingId}`);
        if (paymentsData && paymentsData.length > 0) {
          abonoAcumulado = paymentsData.reduce((sum: number, p: any) => sum + p.amount, 0);
          console.log(`[API SendPaymentConfirmation] Suma acumulada de abonos en base de datos: ${abonoAcumulado}`);
          // Obtener la última referencia de pago que no esté vacía
          const ultimoPagoConRef = [...paymentsData].reverse().find((p: any) => p.reference);
          if (ultimoPagoConRef) {
            ultimaReferencia = ultimoPagoConRef.reference;
            console.log(`[API SendPaymentConfirmation] Última referencia encontrada: ${ultimaReferencia}`);
          }
        }
      }
    } else {
      console.warn('[API SendPaymentConfirmation] Advertencia: bookingId es indefinido o nulo.');
    }

    const totalAbonado = abonoAcumulado > 0 ? abonoAcumulado : (paymentAmount || 0);
    const refFinal = ultimaReferencia || paymentReference || 'N/A';
    
    console.log(`[API SendPaymentConfirmation] Total Abonado Final a enviar al template: ${totalAbonado}, Referencia final: ${refFinal}`);

    const emailElement = React.createElement(PaymentConfirmationTemplate, {
      guestName,
      cabinName,
      checkIn,
      checkOut,
      totalPrice,
      discountApplied: discountApplied || 0,
      extraGuestsCost: extraGuestsCost || 0,
      paymentAmount: totalAbonado,
      paymentReference: refFinal,
      paymentReceiptUrl: paymentReceiptUrl || undefined,
      adults,
      children,
      bookingId,
      companyName: settings.company_name || 'Rancho Carmelitas',
      companyRut: settings.company_rut || undefined,
      companyAddress: settings.company_address || undefined,
      companyPhone: settings.company_phone || undefined,
      companyEmail: settings.company_email || undefined,
      plataformaNombre: plataformaNombre || null,
      plataformaComisionAplicada: plataformaComisionAplicada !== undefined ? Number(plataformaComisionAplicada) : 0,
      requiresInvoice: requiresInvoice || false,
    });

    const emailSender = settings.email_sender || 'Rancho Carmelitas <onboarding@resend.dev>';

    // Enviar correo definitivo al Cliente
    const { data: customerData, error: customerError } = await resend.emails.send({
      from: emailSender,
      to: [guestEmail],
      subject: `✓ Reserva Confirmada: ${cabinName} — ${settings.company_name || 'Rancho Carmelitas'}`,
      react: emailElement,
    });

    if (customerError) {
      console.error('Error Resend Confirmación Pago:', customerError);
      return NextResponse.json({ error: customerError }, { status: 400 });
    }

    return NextResponse.json({ success: true, customerData });
  } catch (error: any) {
    console.error('Error crítico en send-payment-confirmation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
