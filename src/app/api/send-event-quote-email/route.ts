import { NextResponse } from 'next/server';
import { sendEventEmails, EventEmailAction } from '@/lib/send-event-emails';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, quoteId } = body as { action: EventEmailAction; quoteId: string };

    if (!action || !quoteId) {
      return NextResponse.json(
        { error: 'Parámetros obligatorios faltantes (action, quoteId)' },
        { status: 400 }
      );
    }

    const origin = req.headers.get('origin') || undefined;
    const result = await sendEventEmails({ action, quoteId, origin });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, results: result.results }, { status: 200 });
  } catch (error: any) {
    console.error('Error en /api/send-event-quote-email:', error);
    return NextResponse.json(
      { error: error?.message || 'Error interno del servidor al procesar envío de correos' },
      { status: 500 }
    );
  }
}
