import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import React from 'react';
import {
  EventQuoteReceivedClientTemplate,
  EventQuoteAdminAlertTemplate,
  EventQuoteApprovedClientTemplate,
  EventQuoteConfirmedClientTemplate
} from '@/components/emails/EventQuoteTemplates';

const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type EventEmailAction = 'created' | 'approved' | 'confirmed';

interface SendEventEmailParams {
  action: EventEmailAction;
  quoteId: string;
  origin?: string;
}

export async function sendEventEmails({ action, quoteId, origin }: SendEventEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[sendEventEmails] RESEND_API_KEY no está configurada. Omitiendo despacho.');
    return { success: false, error: 'RESEND_API_KEY no configurada' };
  }

  if (!quoteId) {
    return { success: false, error: 'quoteId es requerido' };
  }

  // 1. Obtener la cotización completa desde Supabase
  const { data: quote, error: qError } = await supabaseAdmin
    .from('event_quotes')
    .select('*')
    .eq('id', quoteId)
    .maybeSingle();

  if (qError || !quote) {
    console.error('[sendEventEmails] No se encontró la cotización:', quoteId, qError);
    return { success: false, error: 'Cotización no encontrada' };
  }

  // 2. Obtener configuraciones de la empresa y bancarias
  const { data: settingsData } = await supabaseAdmin
    .from('settings')
    .select('key, value')
    .in('key', [
      'company_name',
      'company_email',
      'email_sender',
      'company_phone',
      'whatsapp_number',
      'bank_name',
      'bank_account_type',
      'bank_account_number',
      'bank_rut',
      'bank_account_holder',
      'bank_email'
    ]);

  const settings: Record<string, string> = {};
  if (settingsData) {
    settingsData.forEach(s => {
      settings[s.key] = s.value;
    });
  }

  const companyName = settings.company_name || 'Rancho Carmelitas';
  const companyPhone = settings.company_phone || settings.whatsapp_number || '+56 9 6727 4017';
  const adminNotifyEmail = settings.company_email || 'rancho.carmelitas.6@gmail.com';
  const emailSender = settings.email_sender || 'Rancho Carmelitas <onboarding@resend.dev>';

  // Base URL
  const baseUrl = origin || (process.env.NODE_ENV === 'production' ? 'https://ranchocarmelitas.cl' : 'http://localhost:3000');
  const paymentUrl = `${baseUrl}/recinto-completo/pago?id=${quote.id}`;
  const adminUrl = `${baseUrl}/admin/reservas?tab=eventos`;

  const payingGuests = (quote.adults_count || 0) + (quote.children_count || 0);
  const totalGuests = payingGuests + (quote.under_3_years_count || 0);

  const results: any[] = [];

  // =========================================================================
  // ACCIÓN 1: Nueva Cotización Creada (Acuse al cliente + Alerta al admin)
  // =========================================================================
  if (action === 'created') {
    // A) Enviar al Cliente
    if (quote.organizer_email) {
      try {
        const clientRes = await resend.emails.send({
          from: emailSender,
          to: [quote.organizer_email],
          subject: `Solicitud de Arriendo de Recinto Recibida - ${companyName}`,
          react: (
            <EventQuoteReceivedClientTemplate
              organizerName={quote.organizer_name}
              groupName={quote.group_name}
              groupType={quote.group_type}
              eventDate={quote.event_date}
              startTime={quote.start_time}
              endTime={quote.end_time}
              totalGuests={totalGuests}
              payingGuests={payingGuests}
              under3Years={quote.under_3_years_count || 0}
              hasBouncyCastle={quote.has_bouncy_castle}
              totalAmount={quote.total_amount}
              depositRequired={quote.deposit_required}
              quoteId={quote.id}
              companyName={companyName}
              companyPhone={companyPhone}
              companyEmail={adminNotifyEmail}
            />
          )
        });
        results.push({ target: 'client_created', res: clientRes });
      } catch (err: any) {
        console.error('[sendEventEmails] Error al enviar al cliente (created):', err);
      }
    }

    // B) Enviar a la Administración
    try {
      const adminRes = await resend.emails.send({
        from: emailSender,
        to: [adminNotifyEmail],
        subject: `NUEVA SOLICITUD RECINTO: ${quote.group_name || quote.organizer_name} (${quote.event_date})`,
        react: (
          <EventQuoteAdminAlertTemplate
            organizerName={quote.organizer_name}
            organizerEmail={quote.organizer_email}
            organizerPhone={quote.organizer_phone}
            organizerRut={quote.organizer_rut}
            groupName={quote.group_name}
            groupType={quote.group_type}
            eventDate={quote.event_date}
            startTime={quote.start_time}
            endTime={quote.end_time}
            totalGuests={totalGuests}
            payingGuests={payingGuests}
            under3Years={quote.under_3_years_count || 0}
            hasBouncyCastle={quote.has_bouncy_castle}
            extraNotes={quote.extra_notes}
            totalAmount={quote.total_amount}
            depositRequired={quote.deposit_required}
            quoteId={quote.id}
            adminUrl={adminUrl}
          />
        )
      });
      results.push({ target: 'admin_created', res: adminRes });
    } catch (err: any) {
      console.error('[sendEventEmails] Error al enviar al admin (created):', err);
    }
  }

  // =========================================================================
  // ACCIÓN 2: Cotización Aprobada (Enviar enlace de pago del 50% al cliente)
  // =========================================================================
  if (action === 'approved') {
    if (quote.organizer_email) {
      try {
        const clientRes = await resend.emails.send({
          from: emailSender,
          to: [quote.organizer_email],
          subject: `¡Cotización Aprobada! Paga tu abono para asegurar el Recinto - ${companyName}`,
          react: (
            <EventQuoteApprovedClientTemplate
              organizerName={quote.organizer_name}
              groupName={quote.group_name}
              eventDate={quote.event_date}
              startTime={quote.start_time}
              endTime={quote.end_time}
              totalGuests={totalGuests}
              totalAmount={quote.total_amount}
              depositRequired={quote.deposit_required}
              quoteId={quote.id}
              paymentUrl={paymentUrl}
              bankDetails={{
                bankName: settings.bank_name,
                accountType: settings.bank_account_type,
                accountNumber: settings.bank_account_number,
                rut: settings.bank_rut,
                holderName: settings.bank_account_holder,
                email: settings.bank_email || adminNotifyEmail
              }}
              companyName={companyName}
              companyPhone={companyPhone}
            />
          )
        });
        results.push({ target: 'client_approved', res: clientRes });
      } catch (err: any) {
        console.error('[sendEventEmails] Error al enviar al cliente (approved):', err);
      }
    }
  }

  // =========================================================================
  // ACCIÓN 3: Abono Acreditado y Confirmado (Recinto Bloqueado)
  // =========================================================================
  if (action === 'confirmed') {
    // A) Enviar al Cliente
    if (quote.organizer_email) {
      try {
        const clientRes = await resend.emails.send({
          from: emailSender,
          to: [quote.organizer_email],
          subject: `🎉 ¡Recinto Completo Confirmado y Reservado! - ${companyName}`,
          react: (
            <EventQuoteConfirmedClientTemplate
              organizerName={quote.organizer_name}
              groupName={quote.group_name}
              eventDate={quote.event_date}
              startTime={quote.start_time}
              endTime={quote.end_time}
              totalGuests={totalGuests}
              totalAmount={quote.total_amount}
              depositPaid={quote.deposit_paid || quote.deposit_required}
              paymentMethod={quote.payment_method || 'Abono 50%'}
              paymentReference={quote.payment_reference}
              quoteId={quote.id}
              companyName={companyName}
              companyPhone={companyPhone}
            />
          )
        });
        results.push({ target: 'client_confirmed', res: clientRes });
      } catch (err: any) {
        console.error('[sendEventEmails] Error al enviar al cliente (confirmed):', err);
      }
    }

    // B) Alerta a la Administración
    try {
      const adminRes = await resend.emails.send({
        from: emailSender,
        to: [adminNotifyEmail],
        subject: `RECINTO CONFIRMADO Y BLOQUEADO: ${quote.group_name || quote.organizer_name} (${quote.event_date})`,
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2 style="color: #065f46;">¡Recinto Completo Oficialmente Confirmado!</h2>
            <p>Se ha acreditado el abono para el evento de <strong>${quote.group_name || quote.organizer_name}</strong>.</p>
            <ul>
              <li><strong>Fecha:</strong> ${quote.event_date} (8 Horas)</li>
              <li><strong>Responsable:</strong> ${quote.organizer_name} (${quote.organizer_phone})</li>
              <li><strong>Abono Acreditado:</strong> $${(quote.deposit_paid || quote.deposit_required).toLocaleString()} (${quote.payment_method || 'Online/Transferencia'})</li>
              <li><strong>Saldo al Ingresar:</strong> $${Math.max(0, quote.total_amount - (quote.deposit_paid || quote.deposit_required)).toLocaleString()}</li>
            </ul>
            <p><a href="${adminUrl}&id=${quote.id}" style="color: #10b981; font-weight: bold;">Ver detalles en el PMS</a></p>
          </div>
        `
      });
      results.push({ target: 'admin_confirmed', res: adminRes });
    } catch (err: any) {
      console.error('[sendEventEmails] Error al enviar al admin (confirmed):', err);
    }
  }

  return { success: true, results };
}
