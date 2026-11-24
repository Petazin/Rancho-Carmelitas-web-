import * as React from 'react';

// Formato de moneda chilena
const formatMoney = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null) return '$0';
  const formatted = new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
  return `$${formatted}`;
};

// Formato de fecha legible
const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

// Estilos globales de correo responsivo y compatible
const styles = {
  wrapper: {
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    padding: '24px 0',
    width: '100%'
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    maxWidth: '600px',
    margin: '0 auto',
    overflow: 'hidden' as const,
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
  },
  header: {
    backgroundColor: '#0f172a',
    padding: '32px 24px',
    textAlign: 'center' as const
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: '22px',
    fontWeight: '800',
    margin: '0 0 6px 0',
    letterSpacing: '-0.5px'
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: '13px',
    margin: 0
  },
  badgeSuccess: {
    display: 'inline-block',
    backgroundColor: '#10b981',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: '700',
    padding: '4px 12px',
    borderRadius: '9999px',
    textTransform: 'uppercase' as const,
    marginBottom: '10px'
  },
  badgePending: {
    display: 'inline-block',
    backgroundColor: '#f59e0b',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: '700',
    padding: '4px 12px',
    borderRadius: '9999px',
    textTransform: 'uppercase' as const,
    marginBottom: '10px'
  },
  badgeApproved: {
    display: 'inline-block',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: '700',
    padding: '4px 12px',
    borderRadius: '9999px',
    textTransform: 'uppercase' as const,
    marginBottom: '10px'
  },
  body: {
    padding: '32px 24px'
  },
  greeting: {
    fontSize: '16px',
    color: '#1e293b',
    fontWeight: '600',
    margin: '0 0 12px 0'
  },
  paragraph: {
    fontSize: '14px',
    color: '#475569',
    lineHeight: '1.6',
    margin: '0 0 18px 0'
  },
  card: {
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '20px',
    margin: '20px 0'
  },
  cardTitle: {
    fontSize: '13px',
    fontWeight: '700',
    textTransform: 'uppercase' as const,
    color: '#64748b',
    margin: '0 0 14px 0',
    letterSpacing: '0.5px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const
  },
  tableLabel: {
    fontSize: '13px',
    color: '#64748b',
    padding: '6px 0',
    width: '45%'
  },
  tableValue: {
    fontSize: '13px',
    color: '#0f172a',
    fontWeight: '600',
    padding: '6px 0',
    textAlign: 'right' as const
  },
  highlightBox: {
    backgroundColor: '#f0fdf4',
    border: '2px dashed #22c55e',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center' as const,
    margin: '24px 0'
  },
  highlightAmount: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#15803d',
    margin: '4px 0'
  },
  highlightNote: {
    fontSize: '12px',
    color: '#166534',
    margin: '4px 0 0 0'
  },
  buttonPrimary: {
    display: 'inline-block',
    backgroundColor: '#11d442',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '700',
    padding: '14px 28px',
    borderRadius: '12px',
    textDecoration: 'none',
    textAlign: 'center' as const,
    margin: '16px 0'
  },
  list: {
    margin: '10px 0',
    paddingLeft: '20px',
    fontSize: '13px',
    color: '#334155',
    lineHeight: '1.6'
  },
  footer: {
    backgroundColor: '#f1f5f9',
    padding: '24px',
    textAlign: 'center' as const,
    borderTop: '1px solid #e2e8f0'
  },
  footerText: {
    fontSize: '12px',
    color: '#64748b',
    margin: '4px 0'
  }
};

/* =========================================================================
   1. CLIENTE: Acuse de Recibo de Cotización (Pendiente de Aprobación)
   ========================================================================= */
interface QuoteReceivedProps {
  organizerName: string;
  groupName?: string;
  groupType: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  totalGuests: number;
  payingGuests: number;
  under3Years: number;
  hasBouncyCastle: boolean;
  totalAmount: number;
  depositRequired: number;
  quoteId: string;
  companyName?: string;
  companyPhone?: string;
  companyEmail?: string;
}

