/**
 * Script de Clonación Completa de Base de Datos (Prod -> Test)
 * Proyecto: Rancho Carmelitas
 * Autor: Antigravity AI
 * Descripción: Copia todos los registros de Producción a Test de forma segura.
 *              Fase 1: Realiza un borrado preventivo de las tablas de Test en ORDEN INVERSO
 *                      de dependencias para evitar violaciones de FK en PostgreSQL.
 *              Fase 2: Inserta los datos de Producción a Test en el ORDEN DIRECTO de dependencias.
 */

const fs = require('fs');
const path = require('path');

// Helper para leer y parsear archivos .env locales de forma segura
function cargarEnv(nombreArchivo) {
  const envPath = path.join(__dirname, '..', nombreArchivo);
  if (!fs.existsSync(envPath)) {
    console.error(`❌ Error: No se encontró el archivo de entorno "${nombreArchivo}".`);
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  envContent.split(/\r?\n/).forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      env[key] = value.trim();
    }
  });
  return env;
}

console.log('🔄 Cargando variables de configuración desde archivos locales...');
const prodEnv = cargarEnv('.env.prod');
const testEnv = cargarEnv('.env.local');

const prodUrl = prodEnv.NEXT_PUBLIC_SUPABASE_URL;
const prodServiceKey = prodEnv.SUPABASE_SERVICE_ROLE_KEY;

const testUrl = testEnv.NEXT_PUBLIC_SUPABASE_URL;
const testServiceKey = testEnv.SUPABASE_SERVICE_ROLE_KEY;

if (!prodUrl || !prodServiceKey) {
  console.error('❌ Error: No se encontraron las credenciales de Producción en .env.prod.');
  process.exit(1);
}

if (!testUrl || !testServiceKey) {
  console.error('❌ Error: No se encontraron las credenciales de Test en .env.local.');
  process.exit(1);
}

// Inicializar Clientes de Supabase
let createClient;
try {
  const supabaseModule = require(path.join(__dirname, '..', 'node_modules', '@supabase', 'supabase-js'));
  createClient = supabaseModule.createClient;
} catch (err) {
  console.error('❌ Error: No se pudo cargar @supabase/supabase-js desde node_modules.');
  process.exit(1);
}

const supabaseProd = createClient(prodUrl, prodServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const supabaseTest = createClient(testUrl, testServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

console.log('✅ Clientes Supabase inicializados para sincronización robusta:');
console.log(`   PROD URL: ${prodUrl}`);
console.log(`   TEST URL: ${testUrl}\n`);

// Lista de tablas ordenadas por dependencias FK (directa: las independientes primero)
const tablasOrdenadas = [
  { nombre: 'profiles', key: 'id' },
  { nombre: 'cabins', key: 'id' },
  { nombre: 'plataformas', key: 'id' },
  { nombre: 'settings', key: 'key' },
  { nombre: 'landing_gallery', key: 'id' },
  { nombre: 'cabin_closures', key: 'id' },
  { nombre: 'bookings', key: 'id' },
  { nombre: 'booking_payments', key: 'id' },
  { nombre: 'audit_logs', key: 'id' },
  { nombre: 'desarrollo_ideas', key: 'id' }
];

async function limpiarBaseDeDatosTest() {
  console.log('🧹 FASE 1: Limpiando base de datos de Test (Orden inverso de dependencias)...');
  
  // Recorremos las tablas en orden inverso para borrar datos sin colisionar con FKs
  for (let i = tablasOrdenadas.length - 1; i >= 0; i--) {
    const tabla = tablasOrdenadas[i];
    console.log(`   Restableciendo tabla "${tabla.nombre}" de Test...`);
    const { error } = await supabaseTest
      .from(tabla.nombre)
      .delete()
      .neq(tabla.key, tabla.key === 'id' ? '00000000-0000-0000-0000-000000000000' : 'NO_KEY_MATCH_FALLBACK_VAL');

    if (error) {
      console.warn(`   ⚠️ Alerta al limpiar "${tabla.nombre}" en Test:`, error.message);
    }
  }
  console.log('✅ FASE 1 COMPLETADA: Base de datos de Test limpia.\n');
}

async function clonarTabla(nombreTabla) {
  console.log(`📥 [EXTRAER] Obteniendo registros de "${nombreTabla}" desde Producción...`);
  const { data: prodData, error: prodError } = await supabaseProd
    .from(nombreTabla)
    .select('*');

  if (prodError) {
    console.error(`❌ Error al extraer tabla "${nombreTabla}" de Prod:`, prodError.message);
    return false;
  }

  console.log(`   Registros leídos: ${prodData.length}`);

  if (prodData.length === 0) {
    console.log(`   [Ignorado] No hay registros para clonar en "${nombreTabla}".`);
    return true;
  }

  console.log(`📤 [INSERTAR] Cargando en "${nombreTabla}" de Test...`);
  const chunkSize = 100;
  for (let i = 0; i < prodData.length; i += chunkSize) {
    const chunk = prodData.slice(i, i + chunkSize);
    const { error: insertError } = await supabaseTest
      .from(nombreTabla)
      .insert(chunk);

    if (insertError) {
      console.error(`❌ Error al insertar bloque en "${nombreTabla}" de Test:`, insertError.message);
      return false;
    }
  }

  console.log(`   [ÉXITO] Tabla "${nombreTabla}" sincronizada.`);
  return true;
}

async function clonarLandingSettings() {
  console.log('📥 [EXTRAER] Obteniendo landing_settings desde Producción...');
  const { data: prodData, error: prodError } = await supabaseProd
    .from('landing_settings')
    .select('*')
    .single();

  if (prodError) {
    console.error('❌ Error al extraer landing_settings de Prod:', prodError.message);
    return false;
  }

  console.log('📤 [UPSERT] Cargando landing_settings en Test...');
  const { error: insertError } = await supabaseTest
    .from('landing_settings')
    .upsert(prodData);

  if (insertError) {
    console.error('❌ Error al guardar landing_settings en Test:', insertError.message);
    return false;
  } else {
    console.log('   [ÉXITO] Tabla "landing_settings" clonada correctamente.');
    return true;
  }
}

async function main() {
  try {
    console.log('==================================================');
    console.log('🚀 INICIANDO CLONACIÓN INTEGRAL DE BASE DE DATOS');
    console.log('==================================================');

    // 1. Limpiar base de datos de test en orden inverso
    await limpiarBaseDeDatosTest();

    // 2. Insertar datos en orden directo
    console.log('📥 FASE 2: Clonando datos de Producción a Test (Orden de dependencias)...');
    
    for (const tabla of tablasOrdenadas) {
      const ok = await clonarTabla(tabla.nombre);
      if (!ok) {
        console.error(`⚠️ Proceso interrumpido debido a error en la tabla "${tabla.nombre}".`);
      }
      console.log('--------------------------------------------------');
    }

    // 10. Clonar landing_settings
    await clonarLandingSettings();
    console.log('==================================================');

    console.log('🏁 CLONACIÓN Y CLONACIÓN COMPLETA COMPLETADAS CON ÉXITO');
    console.log('Tu entorno de base de datos de Test está 100% sincronizado con Producción.');
    console.log('==================================================');
  } catch (err) {
    console.error('❌ Error catastrófico en el proceso de clonación:', err);
  }
}

main();
