import { Resend } from 'resend';
import { ConfirmationEmailTemplate } from '@/components/emails/ConfirmationTemplate';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // 1. Enviar correo al Cliente
    const { data: customerData, error: customerError } = await resend.emails.send({
      from: 'Rancho Carmelitas <onboarding@resend.dev>',
      to: [guestEmail],
      subject: `Reserva Recibida: ${cabinName} - Rancho Carmelitas`,
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

    // 2. Enviar correo al Administrador (Notificación)
    await resend.emails.send({
      from: 'Rancho Carmelitas <onboarding@resend.dev>',
      to: ['claudio.milanolo@gmail.com'], 
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
