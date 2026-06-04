const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Leer variables de .env.local
const envPath = path.join(__dirname, '../.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ Error: No se encontró el archivo .env.local en la raíz del proyecto.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const parts = line.trim().split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim();
    envVars[key] = value;
  }
});

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const serviceRoleKey = envVars['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

console.log('🔍 Conectando con Supabase de TEST...');
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

async function main() {
  try {
    // 1. Consultar esquema OpenAPI
    console.log('\n--- 1. Analizando Tipo de la Columna "confirmed_by" ---');
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error HTTP al consultar OpenAPI: ${response.statusText}`);
    }
    
    const openapi = await response.json();
    const bookingsDef = openapi.definitions && openapi.definitions.bookings;
    
    if (bookingsDef && bookingsDef.properties && bookingsDef.properties.confirmed_by) {
      const prop = bookingsDef.properties.confirmed_by;
      console.log(`✅ Columna "confirmed_by" encontrada en la definición de "bookings" de Test.`);
      console.log(`   - Tipo de dato en OpenAPI: "${prop.type}"`);
      console.log(`   - Formato / Tipo SQL: "${prop.format || 'No especificado'}"`);
    } else {
      console.log('⚠️ No se encontró la columna "confirmed_by" en bookings o la definición OpenAPI está limitada.');
    }

    // 2. Ejecutar consulta para auditar llaves foráneas o detalles de la columna via query directo si es posible
    // Dado que no podemos hacer SQL directo, consultaremos si podemos ver la info mediante el endpoint
    console.log('\n--- 2. Verificando Buckets de Storage en Test ---');
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
    
    if (storageError) {
      console.error('❌ Error al listar buckets de storage en Test:', storageError);
    } else {
      console.log(`✅ Se encontraron ${buckets.length} buckets de Storage en Test:`);
      buckets.forEach(b => {
        console.log(`   - Nombre: "${b.name}" | Público: ${b.public ? 'Sí' : 'No'}`);
      });
    }
  } catch (err) {
    console.error('❌ Ocurrió un error inesperado durante el diagnóstico:', err);
  }
}

main();
