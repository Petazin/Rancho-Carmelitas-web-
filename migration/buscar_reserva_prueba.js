const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Leer y parsear el archivo .env.local
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

console.log('URL de Supabase:', supabaseUrl);
console.log('Service Role Key (primeros 20 caracteres):', serviceRoleKey ? serviceRoleKey.slice(0, 20) + '...' : 'No disponible');

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  console.log('\n--- Buscando reservas con nombre "test" ---');
  const { data: bookings, error: bookError } = await supabase
    .from('bookings')
    .select('id, guest_name, guest_email, check_in, check_out');

  if (bookError) {
    console.error('Error al consultar bookings:', bookError.message);
  } else {
    console.log(`Total de reservas encontradas en la tabla: ${bookings.length}`);
    const testBookings = bookings.filter(b => b.guest_name.toLowerCase().includes('test'));
    console.log('Reservas que contienen "test" en el nombre:', testBookings);
  }
}

main();
