const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Leer variables de .env.prod de forma segura sin depender de dotenv
const envPath = path.join(__dirname, '../.env.prod');
if (!fs.existsSync(envPath)) {
  console.error('❌ Error: No se encontró el archivo .env.prod en la raíz del proyecto.');
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
  console.error('❌ Error: Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.prod');
  process.exit(1);
}

console.log('🔍 Conectando con Supabase de PRODUCCIÓN...');
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

async function main() {
  try {
    // 1. Consultar esquema OpenAPI de PostgREST para averiguar el tipo de confirmed_by en bookings
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
      console.log(`✅ Columna "confirmed_by" encontrada en la definición de "bookings" de Producción.`);
      console.log(`   - Tipo de dato en OpenAPI: "${prop.type}"`);
      console.log(`   - Formato / Tipo SQL: "${prop.format || 'No especificado'}"`);
      if (prop.description) {
        console.log(`   - Descripción: ${prop.description}`);
      }
    } else {
      console.log('⚠️ No se encontró la columna "confirmed_by" en bookings o la definición OpenAPI está limitada.');
      // Fallback: consultar un registro y ver qué tipo de dato tiene
      const { data: testData, error: testError } = await supabase
        .from('bookings')
        .select('guest_name, confirmed_by')
        .neq('confirmed_by', null)
        .limit(1);
      
      if (testError) {
        console.error('Error al realizar consulta fallback:', testError);
      } else if (testData && testData.length > 0) {
        console.log('💡 Registro de prueba encontrado. Valor de confirmed_by:', typeof testData[0].confirmed_by, `("${testData[0].confirmed_by}")`);
      } else {
        console.log('💡 No hay registros con confirmed_by no nulo en la base de datos de producción.');
      }
    }

    // 2. Consultar buckets de Storage en Producción
    console.log('\n--- 2. Verificando Buckets de Storage en Producción ---');
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
    
    if (storageError) {
      console.error('❌ Error al listar buckets de storage:', storageError);
    } else {
      console.log(`✅ Se encontraron ${buckets.length} buckets de Storage en Producción:`);
      buckets.forEach(b => {
        console.log(`   - Nombre: "${b.name}" | Público: ${b.public ? 'Sí' : 'No'}`);
      });
      
      const hasReceiptsBucket = buckets.some(b => b.name === 'payment-receipts');
      if (hasReceiptsBucket) {
        console.log('\n🎉 Confirmado: El bucket "payment-receipts" YA existe en Producción.');
      } else {
        console.log('\n⚠️ Alerta: El bucket "payment-receipts" NO existe en Producción.');
      }
    }
  } catch (err) {
    console.error('❌ Ocurrió un error inesperado durante el diagnóstico:', err);
  }
}

main();
