import { Resend } from 'resend';
import { ConfirmationEmailTemplate } from '@/components/emails/ConfirmationTemplate';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import React from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);

// Cliente Supabase server-side para leer configuraciones seguras
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  const hasKey = !!process.env.RESEND_API_KEY;
  return NextResponse.json({ 
    status: 'API Route Active', 
    hasKey, 
    service: 'Resend'
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY no configurada');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { guestName, guestEmail, cabinName, checkIn, checkOut, totalPrice, bookingId } = body;

    // Leer datos de la empresa y configuración de correo desde la base de datos (settings)
    const { data: settingsData } = await supabaseAdmin
      .from('settings')
      .select('key, value')
      .in('key', ['company_name', 'company_email', 'email_sender']);

    const settings: Record<string, string> = {};
    if (settingsData) {
      settingsData.forEach((s: { key: string; value: string }) => {
        settings[s.key] = s.value;
      });
    }

    const companyName = settings.company_name || 'Rancho Carmelitas';
    // Si no está configurado company_email, usar el buzón maestro de infraestructura
    const adminNotifyEmail = settings.company_email || 'rancho.carmelitas.6@gmail.com';
    // Remitente: usar el configurado (ej: reservas@ranchocarmelitas.com), de lo contrario fallback a onboarding de Resend
    const emailSender = settings.email_sender || 'Rancho Carmelitas <onboarding@resend.dev>';

    // 1. Enviar correo al Cliente
    const { data: customerData, error: customerError } = await resend.emails.send({
      from: emailSender,
      to: [guestEmail],
      subject: `Reserva Recibida: ${cabinName} - ${companyName}`,
      react: (
        <ConfirmationEmailTemplate
          guestName={guestName}
          cabinName={cabinName}
          checkIn={checkIn}
          checkOut={checkOut}
          totalPrice={totalPrice}
          bookingId={bookingId}
        />
      ),
    });

    if (customerError) {
      console.error('Error Resend Cliente:', customerError);
      return NextResponse.json({ error: customerError }, { status: 400 });
    }

    // 2. Enviar correo al Administrador (Notificación dinámica sin correo personal hardcoded)
    await resend.emails.send({
      from: emailSender,
      to: [adminNotifyEmail], 
      subject: `NUEVA RESERVA: ${guestName} - ${cabinName}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h1 style="color: #11d442;">Nueva Reserva Recibida</h1>
          <p><strong>Cabaña:</strong> ${cabinName}</p>
          <p><strong>Huésped:</strong> ${guestName}</p>
          <p><strong>Email:</strong> ${guestEmail}</p>
          <p><strong>Fechas:</strong> ${checkIn} al ${checkOut}</p>
          <p><strong>Total:</strong> $${totalPrice.toLocaleString()}</p>
          <p><strong>ID:</strong> ${bookingId}</p>
          <hr />
          <p>Revisa el panel administrativo para gestionar el abono.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, customerData });
  } catch (error: any) {
    console.error('Error crítico en send-confirmation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

