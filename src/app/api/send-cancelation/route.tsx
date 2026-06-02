import { Resend } from 'resend';
import { CancelationEmailTemplate } from '@/components/emails/CancelationTemplate';
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
      reasonType,
      bookingId
    } = body;

    if (!guestEmail) {
      return NextResponse.json({ error: 'Falta correo electrónico del huésped' }, { status: 400 });
    }

    // Leer datos de la empresa desde Supabase settings
    const { data: settingsData } = await supabaseAdmin
      .from('settings')
      .select('key, value')
      .in('key', ['company_name', 'email_sender']);

    let companyName = 'Rancho Carmelitas';
    if (settingsData && settingsData.length > 0) {
      const found = settingsData.find((s: { key: string; value: string }) => s.key === 'company_name');
      if (found) companyName = found.value;
    }

    const emailElement = React.createElement(CancelationEmailTemplate, {
      guestName,
      cabinName,
      checkIn,
      checkOut,
      reasonType,
      bookingId,
    });

    let subject = `Notificación de Cancelación de Reserva — ${companyName}`;
    if (reasonType === 'no_payment') {
      subject = `⏰ Plazo de Reserva Expirado: ${cabinName} — ${companyName}`;
    } else if (reasonType === 'conflict') {
      subject = `⚠️ Actualización Importante de tu Reserva: ${cabinName} — ${companyName}`;
    } else {
      subject = `Cancelación de Reserva: ${cabinName} — ${companyName}`;
    }

    const emailSender = settingsData?.find((s: { key: string; value: string }) => s.key === 'email_sender')?.value || 'Rancho Carmelitas <onboarding@resend.dev>';

    // Enviar correo de cancelación al Cliente
    const { data, error } = await resend.emails.send({
      from: emailSender,
      to: [guestEmail],
      subject,
      react: emailElement,
    });

    if (error) {
      console.error('Error Resend al enviar cancelación:', error);
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error crítico en send-cancelation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
