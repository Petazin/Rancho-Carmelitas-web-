/**
 * Script de Clonación de Datos de Catálogo y Configuración (Prod -> Test)
 * Proyecto: Rancho Carmelitas
 * Autor: Antigravity AI
 * Descripción: Copia los registros esenciales (Cabañas, Plataformas de Venta, Settings,
 *              Ajustes de Landing y Galería pública) de Producción a Test de forma segura,
 *              leyendo dinámicamente de los archivos de variables locales .env.prod y .env.local
 *              para evitar subir claves en duro a GitHub.
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

console.log('✅ Clientes Supabase inicializados de forma segura:');
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
    .neq(idClave, '00000000-0000-0000-0000-000000000000'); // Delete general defensivo
    
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

    // 3. Clonar Perfiles públicos
    await clonarTabla('profiles');
    console.log('--------------------------------------------------');

    // 4. Clonar Configuraciones generales
    await clonarTabla('settings', 'key');
    console.log('--------------------------------------------------');

    // 5. Clonar Configuración de Landing
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
