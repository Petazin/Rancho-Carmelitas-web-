import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface CancelationEmailProps {
  guestName: string;
  cabinName: string;
  checkIn: string;
  checkOut: string;
  reasonType: 'no_payment' | 'conflict' | 'other';
  bookingId: string;
}

export const CancelationEmailTemplate = ({
  guestName,
  cabinName,
  checkIn,
  checkOut,
  reasonType,
  bookingId,
}: CancelationEmailProps) => {
  let previewText = 'Notificación de Cancelación de Reserva - Rancho Carmelitas';
  let title = 'Actualización de tu Reserva';
  let messageContent = '';

  if (reasonType === 'no_payment') {
    previewText = 'Reserva Liberada por Falta de Abono - Rancho Carmelitas';
    title = 'Plazo de Reserva Expirado';
    messageContent = `Lamentablemente, tu reserva para la cabaña ${cabinName} ha sido liberada debido a que no recibimos la confirmación del abono del 50% en el plazo establecido de 24 horas. Las fechas han sido liberadas en nuestro sistema. Si aún deseas alojarte con nosotros, por favor contáctanos de inmediato para verificar la disponibilidad actual.`;
  } else if (reasonType === 'conflict') {
    previewText = 'Reubicación y Ajuste de Reserva - Rancho Carmelitas';
    title = 'Aviso de Reubicación / Conflicto de Fechas';
    messageContent = `Te contactamos para informarte que hemos detectado un conflicto de fechas en nuestro sistema para tu solicitud de reserva en la cabaña ${cabinName}. Con el fin de ofrecerte la mejor atención, te ofrecemos una reasignación alternativa de cabaña premium o un ajuste de las fechas de tu estadía con un beneficio exclusivo. Nuestro administrador se comunicará contigo a la brevedad por teléfono o WhatsApp para coordinar la mejor solución.`;
  } else {
    previewText = 'Cancelación de Reserva - Rancho Carmelitas';
    title = 'Reserva Cancelada';
    messageContent = `Te informamos que tu reserva para la cabaña ${cabinName} ha sido cancelada. Si consideras que esto es un error o deseas realizar una nueva reserva, por favor no dudes en comunicarte directamente con nuestra administración.`;
  }

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>Rancho Carmelitas</Heading>
          </Section>
          
          <Section style={content}>
            <Heading style={h1}>Estimado(a) {guestName},</Heading>
            <Heading style={subtitle}>{title}</Heading>
            <Text style={p}>
              {messageContent}
            </Text>

            <Section style={card}>
              <Text style={cardTitle}>Detalles de la Reserva Cancelada</Text>
              <Text style={cardItem}><strong>Cabaña:</strong> {cabinName}</Text>
              <Text style={cardItem}><strong>Check-in:</strong> {checkIn}</Text>
              <Text style={cardItem}><strong>Check-out:</strong> {checkOut}</Text>
            </Section>

            <Text style={contactBox}>
              📞 Si deseas comunicarte con nosotros de inmediato, puedes responder a este correo o escribirnos a nuestro WhatsApp de atención.
            </Text>

            <Hr style={hr} />
            <Text style={footer}>
              ID de Referencia: {bookingId}<br />
              Rancho Carmelitas © {new Date().getFullYear()}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Estilos inline de alta compatibilidad (Consistentes con ConfirmationTemplate)
const main = {
  backgroundColor: '#f9fafb',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  width: '580px',
};

const header = {
  backgroundColor: '#ef4444', // Rojo elegante para cancelación
  padding: '30px',
  borderRadius: '24px 24px 0 0',
  textAlign: 'center' as const,
};

const logo = {
  color: '#ffffff',
  margin: '0',
  fontSize: '24px',
};

const content = {
  backgroundColor: '#ffffff',
  padding: '40px',
  borderRadius: '0 0 24px 24px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
};

const h1 = {
  color: '#111827',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 8px',
};

const subtitle = {
  color: '#dc2626', // Rojo
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px',
};

const p = {
  color: '#4b5563',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 20px',
};

const card = {
  backgroundColor: '#f3f4f6',
  borderRadius: '16px',
  padding: '24px',
  margin: '24px 0',
};

const cardTitle = {
  fontSize: '11px',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  color: '#6b7280',
  margin: '0 0 12px 0',
  letterSpacing: '0.05em',
};

const cardItem = {
  fontSize: '14px',
  margin: '8px 0',
  color: '#374151',
};

const contactBox = {
  fontSize: '13px',
  color: '#1e293b',
  backgroundColor: '#f8fafc',
  padding: '16px',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  lineHeight: '1.5',
  margin: '20px 0',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  textAlign: 'center' as const,
};
