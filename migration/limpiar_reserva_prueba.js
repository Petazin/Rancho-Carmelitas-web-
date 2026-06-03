const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Leer y parsear el archivo .env.local en la raíz
const envPath = path.join(__dirname, '../.env.local');
if (!fs.existsSync(envPath)) {
  console.error('Error: No se encuentra el archivo .env.local');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      env[key] = value;
    }
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configurados en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const bookingId = '01032258-c75a-4842-8fa6-f176d61c9110';

async function main() {
  console.log(`Iniciando limpieza de la reserva de prueba con ID: ${bookingId}\n`);

  // 1. Eliminar pagos relacionados en booking_payments
  const { data: payData, error: payError } = await supabase
    .from('booking_payments')
    .delete()
    .eq('booking_id', bookingId)
    .select();
  
  if (payError) {
    console.error('Error al eliminar de booking_payments:', payError.message);
  } else {
    console.log(`[OK] Pagos eliminados de booking_payments: ${payData ? payData.length : 0} registros.`);
  }

  // 2. Eliminar la reserva en bookings
  const { data: bookData, error: bookError } = await supabase
    .from('bookings')
    .delete()
    .eq('id', bookingId)
    .select();

  if (bookError) {
    console.error('Error al eliminar de bookings:', bookError.message);
  } else {
    console.log(`[OK] Reserva eliminada de bookings: ${bookData ? bookData.length : 0} registros.`);
  }

  // 3. Eliminar la bitácora de auditoría histórica en audit_logs asociada a este ID
  const { data: auditData, error: auditError } = await supabase
    .from('audit_logs')
    .delete()
    .eq('record_id', bookingId)
    .select();

  if (auditError) {
    console.error('Error al eliminar de audit_logs:', auditError.message);
  } else {
    console.log(`[OK] Registros eliminados de audit_logs: ${auditData ? auditData.length : 0} registros.`);
  }

  console.log('\nLimpieza completada de forma definitiva.');
}

main();
