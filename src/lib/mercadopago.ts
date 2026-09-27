import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

// Inicializar cliente oficial de Mercado Pago con el Access Token
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  options: {
    timeout: 7000,
  }
});

export const mpPreference = new Preference(client);
export const mpPayment = new Payment(client);
export default client;
