import { NextResponse } from 'next/server';
import { mpPreference } from '@/lib/mercadopago';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { quoteId, origin } = body;

    if (!quoteId) {
      return NextResponse.json({ error: 'Identificador de cotización requerido.' }, { status: 400 });
    }

    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      return NextResponse.json({ error: 'MERCADOPAGO_ACCESS_TOKEN no configurado en el servidor.' }, { status: 500 });
    }

    // 1. Obtener la cotización desde Supabase
    const { data: quote, error: quoteError } = await supabase
      .from('event_quotes')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Cotización no encontrada en el sistema.' }, { status: 404 });
    }

    if (quote.status !== 'Aprobada') {
      return NextResponse.json({ 
        error: `La cotización se encuentra en estado "${quote.status}". Solo se pueden abonar cotizaciones en estado "Aprobada".` 
      }, { status: 400 });
    }

    const depositAmount = Number(quote.deposit_required) || Math.round(Number(quote.total_amount) * 0.5);
    const baseUrl = origin || (process.env.NODE_ENV === 'production' ? 'https://ranchocarmelitas.cl' : 'http://localhost:3000');
    const isHttps = baseUrl.startsWith('https://');

    const successUrl = `${baseUrl}/recinto-completo/pago?id=${quoteId}&payment_status=approved`;
    const failureUrl = `${baseUrl}/recinto-completo/pago?id=${quoteId}&payment_status=rejected`;
    const pendingUrl = `${baseUrl}/recinto-completo/pago?id=${quoteId}&payment_status=pending`;

    // 2. Crear la preferencia oficial en Mercado Pago
    const preferenceResponse = await mpPreference.create({
      body: {
        items: [
          {
            id: String(quoteId),
            title: `Abono 50% - Recinto Completo (${quote.event_date})`,
            quantity: 1,
            unit_price: Math.round(depositAmount),
            currency_id: 'CLP',
            description: `Abono del 50% para uso exclusivo del recinto por 8 horas en Rancho Carmelitas (Grupo: ${quote.group_name || quote.organizer_name}).`
          }
        ],
        payer: {
          name: quote.organizer_name || 'Organizador',
          email: quote.organizer_email || 'contacto@ranchocarmelitas.cl'
        },
        back_urls: {
          success: successUrl,
          failure: failureUrl,
          pending: pendingUrl
        },
        ...(isHttps ? { auto_return: 'approved' } : {}),
        external_reference: `EVENT__${quoteId}__${Math.round(depositAmount)}`,
        statement_descriptor: 'RANCHO CARMELITAS',
        binary_mode: true
      }
    });

    const isSandboxMode = process.env.MERCADOPAGO_SANDBOX === 'true';
    const redirectUrl = isSandboxMode 
      ? (preferenceResponse.sandbox_init_point || preferenceResponse.init_point)
      : (preferenceResponse.init_point || preferenceResponse.sandbox_init_point);

    return NextResponse.json({
      success: true,
      preferenceId: preferenceResponse.id,
      initPoint: redirectUrl
    });
  } catch (err: any) {
    console.error('Error al crear preferencia para evento:', err);
    return NextResponse.json({
      error: err?.message || 'Error al conectar con Mercado Pago.'
    }, { status: 500 });
  }
}
