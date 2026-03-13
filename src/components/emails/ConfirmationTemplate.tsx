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

interface ConfirmationEmailProps {
  guestName: string;
  cabinName: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  bookingId: string;
}

export const ConfirmationEmailTemplate = ({
  guestName,
  cabinName,
  checkIn,
  checkOut,
  totalPrice,
  bookingId,
}: ConfirmationEmailProps) => {
  const abono = totalPrice * 0.5;

  return (
    <Html>
      <Head />
      <Preview>Confirmación de Reserva - Rancho Carmelitas</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>Rancho Carmelitas</Heading>
          </Section>
          
          <Section style={content}>
            <Heading style={h1}>¡Gracias por tu reserva, {guestName}!</Heading>
            <Text style={p}>
              Hemos recibido tu solicitud de reserva para la <strong>{cabinName}</strong>. 
              A continuación encontrarás los detalles y los pasos para confirmar tu estancia.
            </Text>

            <Section style={card}>
              <Text style={cardTitle}>Resumen de la Estancia</Text>
              <Text style={cardItem}><strong>Check-in:</strong> {checkIn}</Text>
              <Text style={cardItem}><strong>Check-out:</strong> {checkOut}</Text>
              <Hr style={hr} />
              <div style={flexBetween}>
                <Text style={totalLabel}>Total Reserva:</Text>
                <Text style={totalValue}>${totalPrice.toLocaleString()}</Text>
              </div>
            </Section>

            <Section style={paymentBox}>
              <Text style={paymentTitle}>Pago del Abono (50%)</Text>
              <Text style={paymentAmount}>${abono.toLocaleString()}</Text>
              <Text style={paymentHint}>
                Nos pondremos en contacto contigo a la brevedad para enviarte los datos de transferencia y confirmar formalmente tu reserva.
              </Text>
            </Section>

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

// Estilos inline de alta compatibilidad
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
  backgroundColor: '#11d442',
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
  fontSize: '22px',
  fontWeight: 'bold',
  margin: '0 0 16px',
};

const p = {
  color: '#4b5563',
  fontSize: '16px',
  lineHeight: '1.6',
};

const card = {
  backgroundColor: '#f3f4f6',
  borderRadius: '16px',
  padding: '24px',
  margin: '24px 0',
};

const cardTitle = {
  fontSize: '12px',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  color: '#6b7280',
  margin: '0 0 12px 0',
};

const cardItem = {
  fontSize: '14px',
  margin: '8px 0',
  color: '#374151',
};

const flexBetween = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const totalLabel = {
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0',
};

const totalValue = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#11d442',
  margin: '0',
};

const paymentBox = {
  border: '2px dashed #11d442',
  borderRadius: '16px',
  padding: '24px',
  backgroundColor: '#f0fdf4',
  textAlign: 'center' as const,
};

const paymentTitle = {
  color: '#11d442',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 8px',
};

const paymentAmount = {
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 8px',
};

const paymentHint = {
  fontSize: '12px',
  color: '#166534',
  margin: '0',
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
