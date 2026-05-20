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
      bookingId 
    } = body;

    // Leer datos de la empresa desde Supabase settings
    const { data: settingsData } = await supabaseAdmin
      .from('settings')
      .select('key, value')
      .in('key', ['company_name', 'company_rut', 'company_address', 'company_phone', 'company_email']);

    const settings: Record<string, string> = {};
    if (settingsData) {
      settingsData.forEach((s: { key: string; value: string }) => {
        settings[s.key] = s.value;
      });
    }

    const emailElement = React.createElement(PaymentConfirmationTemplate, {
      guestName,
      cabinName,
      checkIn,
      checkOut,
      totalPrice,
      discountApplied: discountApplied || 0,
      extraGuestsCost: extraGuestsCost || 0,
      paymentAmount,
      paymentReference,
      paymentReceiptUrl: paymentReceiptUrl || undefined,
      adults,
      children,
      bookingId,
      companyName: settings.company_name || 'Rancho Carmelitas',
      companyRut: settings.company_rut || undefined,
      companyAddress: settings.company_address || undefined,
      companyPhone: settings.company_phone || undefined,
      companyEmail: settings.company_email || undefined,
    });

    // Enviar correo definitivo al Cliente
    const { data: customerData, error: customerError } = await resend.emails.send({
      from: 'Rancho Carmelitas <onboarding@resend.dev>',
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
