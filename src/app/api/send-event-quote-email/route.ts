import { NextResponse } from 'next/server';
import { sendEventEmails, EventEmailAction } from '@/lib/send-event-emails';
import { isStaffOrAdmin } from '@/lib/server-auth';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

    if (!['created', 'approved', 'confirmed'].includes(action)) {
      return NextResponse.json(
        { error: 'Acción de correo no válida' },
        { status: 400 }
      );
    }

    if (!UUID_REGEX.test(quoteId)) {
      return NextResponse.json(
        { error: 'Formato de identificador de cotización inválido' },
        { status: 400 }
      );
    }

    // Blindaje de seguridad: las acciones operativas/administrativas requieren sesión autorizada (admin/staff)
    if (action === 'approved' || action === 'confirmed') {
      const authorized = await isStaffOrAdmin();
      if (!authorized) {
        return NextResponse.json(
          { error: 'No autorizado para despachar correos administrativos de cotizaciones' },
          { status: 401 }
        );
      }
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
