import * as React from 'react';

interface CheckoutThankYouEmailProps {
  guestName: string;
  cabinName: string;
  checkIn: string;
  checkOut: string;
  bookingId: string;
  // Datos empresa
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
}

export const CheckoutThankYouTemplate: React.FC<Readonly<CheckoutThankYouEmailProps>> = ({
  guestName,
  cabinName,
  checkIn,
  checkOut,
  bookingId,
  companyName = 'Rancho Carmelitas',
  companyAddress,
  companyPhone,
  companyEmail,
}) => {
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
                      <div style={styles.badge}>🌿 ¡Feliz Viaje de Regreso!</div>
                      <h1 style={styles.title}>{companyName}</h1>
                      <p style={styles.subtitle}>Muchas gracias por tu visita</p>
                    </div>
                    
                    <div style={styles.content}>
                      <p style={styles.greeting}>Estimado/a <strong>{guestName}</strong>,</p>
                      
                      <p style={styles.text}>
                        Esperamos que hayas tenido un viaje de regreso seguro y cómodo. Queremos agradecerte sinceramente por haber elegido **{companyName}** para disfrutar tus días de descanso.
                      </p>
                      
                      <p style={styles.text}>
                        Fue un verdadero placer tenerte como nuestro huésped en la cabaña <strong>{cabinName}</strong>. Esperamos que tu estadía haya sido maravillosa y que te lleves excelentes recuerdos de la tranquilidad del Rancho y del entorno de Pullally.
                      </p>

                      {/* Detalles de Estadía */}
                      <div style={styles.card}>
                        <h2 style={styles.cardTitle}>📅 Resumen de tu Estadía</h2>
                        <table style={styles.table}>
                          <tbody>
                            <tr>
                              <td style={styles.tdLabel}>Cabaña:</td>
                              <td style={styles.tdValue}><strong>{cabinName}</strong></td>
                            </tr>
                            <tr>
                              <td style={styles.tdLabel}>Fecha de Entrada:</td>
                              <td style={styles.tdValue}>{checkIn}</td>
                            </tr>
                            <tr>
                              <td style={styles.tdLabel}>Fecha de Salida:</td>
                              <td style={styles.tdValue}>{checkOut}</td>
                            </tr>
                            <tr>
                              <td style={styles.tdLabel}>N° Reserva:</td>
                              <td style={styles.tdValue}>
                                <span style={styles.bookingId}>
                                  {bookingId.slice(0, 8).toUpperCase()}
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Caja de Opinión y Feedback */}
                      <div style={styles.feedbackBox}>
                        <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#854d0e', fontSize: '15px' }}>
                          💬 ¿Cómo estuvo tu experiencia?
                        </p>
                        <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#713f12', lineHeight: '1.6' }}>
                          Tu opinión es sumamente importante para nosotros. Nos ayuda a seguir mejorando y preparar cada rincón con el máximo cariño. Si tienes un minuto, nos encantaría que nos dejes tu comentario en nuestras redes sociales o respondiendo directamente a este correo.
                        </p>
                        <div style={{ marginTop: '16px' }}>
                          <span style={{ fontSize: '13px', color: '#854d0e', fontWeight: 'bold' }}>Síguenos y comparte tus momentos:</span>
                          <div style={{ marginTop: '8px' }}>
                            <a href="https://instagram.com" target="_blank" rel="noreferrer" style={styles.socialLink}>Instagram</a>
                            <span style={{ color: '#fed7aa', margin: '0 8px' }}>•</span>
                            <a href="https://facebook.com" target="_blank" rel="noreferrer" style={styles.socialLink}>Facebook</a>
                          </div>
                        </div>
                      </div>

                      <p style={styles.footerText}>
                        Si tienes algún comentario, sugerencia o necesitas coordinar algo para tu próxima visita, no dudes en ponerte en contacto con nosotros.
                      </p>
                      
                      <p style={styles.signature}>
                        ¡Te esperamos de vuelta muy pronto!<br />
                        <strong>El equipo de {companyName}</strong>
                      </p>
                    </div>
                    
                    {/* Footer empresa */}
                    <div style={styles.footer}>
                      <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', fontSize: '14px', color: '#f3f4f6' }}>{companyName}</p>
                      {companyAddress && <p style={styles.footerLine}>📍 {companyAddress}</p>}
                      {companyPhone && <p style={styles.footerLine}>📞 {companyPhone}</p>}
                      {companyEmail && <p style={styles.footerLine}>✉️ {companyEmail}</p>}
                      <p style={{ ...styles.footerLine, marginTop: '16px', borderTop: '1px solid #374151', paddingTop: '12px' }}>
                        © {new Date().getFullYear()} {companyName}. Todos los derechos reservados.
                      </p>
                      <p style={{ ...styles.footerLine, fontSize: '10px', color: '#6b7280', marginTop: '8px' }}>
                        Correo de agradecimiento generado automáticamente al registrar el Check-Out el {new Date().toLocaleDateString('es-CL')} a las {new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} hrs.
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
    margin: '0 0 16px 0',
    color: '#111827',
  },
  text: {
    fontSize: '15px',
    lineHeight: '1.7',
    color: '#4b5563',
    margin: '0 0 16px 0',
  },
  card: {
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    padding: '20px 24px',
    margin: '24px 0',
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
    width: '40%',
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
  feedbackBox: {
    backgroundColor: '#fffbeb',
    border: '1px solid #fef3c7',
    borderRadius: '12px',
    padding: '20px 24px',
    margin: '24px 0',
  },
  socialLink: {
    color: '#b45309',
    textDecoration: 'underline',
    fontSize: '14px',
    fontWeight: 'bold',
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
    marginTop: '24px',
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
