const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Leer archivo .env.local manualmente para evitar la dependencia 'dotenv'
let supabaseUrl = '';
let supabaseKey = '';

try {
  const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf-8');
  const lines = envContent.split('\n');
  lines.forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      // Quitar comillas si las hay
      if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
        value = value.substring(1, value.length - 1);
      }
      if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = value.trim();
      if (key === 'SUPABASE_SERVICE_ROLE_KEY') supabaseKey = value.trim();
      if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY' && !supabaseKey) supabaseKey = value.trim();
    }
  });
} catch (e) {
  console.error('Error al leer .env.local:', e.message);
}

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Faltan variables de entorno de Supabase.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBooking() {
  console.log('🔍 Conectando con Supabase de TEST para buscar reservas...');
  
  // Buscar todas las reservas para ver cuál coincide
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, guest_name, status, total_price, payment_amount, payment_reference');
    
  if (bookingsError) {
    console.error('Error al consultar bookings:', bookingsError);
    return;
  }
  
  console.log(`\nSe encontraron ${bookings.length} reservas en total.`);
  bookings.forEach(b => {
    console.log(`- ID: ${b.id} | Nombre: ${b.guest_name} | Estado: ${b.status} | Total: ${b.total_price} | Payment_Amount Col: ${b.payment_amount}`);
  });
  
  // Consultar la tabla booking_payments completa para ver qué abonos existen
  const { data: payments, error: paymentsError } = await supabase
    .from('booking_payments')
    .select('*');
    
  if (paymentsError) {
    console.error('Error al consultar booking_payments:', paymentsError);
    return;
  }
  
  console.log(`\nSe encontraron ${payments.length} abonos en total en la tabla booking_payments:`);
  payments.forEach(p => {
    console.log(`- Booking_ID: ${p.booking_id} | Monto: ${p.amount} | Ref: ${p.reference} | Método: ${p.payment_method}`);
  });
}

checkBooking();
