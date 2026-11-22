const https = require('https');

const supabaseUrl = 'https://oggmpexsscquyfwlbcwo.supabase.co';
const anonKey = 'sb_publishable_eWeVW_yHZpTLwRB8Ii5k9Q_NyrF5dzJ';

console.log('====================================================================');
console.log('🛡️ AUDITORÍA DE SEGURIDAD: VERIFICADOR DE BLINDAJE RLS EN SUPABASE');
console.log('Proyecto: Rancho Carmelitas');
console.log('====================================================================\n');

// Helper para hacer peticiones HTTP nativas a la API de Supabase (PostgREST)
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = `${supabaseUrl}/rest/v1${path}`;
    const parsedUrl = new URL(url);

    const headers = {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: headers
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data ? JSON.parse(data) : null
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runAudit() {
  let passedTests = 0;
  let totalTests = 0;

  // ------------------------------------------------------------------
  // TEST 1: Verificar que la tabla privada 'profiles' está protegida
  // ------------------------------------------------------------------
  totalTests++;
  console.log('🧪 TEST 1: Intentando leer perfiles de equipo (profiles) de forma anónima...');
  try {
    const res = await makeRequest('GET', '/profiles?select=*');
    
    // Si RLS está activo y la política exige autenticación, un usuario anónimo 
    // debe recibir un array vacío [] (PostgreSQL filtra en silencio) o un error de permisos.
    if (res.statusCode === 200 && Array.isArray(res.data) && res.data.length === 0) {
      console.log('   ✅ BIEN: La base de datos denegó la lectura de perfiles privados (Retornó array vacío).');
      console.log('   🔒 Tabla "profiles" debidamente protegida.');
      passedTests++;
    } else if (res.statusCode === 401 || res.statusCode === 403) {
      console.log(`   ✅ BIEN: Solicitud rechazada por Supabase con código ${res.statusCode} (Acceso denegado).`);
      console.log('   🔒 Tabla "profiles" debidamente protegida.');
      passedTests++;
    } else {
      console.log('   ❌ ALERTA CRÍTICA: Se pudieron leer los perfiles privados de forma anónima desde internet.');
      console.log('   ⚠️ Datos expuestos:', JSON.stringify(res.data).substring(0, 150) + '...');
    }
  } catch (err) {
    console.error('   ❌ Error al ejecutar Test 1:', err.message);
  }
  console.log('');

  // ------------------------------------------------------------------
  // TEST 2: Verificar que la tabla pública 'cabins' está disponible para lectura
  // ------------------------------------------------------------------
  totalTests++;
  console.log('🧪 TEST 2: Intentando leer el catálogo de cabañas (cabins) de forma pública...');
  try {
    const res = await makeRequest('GET', '/cabins?select=id,name,price_per_night');
    if (res.statusCode === 200 && Array.isArray(res.data)) {
      console.log(`   ✅ BIEN: Catálogo de cabañas leído con éxito (${res.data.length} cabañas encontradas).`);
      console.log('   🌐 Lectura pública de cabañas funcionando correctamente (requerido para la Landing Page).');
      passedTests++;
    } else {
      console.log(`   ❌ ALERTA: Error al leer cabañas públicas. Código de estado: ${res.statusCode}`);
      console.log('   Detalles:', res.data);
    }
  } catch (err) {
    console.error('   ❌ Error al ejecutar Test 2:', err.message);
  }
  console.log('');

  // ------------------------------------------------------------------
  // TEST 3: Verificar que un anónimo NO puede insertar cabañas (escritura protegida)
  // ------------------------------------------------------------------
  totalTests++;
  console.log('🧪 TEST 3: Intentando inyectar/crear una cabaña de forma anónima...');
  try {
    const testCabin = {
      name: 'Cabaña Hacker Maliciosa',
      price_per_night: 999999,
      capacity: 10
    };
    const res = await makeRequest('POST', '/cabins', testCabin);
    
    // Si RLS está activo para INSERT, debe denegar con error de permisos (401, 403, 409 o similar)
    // o simplemente no insertar.
    if (res.statusCode === 201 || (res.statusCode >= 200 && res.statusCode < 300 && res.data)) {
      console.log('   ❌ ALERTA CRÍTICA DE ESCRITURA: ¡Se pudo insertar una cabaña falsa de forma anónima!');
      console.log('   Detalles de cabaña insertada:', res.data);
    } else {
      console.log(`   ✅ BIEN: Supabase denegó la inserción anónima con código ${res.statusCode}.`);
      console.log('   🔒 Tabla "cabins" protegida contra escritura externa no autorizada.');
      passedTests++;
    }
  } catch (err) {
    console.error('   ❌ Error al ejecutar Test 3:', err.message);
  }
  console.log('');

  // ------------------------------------------------------------------
  // TEST 4: Verificar que la tabla 'cabin_closures' permite lectura pública
  // ------------------------------------------------------------------
  totalTests++;
  console.log('🧪 TEST 4: Intentando leer bloqueos de cabañas (cabin_closures) de forma pública...');
  try {
    const res = await makeRequest('GET', '/cabin_closures?select=*');
    if (res.statusCode === 200 && Array.isArray(res.data)) {
      console.log(`   ✅ BIEN: Bloqueos y cierres leídos con éxito (${res.data.length} bloqueos encontrados).`);
      console.log('   🌐 Lectura pública de bloqueos operativa (requerido para bloquear calendarios del cliente).');
      passedTests++;
    } else {
      console.log(`   ❌ ALERTA: Error al leer bloqueos públicos. Código de estado: ${res.statusCode}`);
    }
  } catch (err) {
    console.error('   ❌ Error al ejecutar Test 4:', err.message);
  }
  console.log('\n====================================================================');
  console.log('📊 RESUMEN DE LA AUDITORÍA DE SEGURIDAD');
  console.log(`   Pruebas superadas: ${passedTests} de ${totalTests}`);
  console.log('====================================================================');

  if (passedTests === totalTests) {
    console.log('\n🛡️  ¡ENHORABUENA! El blindaje RLS de Supabase está 100% CORRECTO y activo.');
    console.log('   La base de datos de Rancho Carmelitas ahora es segura contra accesos no autorizados.');
  } else {
    console.log('\n⚠️  ADVERTENCIA: Aún existen brechas de seguridad que corregir en la base de datos.');
  }
  console.log('====================================================================');
}

runAudit();
