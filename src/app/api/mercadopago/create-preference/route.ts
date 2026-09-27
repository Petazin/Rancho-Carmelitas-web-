import { NextResponse } from 'next/server';
import { mpPreference } from '@/lib/mercadopago';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      bookingId, 
      title, 
      amount, 
      guestName, 
      guestEmail, 
      type = 'abono', 
      origin 
    } = body;

    if (!bookingId || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Datos de reserva o monto inválidos.' }, { status: 400 });
    }

    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      return NextResponse.json({ error: 'MERCADOPAGO_ACCESS_TOKEN no configurado en el servidor.' }, { status: 500 });
    }

    // Determinar la URL base dinámica para los retornos
    const baseUrl = origin || (process.env.NODE_ENV === 'production' ? 'https://ranchocarmelitas.cl' : 'http://localhost:3005');

    // Construir URLs de retorno según sea abono o saldo
    const successUrl = type === 'saldo'
      ? `${baseUrl}/reserva/${bookingId}?payment_status=approved&method=mercadopago`
      : `${baseUrl}/checkout/success?booking_id=${bookingId}&status=approved&method=mercadopago`;

    const failureUrl = type === 'saldo'
      ? `${baseUrl}/reserva/${bookingId}?payment_status=rejected&method=mercadopago`
      : `${baseUrl}/checkout/success?booking_id=${bookingId}&status=rejected&method=mercadopago`;

    const pendingUrl = type === 'saldo'
      ? `${baseUrl}/reserva/${bookingId}?payment_status=pending&method=mercadopago`
      : `${baseUrl}/checkout/success?booking_id=${bookingId}&status=pending&method=mercadopago`;

    // Webhook notification URL (debe ser una URL pública accesible por Mercado Pago)
    const notificationUrl = process.env.NODE_ENV === 'production'
      ? 'https://ranchocarmelitas.cl/api/mercadopago/webhook'
      : undefined;

    const isHttps = baseUrl.startsWith('https://');

    // Crear la preferencia en Mercado Pago
    const preferenceResponse = await mpPreference.create({
      body: {
        items: [
          {
            id: String(bookingId),
            title: title || `Reserva en Rancho Carmelitas (Cód: ${String(bookingId).slice(0, 8).toUpperCase()})`,
            quantity: 1,
            unit_price: Math.round(Number(amount)),
            currency_id: 'CLP',
            description: `Pago de ${type === 'saldo' ? 'Saldo Restante' : 'Abono 50%'} para estadía en Rancho Carmelitas.`
          }
        ],
        payer: {
          name: guestName || 'Huésped',
          email: guestEmail || 'cliente@ranchocarmelitas.cl'
        },
        back_urls: {
          success: successUrl,
          failure: failureUrl,
          pending: pendingUrl
        },
        ...(isHttps ? { auto_return: 'approved' } : {}),
        external_reference: `${bookingId}__${type}__${Math.round(Number(amount))}`,
        notification_url: notificationUrl,
        statement_descriptor: 'RANCHO CARMELITAS',
        binary_mode: true // Solo estados definitivos (Aprobado o Rechazado)
      }
    });

    const isSandboxMode = process.env.MERCADOPAGO_SANDBOX === 'true';
    const redirectUrl = isSandboxMode 
      ? (preferenceResponse.sandbox_init_point || preferenceResponse.init_point)
      : (preferenceResponse.init_point || preferenceResponse.sandbox_init_point);

    return NextResponse.json({
      success: true,
      preferenceId: preferenceResponse.id,
      initPoint: redirectUrl,
      sandboxInitPoint: preferenceResponse.sandbox_init_point
    });

  } catch (error: any) {
    console.error('Error creando preferencia de Mercado Pago:', error);
    return NextResponse.json({ 
      error: error?.message || 'Error al conectar con Mercado Pago.' 
    }, { status: 500 });
  }
}
