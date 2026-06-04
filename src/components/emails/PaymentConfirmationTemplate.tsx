import * as React from 'react';

interface PaymentConfirmationEmailProps {
  guestName: string;
  cabinName: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  discountApplied: number;
  extraGuestsCost: number;
  paymentAmount: number;
  paymentReference: string;
  paymentReceiptUrl?: string;
  adults: number;
  children: number;
  bookingId: string;
  // Datos empresa
  companyName?: string;
  companyRut?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  // Nuevas propiedades de plataforma
  plataformaNombre?: string | null;
  plataformaComisionAplicada?: number;
  requiresInvoice?: boolean;
  payments?: any[];
}

export const PaymentConfirmationTemplate: React.FC<Readonly<PaymentConfirmationEmailProps>> = ({
  guestName,
  cabinName,
  checkIn,
  checkOut,
  totalPrice,
  discountApplied,
  extraGuestsCost,
  paymentAmount,
  paymentReference,
  paymentReceiptUrl,
  adults,
  children,
  bookingId,
  companyName = 'Rancho Carmelitas',
  companyRut,
  companyAddress,
  companyPhone,
  companyEmail,
  plataformaNombre = null,
  plataformaComisionAplicada = 0,
  requiresInvoice = false,
  payments = [],
}) => {
  const aplicaIVA = !!plataformaNombre || requiresInvoice;
  const C = (plataformaComisionAplicada || 0) / 100;
  const totalCliente = totalPrice || 0;
  
  const precioBaseNeto = aplicaIVA 
    ? totalCliente / (1.19 * (1 + C))
    : totalCliente / (1 + C);
    
  const comisionPlataformaMonto = precioBaseNeto * C;
  const ivaMonto = aplicaIVA ? (precioBaseNeto + comisionPlataformaMonto) * 0.19 : 0;
  
  const precioBaseOriginal = precioBaseNeto + discountApplied;
  
  const totalAPagar = totalCliente;
  const saldoPendiente = Math.max(0, totalAPagar - paymentAmount);

  const totalGuests = adults + children;

  return (
    <table width="100%" border={0} cellPadding={0} cellSpacing={0} style={styles.wrapper}>
      <tbody>
        <tr>
          <td align="center" valign="top" style={{ padding: '40px 20px' }}>
            <table width="100%" border={0} cellPadding={0} cellSpacing={0} style={styles.container}>
              <tbody>
                <tr>
                  <td align="left" valign="top">
                    
                    {/* Header */}
                    <div style={styles.header}>
                      <div style={styles.badge}>✓ Reserva Confirmada</div>
                      <h1 style={styles.title}>{companyName}</h1>
                      <p style={styles.subtitle}>Tu reserva está oficialmente confirmada</p>
                    </div>
                    
                    <div style={styles.content}>
                      <p style={styles.greeting}>Estimado/a <strong>{guestName}</strong>,</p>
                      <p style={styles.text}>
                        Hemos recibido y verificado tu abono correctamente. Tu estadía está <strong>100% confirmada</strong>. 
                        Estamos muy contentos de recibirte y te esperamos con todo listo.
                      </p>

                      {/* Detalles de Estadía */}
                      <div style={styles.card}>
                        <h2 style={styles.cardTitle}>📅 Detalles de tu Estadía</h2>
                        <table style={styles.table}>
                          <tbody>
                            <tr>
                              <td style={styles.tdLabel}>Cabaña:</td>
                              <td style={styles.tdValue}><strong>{cabinName}</strong></td>
                            </tr>
                            <tr>
                              <td style={styles.tdLabel}>Check-in:</td>
                              <td style={styles.tdValue}><strong>{checkIn}</strong> — desde las 15:00 hrs</td>
                            </tr>
                            <tr>
                              <td style={styles.tdLabel}>Check-out:</td>
                              <td style={styles.tdValue}><strong>{checkOut}</strong> — hasta las 12:00 hrs</td>
                            </tr>
                            <tr>
                              <td style={styles.tdLabel}>Huéspedes:</td>
                              <td style={styles.tdValue}>{totalGuests} personas ({adults} adultos{children > 0 ? `, ${children} niños` : ''})</td>
                            </tr>
                            <tr>
                              <td style={styles.tdLabel}>N° Reserva:</td>
                              <td style={styles.tdValue}><span style={styles.bookingId}>{bookingId.slice(0, 8).toUpperCase()}</span></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Desglose Financiero */}
                      <div style={styles.card}>
                        <h2 style={styles.cardTitle}>💳 Detalle del Pago</h2>
                        <table style={styles.table}>
                          <tbody>
                            <tr>
                              <td style={styles.tdLabel}>Precio Base (cabaña):</td>
                              <td style={styles.tdValue}>${Math.round(precioBaseOriginal).toLocaleString('es-CL')}</td>
                            </tr>
                            {discountApplied > 0 && (
                              <tr>
                                <td style={{ ...styles.tdLabel, color: '#16a34a' }}>- Descuento aplicado:</td>
                                <td style={{ ...styles.tdValue, color: '#16a34a' }}>- ${Math.round(discountApplied).toLocaleString('es-CL')}</td>
                              </tr>
                            )}
                            {discountApplied > 0 && (
                              <tr>
                                <td style={{ ...styles.tdLabel, color: '#6b7280', fontSize: '13px' }}>Precio Base Neto:</td>
                                <td style={{ ...styles.tdValue, color: '#6b7280', fontSize: '13px' }}>${Math.round(precioBaseNeto).toLocaleString('es-CL')}</td>
                              </tr>
                            )}
                            {plataformaNombre && plataformaComisionAplicada > 0 && (
                              <tr>
                                <td style={{ ...styles.tdLabel, color: '#2563eb' }}>+ Comisión de Servicio ({plataformaNombre} - {plataformaComisionAplicada}%):</td>
                                <td style={{ ...styles.tdValue, color: '#2563eb' }}>+ ${Math.round(comisionPlataformaMonto).toLocaleString('es-CL')}</td>
                              </tr>
                            )}
                            {aplicaIVA && (
                              <tr>
                                <td style={{ ...styles.tdLabel, color: '#6b7280' }}>+ IVA (19%):</td>
                                <td style={{ ...styles.tdValue, color: '#6b7280' }}>+ ${Math.round(ivaMonto).toLocaleString('es-CL')}</td>
                              </tr>
                            )}
                            <tr>
                              <td style={{ ...styles.tdLabel, fontWeight: 'bold', borderTop: '1px solid #e5e7eb', paddingTop: '10px' }}>Total Estadía:</td>
                              <td style={{ ...styles.tdValue, fontWeight: 'bold', borderTop: '1px solid #e5e7eb', paddingTop: '10px' }}>${Math.round(totalAPagar).toLocaleString('es-CL')}</td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Abono y Saldo */}
                        <div style={styles.paymentSummary}>
                          <table width="100%" border={0} cellPadding={0} cellSpacing={0}>
                            <tbody>
                              {payments && payments.length > 0 ? (
                                <>
                                  <tr>
                                    <td colSpan={2} style={{ paddingBottom: '12px' }}>
                                      <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#1f2937', fontSize: '14px' }}>Historial de Abonos</p>
                                      <table width="100%" border={0} cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                        <tbody>
                                          {payments.map((p, index) => (
                                            <tr key={p.id || index}>
                                              <td align="left" style={{ padding: '10px 12px', fontSize: '13px', color: '#4b5563', borderBottom: index < payments.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                                                <div><strong>Abono #{index + 1}</strong></div>
                                                <div style={{ color: '#9ca3af', fontSize: '11px', marginTop: '2px' }}>
                                                  {p.payment_method || 'Transferencia'} 
                                                  {p.reference && ` — Ref: ${p.reference}`}
                                                  {p.created_at && ` — ${new Date(p.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}`}
                                                </div>
                                              </td>
                                              <td align="right" valign="middle" style={{ padding: '10px 12px', fontSize: '13px', color: '#16a34a', fontWeight: 'bold', borderBottom: index < payments.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                                                +${Math.round(p.amount).toLocaleString('es-CL')}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td align="left" valign="middle" style={{ paddingBottom: '12px', paddingTop: '4px' }}>
                                      <p style={{ margin: 0, fontWeight: 'bold', color: '#1f2937', fontSize: '14px' }}>Total Abonado</p>
                                    </td>
                                    <td align="right" valign="middle" style={{ paddingBottom: '12px', paddingTop: '4px' }}>
                                      <p style={{ margin: 0, fontWeight: 'bold', fontSize: '18px', color: '#16a34a' }}>${paymentAmount.toLocaleString('es-CL')}</p>
                                    </td>
                                  </tr>
                                </>
                              ) : (
                                <tr>
                                  <td align="left" valign="middle" style={{ paddingBottom: '12px' }}>
                                    <p style={{ margin: 0, fontWeight: 'bold', color: '#1f2937', fontSize: '14px' }}>Abono Recibido</p>
                                    {paymentReference && <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#6b7280' }}>Ref: {paymentReference}</p>}
                                  </td>
                                  <td align="right" valign="middle" style={{ paddingBottom: '12px' }}>
                                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '20px', color: '#16a34a' }}>${paymentAmount.toLocaleString('es-CL')}</p>
                                  </td>
                                </tr>
                              )}
                              <tr>
                                <td colSpan={2} style={{ borderTop: '2px dashed #d1d5db', height: '1px', padding: 0 }} />
                              </tr>
                              <tr>
                                <td align="left" valign="middle" style={{ paddingTop: '12px' }}>
                                  <p style={{ margin: 0, fontWeight: 'bold', color: '#1f2937', fontSize: '14px' }}>Saldo a Pagar al Check-in</p>
                                  <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#6b7280' }}>Cancelar en efectivo o transferencia al llegar</p>
                                </td>
                                <td align="right" valign="middle" style={{ paddingTop: '12px' }}>
                                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: '24px', color: saldoPendiente > 0 ? '#dc2626' : '#16a34a' }}>
                                    ${saldoPendiente.toLocaleString('es-CL')}
                                  </p>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Link al comprobante si existe */}
                      {paymentReceiptUrl && (
                        <div style={styles.receiptBox}>
                          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#1f2937' }}>📎 Comprobante de Pago</p>
                          <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#4b5563' }}>
                            Hemos adjuntado el comprobante de tu abono para tu registro personal.
                          </p>
                          <a href={paymentReceiptUrl} target="_blank" rel="noreferrer" style={styles.receiptButton}>
                            Ver Comprobante
                          </a>
                        </div>
                      )}

                      {/* Aviso saldo */}
                      {saldoPendiente > 0 && (
                        <div style={styles.alertBox}>
                          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>
                            ⚠️ Recuerda: Al momento del check-in deberás cancelar el saldo pendiente de <strong>${saldoPendiente.toLocaleString('es-CL')}</strong>.
                          </p>
                        </div>
                      )}

                      <p style={styles.footerText}>
                        Si tienes alguna consulta, puedes contactarnos respondiendo este correo{companyPhone ? ` o llamando al ${companyPhone}` : ''}.
                      </p>
                      
                      <p style={styles.signature}>
                        ¡Te esperamos con mucho gusto!<br />
                        <strong>El equipo de {companyName}</strong>
                      </p>
                    </div>
                    
                    {/* Footer empresa */}
                    <div style={styles.footer}>
                      <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', fontSize: '14px', color: '#f3f4f6' }}>{companyName}</p>
                      {companyRut && <p style={styles.footerLine}>RUT: {companyRut}</p>}
                      {companyAddress && <p style={styles.footerLine}>📍 {companyAddress}</p>}
                      {companyPhone && <p style={styles.footerLine}>📞 {companyPhone}</p>}
                      {companyEmail && <p style={styles.footerLine}>✉️ {companyEmail}</p>}
                      <p style={{ ...styles.footerLine, marginTop: '16px', borderTop: '1px solid #374151', paddingTop: '12px' }}>
                        © {new Date().getFullYear()} {companyName}. Todos los derechos reservados.
                      </p>
                      <p style={{ ...styles.footerLine, fontSize: '10px', color: '#6b7280', marginTop: '8px' }}>
                        Comprobante generado automáticamente el {new Date().toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })} a las {new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} hrs. ID: {bookingId.slice(0, 8).toUpperCase()}-{Date.now().toString().slice(-4)}
                      </p>
                    </div>
                    
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

const styles = {
  wrapper: {
    backgroundColor: '#f3f4f6',
    width: '100%',
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  },
  container: {
    width: '100%',
    maxWidth: '600px',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    backgroundColor: '#ffffff',
  },
  header: {
    background: 'linear-gradient(135deg, #065f46 0%, #11d442 100%)',
    padding: '40px 30px',
    textAlign: 'center' as const,
  },
  badge: {
    display: 'inline-block',
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: '#ffffff',
    padding: '6px 16px',
    borderRadius: '999px',
    fontSize: '13px',
    fontWeight: 'bold',
    marginBottom: '12px',
    border: '1px solid rgba(255,255,255,0.3)',
  },
  title: {
    color: '#ffffff',
    margin: '0 0 8px 0',
    fontSize: '28px',
    fontWeight: 'bold',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    margin: 0,
    fontSize: '15px',
  },
  content: {
    padding: '32px 30px',
  },
  greeting: {
    fontSize: '18px',
    margin: '0 0 12px 0',
    color: '#111827',
  },
  text: {
    fontSize: '15px',
    lineHeight: '1.7',
    color: '#4b5563',
    margin: '0 0 28px 0',
  },
  card: {
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    padding: '20px 24px',
    marginBottom: '20px',
    border: '1px solid #e5e7eb',
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#111827',
    margin: '0 0 16px 0',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  tdLabel: {
    padding: '7px 0',
    color: '#6b7280',
    fontSize: '14px',
    width: '45%',
  },
  tdValue: {
    padding: '7px 0',
    color: '#111827',
    fontSize: '14px',
    textAlign: 'right' as const,
  },
  bookingId: {
    fontFamily: 'monospace',
    backgroundColor: '#e5e7eb',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: 'bold',
  },
  paymentSummary: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '16px',
    marginTop: '16px',
    border: '1px solid #d1d5db',
  },
  paymentRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptBox: {
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '12px',
    padding: '20px 24px',
    marginBottom: '20px',
  },
  receiptButton: {
    display: 'inline-block',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    padding: '10px 24px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  alertBox: {
    backgroundColor: '#fff7ed',
    border: '1px solid #fed7aa',
    borderLeft: '4px solid #f97316',
    borderRadius: '8px',
    padding: '16px 20px',
    marginBottom: '24px',
    color: '#c2410c',
  },
  footerText: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#6b7280',
    marginTop: '24px',
  },
  signature: {
    fontSize: '15px',
    lineHeight: '1.7',
    color: '#374151',
    marginTop: '16px',
  },
  footer: {
    backgroundColor: '#1f2937',
    padding: '28px 30px',
    textAlign: 'center' as const,
  },
  footerLine: {
    margin: '4px 0',
    fontSize: '12px',
    color: '#9ca3af',
  },
};
