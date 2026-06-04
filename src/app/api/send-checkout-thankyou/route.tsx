import { Resend } from 'resend';
import { CheckoutThankYouTemplate } from '@/components/emails/CheckoutThankYouTemplate';
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
      bookingId 
    } = body;

    if (!guestEmail) {
      return NextResponse.json({ error: 'Falta el correo del huésped' }, { status: 400 });
    }

    // Leer datos de la empresa desde Supabase settings
    const { data: settingsData } = await supabaseAdmin
      .from('settings')
      .select('key, value')
      .in('key', ['company_name', 'company_address', 'company_phone', 'company_email', 'email_sender']);

    const settings: Record<string, string> = {};
    if (settingsData) {
      settingsData.forEach((s: { key: string; value: string }) => {
        settings[s.key] = s.value;
      });
    }

    const emailElement = React.createElement(CheckoutThankYouTemplate, {
      guestName,
      cabinName,
      checkIn,
      checkOut,
      bookingId,
      companyName: settings.company_name || 'Rancho Carmelitas',
      companyAddress: settings.company_address || undefined,
      companyPhone: settings.company_phone || undefined,
      companyEmail: settings.company_email || undefined,
    });

    const emailSender = settings.email_sender || 'Rancho Carmelitas <onboarding@resend.dev>';

    // Enviar correo de despedida y agradecimiento al Cliente
    const { data: customerData, error: customerError } = await resend.emails.send({
      from: emailSender,
      to: [guestEmail],
      subject: `¡Muchas gracias por tu visita, ${guestName}! 🌿 — ${settings.company_name || 'Rancho Carmelitas'}`,
      react: emailElement,
    });

    if (customerError) {
      console.error('Error Resend Agradecimiento Checkout:', customerError);
      return NextResponse.json({ error: customerError }, { status: 400 });
    }

    console.log(`[API SendCheckoutThankYou] Correo enviado con éxito a ${guestEmail} para la reserva ${bookingId}`);

    return NextResponse.json({ success: true, customerData });
  } catch (error: any) {
    console.error('Error crítico en send-checkout-thankyou:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
