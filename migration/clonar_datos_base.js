/**
 * Script de Clonación de Datos de Catálogo y Configuración (Prod -> Test)
 * Proyecto: Rancho Carmelitas
 * Autor: Antigravity AI
 * Descripción: Copia los registros esenciales (Cabañas, Plataformas de Venta, Settings,
 *              Ajustes de Landing y Galería pública) de Producción a Test para
 *              habilitar el correcto funcionamiento de la web en el nuevo entorno.
 */

const fs = require('fs');
const path = require('path');

// 1. Cargar credenciales de Producción desde .env.local
console.log('🔄 Cargando variables de producción desde .env.local...');
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ Error: No se encontró el archivo .env.local.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const prodEnv = {};
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
    prodEnv[key] = value.trim();
  }
});

const prodUrl = prodEnv.NEXT_PUBLIC_SUPABASE_URL;
const prodServiceKey = prodEnv.SUPABASE_SERVICE_ROLE_KEY;

if (!prodUrl || !prodServiceKey) {
  console.error('❌ Error: No se encontraron las credenciales de Producción en .env.local.');
  process.exit(1);
}

// 2. Credenciales del nuevo proyecto de Test
const testUrl = 'https://cwoxuodcsfacvtojqjpz.supabase.co';
const testServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3b3h1b2Rjc2ZhY3Z0b2pxanB6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDUyMzA0MiwiZXhwIjoyMDk2MDk5MDQyfQ.4OJ1ct19P8toDfx-LFIcRSEdVAkf8SLUJ7TpjPU6kRo';

// 3. Inicializar Clientes de Supabase
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

console.log('✅ Clientes Supabase inicializados:');
console.log(`   PROD URL: ${prodUrl}`);
console.log(`   TEST URL: ${testUrl}\n`);

async function clonarTabla(nombreTabla, idClave = 'id') {
  console.log(`📥 Extrayendo datos de "${nombreTabla}" desde Producción...`);
  const { data: prodData, error: prodError } = await supabaseProd
    .from(nombreTabla)
    .select('*');

  if (prodError) {
    console.error(`❌ Error al leer la tabla "${nombreTabla}" de Prod:`, prodError.message);
    return;
  }

  console.log(`   Total registros leídos: ${prodData.length}`);

  if (prodData.length === 0) {
    console.log(`   [Ignorado] No hay registros en "${nombreTabla}".`);
    return;
  }

  console.log(`📤 Insertando datos en "${nombreTabla}" de Test...`);
  
  // Limpiar la tabla de Test primero para evitar duplicidad o conflictos de PK en carga limpia
  const { error: deleteError } = await supabaseTest
    .from(nombreTabla)
    .delete()
    .neq(idClave, '00000000-0000-0000-0000-000000000000'); // Delete general defensivo para cualquier ID
    
  if (deleteError) {
    console.warn(`   ⚠️ Alerta al limpiar la tabla "${nombreTabla}" de Test:`, deleteError.message);
  }

  const { error: insertError } = await supabaseTest
    .from(nombreTabla)
    .insert(prodData);

  if (insertError) {
    console.error(`❌ Error al insertar datos en "${nombreTabla}" de Test:`, insertError.message);
  } else {
    console.log(`   [ÉXITO] Tabla "${nombreTabla}" clonada correctamente.`);
  }
}

async function clonarLandingSettings() {
  console.log('📥 Extrayendo landing_settings desde Producción...');
  const { data: prodData, error: prodError } = await supabaseProd
    .from('landing_settings')
    .select('*')
    .single();

  if (prodError) {
    console.error('❌ Error al leer landing_settings de Prod:', prodError.message);
    return;
  }

  console.log('📤 Insertando landing_settings en Test...');
  const { error: insertError } = await supabaseTest
    .from('landing_settings')
    .upsert(prodData);

  if (insertError) {
    console.error('❌ Error al insertar landing_settings en Test:', insertError.message);
  } else {
    console.log('   [ÉXITO] Tabla "landing_settings" clonada correctamente.');
  }
}

async function main() {
  try {
    console.log('==================================================');
    // 1. Clonar Cabañas (imprescindible)
    await clonarTabla('cabins');
    console.log('--------------------------------------------------');

    // 2. Clonar Canales de venta (imprescindible)
    await clonarTabla('plataformas');
    console.log('--------------------------------------------------');

    // 3. Clonar Perfiles públicos (necesario para auditorías locales)
    await clonarTabla('profiles');
    console.log('--------------------------------------------------');

    // 4. Clonar Configuraciones generales (comisiones predeterminadas, WhatsApp)
    await clonarTabla('settings', 'key');
    console.log('--------------------------------------------------');

    // 5. Clonar Configuración de Landing (Hero Banner y logotipo)
    await clonarLandingSettings();
    console.log('--------------------------------------------------');

    // 6. Clonar Galería de Momentos pública
    await clonarTabla('landing_gallery');
    console.log('==================================================');

    console.log('🏁 PROCESO DE CLONACIÓN DE DATOS BASE FINALIZADO CON ÉXITO');
    console.log('Tu entorno de Test está listo para ser utilizado de forma segura.');
  } catch (err) {
    console.error('❌ Ocurrió un error catastrófico en la clonación:', err);
  }
}

main();
