const http = require('http');

const postData = JSON.stringify({
  guestName: 'test1',
  guestEmail: 'rancho.carmelitas.6@gmail.com', // Enviarlo a un correo controlado
  cabinName: 'Cabaña1: La Casona',
  checkIn: '09 jun 2026',
  checkOut: '12 jun 2026',
  totalPrice: 249900,
  discountApplied: 0,
  extraGuestsCost: 0,
  paymentAmount: 0, // Simulamos 0 en el body
  paymentReference: 'N/A',
  adults: 1,
  children: 0,
  bookingId: '2951b534-d63b-477e-8bc4-2ac969ca464a' // El ID de la reserva de prueba
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/send-payment-confirmation',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Enviando petición POST a la API local...');
const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Respuesta recibida:');
    try {
      console.log(JSON.stringify(JSON.parse(data), null, 2));
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Error en la petición: ${e.message}`);
});

req.write(postData);
req.end();
