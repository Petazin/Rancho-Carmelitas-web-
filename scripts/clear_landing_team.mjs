import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno manualmente desde .env.local sin requerir dotenv
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      envVars[key] = val;
    }
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan variables de entorno de Supabase en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearLandingTeam() {
  console.log('Consultando integrantes actuales en landing_team...');
  const { data, error } = await supabase
    .from('landing_team')
    .select('id, name, role');

  if (error) {
    console.error('Error consultando landing_team:', error);
    process.exit(1);
  }

  console.log(`Se encontraron ${data.length} integrantes en landing_team:`, data);

  if (data.length > 0) {
    console.log('Eliminando registros de prueba en landing_team...');
    for (const item of data) {
      const { error: delErr } = await supabase
        .from('landing_team')
        .delete()
        .eq('id', item.id);
      if (delErr) {
        console.error(`Error eliminando ${item.name}:`, delErr);
      } else {
        console.log(`- Eliminado: ${item.name} (${item.role})`);
      }
    }
    console.log('✓ Tabla landing_team vaciada con éxito. Ahora la sección quedará completamente oculta hasta que el administrador agregue integrantes reales.');
  } else {
    console.log('✓ La tabla landing_team ya se encuentra completamente vacía.');
  }
}

clearLandingTeam();
