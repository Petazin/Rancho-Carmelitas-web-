/**
 * Script para inicializar el Administrador en el ambiente de Test (Supabase Auth y Profiles)
 * Proyecto: Rancho Carmelitas
 * Autor: Antigravity AI
 * Descripción: Crea el usuario administrador de pruebas en el Supabase Auth de Test
 *              de forma auto-confirmada (sin requerir validar correo) y vincula su perfil
 *              en la tabla pública profiles con el rol 'admin'.
 */

const fs = require('fs');
const path = require('path');

// 1. Cargar credenciales del ambiente de Test desde .env.local
console.log('🔄 Cargando variables de Test desde .env.local...');
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ Error: No se encontró el archivo .env.local.');
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

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: No se encontraron las credenciales de Test en .env.local.');
  process.exit(1);
}

// 2. Cargar cliente de Supabase
let createClient;
try {
  const supabaseModule = require(path.join(__dirname, '..', 'node_modules', '@supabase', 'supabase-js'));
  createClient = supabaseModule.createClient;
} catch (err) {
  console.error('❌ Error: No se pudo cargar @supabase/supabase-js desde node_modules.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const adminEmail = 'claudio.milanolo@gmail.com';
const adminPassword = 'RanchoTest123*'; // Clave exclusiva para el entorno de pruebas
const adminName = 'Claudio Milanolo';

async function main() {
  console.log(`🚀 Creando administrador de pruebas: ${adminEmail}...`);

  try {
    // A. Eliminar perfil de test clonado con el ID viejo de producción para evitar conflictos de correo/ID
    console.log('🧹 Limpiando perfiles de test previos para este correo...');
    await supabase
      .from('profiles')
      .delete()
      .eq('email', adminEmail);

    // B. Crear el usuario en Supabase Auth de Test (con privilegios de admin)
    console.log('👤 Creando usuario en Supabase Auth de Test...');
    const { data: userData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Auto-confirmar el usuario para saltar la validación de correo
      user_metadata: {
        full_name: adminName,
        role: 'admin'
      }
    });

    if (authError) {
      // Si el usuario ya existe en Auth, intentar obtener su ID
      if (authError.message.includes('already registered') || authError.message.includes('already exists') || authError.status === 422) {
        console.log('   [INFO] El usuario ya existe en Auth de Test. Vinculando perfil...');
        const { data: usersList } = await supabase.auth.admin.listUsers();
        const existingUser = usersList?.users?.find(u => u.email === adminEmail);
        
        if (existingUser) {
          await registrarPerfil(existingUser.id);
          return;
        }
      }
      throw authError;
    }

    if (userData?.user) {
      console.log(`   [OK] Usuario Auth creado con UUID: ${userData.user.id}`);
      await registrarPerfil(userData.user.id);
    }

  } catch (error) {
    console.error('❌ Error al crear el administrador de Test:', error.message);
  }
}

async function registrarPerfil(userId) {
  console.log('📝 Vinculando perfil de Administrador en la tabla "profiles" de Test...');
  
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      full_name: adminName,
      email: adminEmail,
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  if (profileError) {
    console.error('❌ Error al crear el perfil en la tabla profiles:', profileError.message);
  } else {
    console.log('\n==================================================');
    console.log('🎉 ADMINISTRADOR DE TEST CONFIGURADO CON ÉXITO');
    console.log('==================================================');
    console.log(`📧 Correo:     ${adminEmail}`);
    console.log(`🔑 Contraseña: ${adminPassword}`);
    console.log('==================================================');
    console.log('Ya puedes iniciar sesión localmente con estas credenciales.');
  }
}

main();