export const EventQuoteReceivedClientTemplate: React.FC<QuoteReceivedProps> = ({
  organizerName,
  groupName,
  groupType,
  eventDate,
  startTime,
  endTime,
  totalGuests,
  payingGuests,
  under3Years,
  hasBouncyCastle,
  totalAmount,
  depositRequired,
  quoteId,
  companyName = 'Rancho Carmelitas',
  companyPhone = '+56 9 6727 4017',
  companyEmail = 'contacto@ranchocarmelitas.cl'
}) => {
  const groupLabel = groupType === 'paseo_curso' ? 'Paseo de Curso' : groupType === 'adulto_mayor' ? 'Agrupación Adulto Mayor' : 'Evento Familiar / Empresa';

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.badgePending}>Solicitud Recibida</div>
          <h1 style={styles.headerTitle}>{companyName}</h1>
          <p style={styles.headerSubtitle}>Arriendo Exclusivo de Recinto Completo (8 Horas)</p>
        </div>

        <div style={styles.body}>
          <p style={styles.greeting}>¡Hola {organizerName}!</p>
          <p style={styles.paragraph}>
            Hemos recibido tu solicitud de cotización para disfrutar de nuestro recinto en exclusiva con tu grupo (<strong>{groupName || organizerName}</strong>).
          </p>

          <div style={styles.card}>
            <div style={styles.cardTitle}>📋 Resumen de tu Solicitud</div>
            <table style={styles.table}>
              <tbody>
                <tr>
                  <td style={styles.tableLabel}>Fecha Solicitada:</td>
                  <td style={styles.tableValue}>{formatDate(eventDate)}</td>
                </tr>
                <tr>
                  <td style={styles.tableLabel}>Horario (8 horas):</td>
                  <td style={styles.tableValue}>{startTime?.slice(0, 5)} a {endTime?.slice(0, 5)} hrs</td>
                </tr>
                <tr>
                  <td style={styles.tableLabel}>Tipo de Grupo:</td>
                  <td style={styles.tableValue}>{groupLabel}</td>
                </tr>
                <tr>
                  <td style={styles.tableLabel}>Asistentes:</td>
                  <td style={styles.tableValue}>{totalGuests} personas ({payingGuests} mayores + {under3Years} menores de 3 años)</td>
                </tr>
                <tr>
                  <td style={styles.tableLabel}>Juegos Inflables:</td>
                  <td style={styles.tableValue}>{hasBouncyCastle ? 'Sí (+$5.000 luz)' : 'No'}</td>
                </tr>
                <tr>
                  <td style={styles.tableLabel}>Folio de Seguimiento:</td>
                  <td style={styles.tableValue}>#{quoteId?.slice(0, 8).toUpperCase()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={styles.highlightBox}>
            <div style={{ fontSize: '13px', color: '#166534', fontWeight: 'bold' }}>Valor Estimado del Arriendo</div>
            <div style={styles.highlightAmount}>{formatMoney(totalAmount)}</div>
            <p style={styles.highlightNote}>
              Abono requerido para reservar (50%): <strong>{formatMoney(depositRequired)}</strong>
            </p>
          </div>

          <div style={{ ...styles.card, backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
            <div style={{ ...styles.cardTitle, color: '#166534' }}>🧭 Próximos Pasos</div>
            <ol style={styles.list}>
              <li><strong>Revisión Administrativa:</strong> Nuestro equipo validará los detalles de tu delegación.</li>
              <li><strong>Aprobación y Enlace de Pago:</strong> Te enviaremos un correo con el botón de pago oficial para realizar el abono del 50%.</li>
              <li><strong>Bloqueo Exclusivo:</strong> Al acreditarse el abono, el recinto quedará 100% reservado para tu celebración.</li>
            </ol>
          </div>

          <p style={{ ...styles.paragraph, fontSize: '13px', color: '#64748b', textAlign: 'center' }}>
            Si necesitas realizar algún cambio o consulta adicional, puedes responder este correo o escribirnos al WhatsApp de atención.
          </p>
        </div>

        <div style={styles.footer}>
          <p style={styles.footerText}><strong>{companyName}</strong> — Pullally, Papudo, Región de Valparaíso</p>
          <p style={styles.footerText}>WhatsApp / Tel: {companyPhone} | Email: {companyEmail}</p>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   2. ADMIN: Alerta de Nueva Cotización para Revisión y Aprobación
   ========================================================================= */
interface AdminAlertProps {
  organizerName: string;
  organizerEmail: string;
  organizerPhone: string;
  organizerRut?: string;
  groupName?: string;
  groupType: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  totalGuests: number;
  payingGuests: number;
  under3Years: number;
  hasBouncyCastle: boolean;
  extraNotes?: string;
  totalAmount: number;
  depositRequired: number;
  quoteId: string;
  adminUrl?: string;
}

export const EventQuoteAdminAlertTemplate: React.FC<AdminAlertProps> = ({
  organizerName,
  organizerEmail,
  organizerPhone,
  organizerRut,
  groupName,
  groupType,
  eventDate,
  startTime,
  endTime,
  totalGuests,
  payingGuests,
  under3Years,
  hasBouncyCastle,
  extraNotes,
  totalAmount,
  depositRequired,
  quoteId,
  adminUrl = 'https://ranchocarmelitas.cl/admin/reservas?tab=eventos'
}) => {
  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <div style={{ ...styles.header, backgroundColor: '#1e293b' }}>
          <div style={styles.badgePending}>Nueva Solicitud Diurna</div>
          <h1 style={styles.headerTitle}>Solicitud de Recinto Completo</h1>
          <p style={styles.headerSubtitle}>{formatDate(eventDate)} • 8 Horas</p>
        </div>

        <div style={styles.body}>
          <p style={styles.greeting}>Nueva cotización ingresada en la página web:</p>

          <div style={styles.card}>
            <div style={styles.cardTitle}>👤 Datos del Organizador</div>
            <table style={styles.table}>
              <tbody>
                <tr>
                  <td style={styles.tableLabel}>Responsable:</td>
                  <td style={styles.tableValue}>{organizerName} {organizerRut ? `(${organizerRut})` : ''}</td>
                </tr>
                <tr>
                  <td style={styles.tableLabel}>Email:</td>
                  <td style={styles.tableValue}>{organizerEmail}</td>
                </tr>
                <tr>
                  <td style={styles.tableLabel}>Teléfono / WhatsApp:</td>
                  <td style={styles.tableValue}>{organizerPhone}</td>
                </tr>
                <tr>
                  <td style={styles.tableLabel}>Grupo:</td>
                  <td style={styles.tableValue}>{groupName || 'No especificado'} ({groupType})</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>📅 Detalles del Evento</div>
            <table style={styles.table}>
              <tbody>
                <tr>
                  <td style={styles.tableLabel}>Fecha:</td>
                  <td style={styles.tableValue}>{formatDate(eventDate)}</td>
                </tr>
                <tr>
                  <td style={styles.tableLabel}>Horario:</td>
                  <td style={styles.tableValue}>{startTime?.slice(0, 5)} a {endTime?.slice(0, 5)} hrs (8h)</td>
                </tr>
                <tr>
                  <td style={styles.tableLabel}>Asistentes:</td>
                  <td style={styles.tableValue}>{totalGuests} personas ({payingGuests} pagan + {under3Years} menores de 3 años)</td>
                </tr>
                <tr>
                  <td style={styles.tableLabel}>Juegos Inflables:</td>
                  <td style={styles.tableValue}>{hasBouncyCastle ? 'Sí (+$5.000 recargo luz)' : 'No'}</td>
                </tr>
                {extraNotes && (
                  <tr>
                    <td style={styles.tableLabel}>Notas del Cliente:</td>
                    <td style={{ ...styles.tableValue, color: '#b45309' }}>"{extraNotes}"</td>
                  </tr>
                )}
                <tr>
                  <td style={styles.tableLabel}>Total Cotizado:</td>
                  <td style={{ ...styles.tableValue, color: '#16a34a', fontSize: '15px' }}>{formatMoney(totalAmount)}</td>
                </tr>
                <tr>
                  <td style={styles.tableLabel}>Abono Requerido (50%):</td>
                  <td style={styles.tableValue}>{formatMoney(depositRequired)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ textAlign: 'center', margin: '24px 0' }}>
            <a href={`${adminUrl}&id=${quoteId}`} style={styles.buttonPrimary}>
              🔍 Ver y Aprobar en el PMS
            </a>
          </div>
        </div>

        <div style={styles.footer}>
          <p style={styles.footerText}>Sistema de Notificaciones PMS Rancho Carmelitas</p>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   3. CLIENTE: Cotización APROBADA (Enlace de Pago del 50%)
   ========================================================================= */
interface QuoteApprovedProps {
  organizerName: string;
  groupName?: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  totalGuests: number;
  totalAmount: number;
  depositRequired: number;
  quoteId: string;
  paymentUrl: string;
  bankDetails?: {
    bankName?: string;
    accountType?: string;
    accountNumber?: string;
    rut?: string;
    holderName?: string;
    email?: string;
  };
  companyName?: string;
  companyPhone?: string;
}

export const EventQuoteApprovedClientTemplate: React.FC<QuoteApprovedProps> = ({
  organizerName,
  groupName,
  eventDate,
  startTime,
  endTime,
  totalGuests,
  totalAmount,
  depositRequired,
  quoteId,
  paymentUrl,
  bankDetails,
  companyName = 'Rancho Carmelitas',
  companyPhone = '+56 9 6727 4017'
}) => {
  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <div style={{ ...styles.header, backgroundColor: '#1e3a8a' }}>
          <div style={styles.badgeApproved}>¡Cotización Aprobada!</div>
          <h1 style={styles.headerTitle}>{companyName}</h1>
          <p style={styles.headerSubtitle}>Tu fecha está disponible para reservar</p>
        </div>

        <div style={styles.body}>
          <p style={styles.greeting}>¡Excelentes noticias, {organizerName}!</p>
          <p style={styles.paragraph}>
            Hemos revisado tu solicitud para el grupo <strong>{groupName || organizerName}</strong> y está <strong>APROBADA</strong> para el día <strong>{formatDate(eventDate)}</strong>.
          </p>

          <p style={styles.paragraph}>
            Para asegurar formalmente el recinto de manera exclusiva y bloquear el día, solo debes realizar el <strong>abono inicial del 50%</strong>. El 50% restante se paga al hacer ingreso al recinto.
          </p>

          <div style={styles.highlightBox}>
            <div style={{ fontSize: '13px', color: '#1e40af', fontWeight: 'bold' }}>Monto de Abono Requerido (50%)</div>
            <div style={{ ...styles.highlightAmount, color: '#1d4ed8' }}>{formatMoney(depositRequired)}</div>
            <p style={{ ...styles.highlightNote, color: '#1e3a8a' }}>
              Total Arriendo: {formatMoney(totalAmount)} • Saldo al ingresar: {formatMoney(totalAmount - depositRequired)}
            </p>
          </div>

          <div style={{ textAlign: 'center', margin: '28px 0' }}>
            <a href={paymentUrl} style={styles.buttonPrimary}>
              💳 Pagar Abono 50% en Línea
            </a>
            <p style={{ fontSize: '11px', color: '#64748b', margin: '8px 0 0 0' }}>
              Puedes pagar con Tarjeta de Débito, Crédito o Prepago mediante Mercado Pago.
            </p>
          </div>

          {/* Opción de Transferencia Bancaria */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>🏦 Opción: Pago por Transferencia Bancaria</div>
            <table style={styles.table}>
              <tbody>
                <tr>
                  <td style={styles.tableLabel}>Banco:</td>
                  <td style={styles.tableValue}>{bankDetails?.bankName || 'Banco Santander'}</td>
                </tr>
                <tr>
                  <td style={styles.tableLabel}>Tipo de Cuenta:</td>
                  <td style={styles.tableValue}>{bankDetails?.accountType || 'Cuenta Corriente'}</td>
                </tr>
                <tr>
                  <td style={styles.tableLabel}>N° de Cuenta:</td>
                  <td style={styles.tableValue}>{bankDetails?.accountNumber || '84012748'}</td>
                </tr>
                <tr>
                  <td style={styles.tableLabel}>RUT Titular:</td>
                  <td style={styles.tableValue}>{bankDetails?.rut || '7.616.275-1'}</td>
                </tr>
                <tr>
                  <td style={styles.tableLabel}>Nombre:</td>
                  <td style={styles.tableValue}>{bankDetails?.holderName || 'Rancho Carmelitas'}</td>
                </tr>
                <tr>
                  <td style={styles.tableLabel}>Email Comprobante:</td>
                  <td style={styles.tableValue}>{bankDetails?.email || 'contacto@ranchocarmelitas.cl'}</td>
                </tr>
              </tbody>
            </table>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '12px 0 0 0' }}>
              * Al transferir, indica en el asunto tu folio <strong>#{quoteId.slice(0, 8).toUpperCase()}</strong> y envíanos el comprobante al WhatsApp {companyPhone}.
            </p>
          </div>

          <div style={{ ...styles.card, backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
            <div style={{ ...styles.cardTitle, color: '#991b1b' }}>📌 Políticas de Cancelación y Reagendamiento</div>
            <ul style={{ ...styles.list, color: '#7f1d1d' }}>
              <li><strong>Cancelaciones con devolución:</strong> Hasta 5 días previos al evento se devuelve el 100% de la reserva.</li>
              <li>Pasado este periodo, no se hará devolución del abono.</li>
              <li><strong>Reagendamiento:</strong> Ofrecemos la opción de reagendar a otra fecha según disponibilidad.</li>
            </ul>
          </div>
        </div>

        <div style={styles.footer}>
          <p style={styles.footerText}><strong>{companyName}</strong> — Pullally, Papudo</p>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   4. CLIENTE: CONFIRMACIÓN DEFINITIVA TRAS ABONO (Recinto Bloqueado)
   ========================================================================= */
interface QuoteConfirmedProps {
  organizerName: string;
  groupName?: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  totalGuests: number;
  totalAmount: number;
  depositPaid: number;
  paymentMethod: string;
  paymentReference?: string;
  quoteId: string;
  companyName?: string;
  companyPhone?: string;
}

export const EventQuoteConfirmedClientTemplate: React.FC<QuoteConfirmedProps> = ({
  organizerName,
  groupName,
  eventDate,
  startTime,
  endTime,
  totalGuests,
  totalAmount,
  depositPaid,
  paymentMethod,
  paymentReference,
  quoteId,
  companyName = 'Rancho Carmelitas',
  companyPhone = '+56 9 6727 4017'
}) => {
  const remaining = Math.max(0, totalAmount - depositPaid);

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <div style={{ ...styles.header, backgroundColor: '#065f46' }}>
          <div style={styles.badgeSuccess}>🎉 ¡Recinto Confirmado!</div>
          <h1 style={styles.headerTitle}>{companyName}</h1>
          <p style={styles.headerSubtitle}>El recinto ha sido reservado exclusivamente para tu grupo</p>
        </div>

        <div style={styles.body}>
          <p style={styles.greeting}>¡Felicidades, {organizerName}!</p>
          <p style={styles.paragraph}>
            {depositPaid > 0 ? (
              <>Hemos registrado con éxito tu abono de <strong>{formatMoney(depositPaid)}</strong>. El arriendo exclusivo de <strong>{companyName}</strong> para tu grupo (<strong>{groupName || organizerName}</strong>) se encuentra oficialmente <strong>CONFIRMADO Y RESERVADO</strong>.</>
            ) : (
              <>Tu reserva para el arriendo exclusivo de <strong>{companyName}</strong> para tu grupo (<strong>{groupName || organizerName}</strong>) se encuentra oficialmente <strong>CONFIRMADA Y RESERVADA</strong>.</>
            )}
          </p>

          <div style={styles.card}>
            <div style={styles.cardTitle}>📅 Ficha Oficial del Evento</div>
            <table style={styles.table}>
              <tbody>
                <tr>
                  <td style={styles.tableLabel}>Fecha:</td>
                  <td style={styles.tableValue}>{formatDate(eventDate)}</td>
                </tr>
                <tr>
                  <td style={styles.tableLabel}>Horario de Uso:</td>
                  <td style={styles.tableValue}>{startTime?.slice(0, 5)} a {endTime?.slice(0, 5)} hrs (máximo 20:00 hrs)</td>
                </tr>
                <tr>
                  <td style={styles.tableLabel}>Asistentes:</td>
                  <td style={styles.tableValue}>{totalGuests} personas</td>
                </tr>
                <tr>
                  <td style={styles.tableLabel}>{depositPaid > 0 ? 'Abono Acreditado:' : 'Abono Registrado:'}</td>
                  <td style={{ ...styles.tableValue, color: depositPaid > 0 ? '#16a34a' : '#64748b' }}>
                    {formatMoney(depositPaid)} {depositPaid > 0 ? `(${paymentMethod})` : '(Pendiente)'}
                  </td>
                </tr>
                <tr>
                  <td style={styles.tableLabel}>Saldo al Ingresar:</td>
                  <td style={{ ...styles.tableValue, color: '#0f172a', fontWeight: 'bold' }}>{formatMoney(remaining)}</td>
                </tr>
                {paymentReference && (
                  <tr>
                    <td style={styles.tableLabel}>N° Comprobante:</td>
                    <td style={styles.tableValue}>{paymentReference}</td>
                  </tr>
                )}
                <tr>
                  <td style={styles.tableLabel}>Folio de Reserva:</td>
                  <td style={styles.tableValue}>#{quoteId.slice(0, 8).toUpperCase()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ ...styles.card, backgroundColor: '#f0fdf4', borderColor: '#86efac' }}>
            <div style={{ ...styles.cardTitle, color: '#166534' }}>🌳 ¿Qué incluye el arriendo exclusivo de 8 horas?</div>
            <ul style={styles.list}>
              <li><strong>Uso exclusivo por 8 horas</strong> del recinto completo (hasta las 20:00 hrs).</li>
              <li><strong>Áreas verdes y Piscina</strong> para disfrutar en grupo.</li>
              <li><strong>Estacionamiento</strong> habilitado para hasta 8 vehículos.</li>
              <li><strong>Quincho cerrado y equipado:</strong> Parrilla, fogón de 2 platos, horno industrial (no incluye gas), 2 refrigeradores, 1 congeladora y lavaplatos.</li>
              <li><strong>Pérgola cubierta</strong> y mobiliario con mesas y sillas para hasta 70 personas.</li>
              <li><strong>Zona de Juegos:</strong> Taca-taca, mesa de ping pong profesional y mesa de Air Hockey.</li>
            </ul>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>💡 Recomendaciones Útiles para tu Llegada</div>
            <ul style={styles.list}>
              <li>Pueden traer su propia losa y vajilla.</li>
              <li>Si traen carritos de comida, animación o inflables (recargo $5.000 luz), contáctanos para coordinar el ingreso.</li>
              <li>Si van a utilizar el horno industrial, recuerden traer su propio balón de gas.</li>
            </ul>
          </div>

          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <a
              href="https://maps.app.goo.gl/6W1fhgChaMWaQzbK8"
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...styles.buttonPrimary, backgroundColor: '#0f172a' }}
            >
              📍 Cómo Llegar (Google Maps)
            </a>
          </div>
        </div>

        <div style={styles.footer}>
          <p style={styles.footerText}><strong>{companyName}</strong> — Avenida Las Salinas LT 104-D4, Pullally, Papudo</p>
          <p style={styles.footerText}>Contacto de Anfitriones: {companyPhone}</p>
        </div>
      </div>
    </div>
  );
};
