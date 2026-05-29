/**
 * Script de Carga Masiva e Importación de Datos Históricos
 * Proyecto: Rancho Carmelitas
 * Autor: Antigravity AI
 * Descripción: Importa reservas históricas, cabañas y canales de venta desde un archivo CSV
 *              delimitado por punto y coma (;) a la base de datos Supabase.
 */

const fs = require('fs');
const path = require('path');

// 1. Carga manual de variables de entorno de .env.local para evitar dependencias
console.log('🔄 Cargando variables de entorno desde .env.local...');
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      // Limpiar comillas
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value.trim();
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: No se encontraron las credenciales de Supabase en .env.local.');
  console.error('Asegúrate de que NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY estén definidas.');
  process.exit(1);
}

// 2. Cargar Supabase usando la librería del proyecto
let createClient;
try {
  // Intentar cargar desde node_modules local
  const supabaseModule = require(path.join(__dirname, '..', 'node_modules', '@supabase', 'supabase-js'));
  createClient = supabaseModule.createClient;
} catch (err) {
  console.error('❌ Error: No se pudo cargar @supabase/supabase-js desde node_modules.');
  console.error('Por favor, asegúrate de que has ejecutado "npm install" en el proyecto.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

console.log('✅ Cliente Supabase administrativo inicializado correctamente.');

// Helper para dar formato a RUT chileno
function formatRut(rut) {
  if (!rut) return '';
  let clean = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length === 0) return '';
  clean = clean.slice(0, 9);
  if (clean.length === 1) return clean;
  const dv = clean.slice(-1);
  const body = clean.slice(0, -1);
  let formattedBody = '';
  if (body.length > 6) {
    formattedBody = body.replace(/^(\d{1,2})(\d{3})(\d{3})$/, '$1.$2.$3');
  } else if (body.length > 3) {
    formattedBody = body.replace(/^(\d{1,3})(\d{3})$/, '$1.$2');
  } else {
    formattedBody = body;
  }
  return `${formattedBody}-${dv}`;
}

// Helper para parsear y normalizar fechas (admite YYYY-MM-DD, DD/MM/YYYY y DD-MM-YYYY)
function parseAndNormalizeDate(dateStr) {
  if (!dateStr) return null;
  const clean = dateStr.trim();
  
  // Caso YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }
  
  // Caso DD/MM/YYYY o DD-MM-YYYY
  const parts = clean.split(/[-/]/);
  if (parts.length === 3) {
    // Si la parte 0 tiene 4 dígitos, es YYYY-MM-DD con guiones/barras alternativos
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    // Si no, asumimos DD/MM/YYYY
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  
  return null;
}

// Helper para parsear enteros de dinero (ej. 70.000 -> 70000, 70000 -> 70000)
function parseMoney(value) {
  if (!value) return 0;
  if (typeof value === 'number') return Math.round(value);
  const clean = value.replace(/[^0-9-]/g, '');
  return parseInt(clean, 10) || 0;
}

// Cachés en memoria para optimizar y evitar consultas repetidas
const cabinsCache = {};
const platformsCache = {};

async function resolveCabin(cabinName) {
  const name = cabinName.trim();
  if (cabinsCache[name]) return cabinsCache[name];

  // Buscar cabaña
  const { data: cabin, error } = await supabase
    .from('cabins')
    .select('id')
    .eq('name', name)
    .maybeSingle();

  if (error) {
    throw new Error(`Error al buscar la cabaña "${name}": ${error.message}`);
  }

  if (cabin) {
    cabinsCache[name] = cabin.id;
    return cabin.id;
  }

  // Si no existe, la creamos dinámicamente con datos base para no fallar
  console.log(`🏠 La cabaña "${name}" no existe. Creándola dinámicamente...`);
  const { data: newCabin, error: createError } = await supabase
    .from('cabins')
    .insert({
      name: name,
      description: 'Cabaña creada automáticamente mediante importación de historial',
      capacity: 4,
      price_per_night: 80000,
      extra_person_price: 15000,
      max_extra_persons: 2,
      is_active: true,
      housekeeping_status: 'Disponible'
    })
    .select('id')
    .single();

  if (createError) {
    throw new Error(`Error al crear la cabaña "${name}": ${createError.message}`);
  }

  cabinsCache[name] = newCabin.id;
  return newCabin.id;
}

async function resolvePlatform(platformName) {
  const name = platformName ? platformName.trim() : 'Directo';
  if (platformsCache[name]) return platformsCache[name];

  // Buscar plataforma
  const { data: platform, error } = await supabase
    .from('plataformas')
    .select('id')
    .eq('nombre', name)
    .maybeSingle();

  if (error) {
    throw new Error(`Error al buscar el canal "${name}": ${error.message}`);
  }

  if (platform) {
    platformsCache[name] = platform.id;
    return platform.id;
  }

  // Si no existe, la creamos
  console.log(`🔌 El canal "${name}" no existe. Creándolo dinámicamente...`);
  // Comisiones estándar según canal
  let commission = 0;
  if (name.toLowerCase().includes('booking')) commission = 15;
  if (name.toLowerCase().includes('airbnb')) commission = 15;

  const { data: newPlatform, error: createError } = await supabase
    .from('plataformas')
    .insert({
      nombre: name,
      comision_porcentaje: commission,
      is_active: true
    })
    .select('id')
    .single();

  if (createError) {
    throw new Error(`Error al crear el canal "${name}": ${createError.message}`);
  }

  platformsCache[name] = newPlatform.id;
  return newPlatform.id;
}

// 3. Procesar el archivo
async function importCsv(filePath) {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ Error: El archivo "${filePath}" no existe.`);
    process.exit(1);
  }

  console.log(`\n🚀 Iniciando importación desde: ${absolutePath}\n`);
  
  const content = fs.readFileSync(absolutePath, 'utf8');
  const lines = content.split(/\r?\n/);
  
  if (lines.length < 2) {
    console.error('❌ Error: El archivo CSV está vacío o solo contiene encabezados.');
    process.exit(1);
  }

  // Analizar cabecera
  const headerLine = lines[0];
  const columns = headerLine.split(';').map(col => col.trim().toLowerCase());
  
  // Validar columnas obligatorias mínimas
  const requiredCols = ['cabana_nombre', 'huesped_nombre', 'check_in', 'check_out', 'precio_total'];
  const missingCols = requiredCols.filter(col => !columns.includes(col));
  
  if (missingCols.length > 0) {
    console.error('❌ Error en el formato del CSV. Faltan las siguientes columnas obligatorias:');
    console.error(missingCols.map(col => `  - ${col}`).join('\n'));
    process.exit(1);
  }

  console.log('📊 Columnas detectadas correctamente:');
  console.log(`  ${columns.join(', ')}\n`);

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  const errors = [];

  const todayStr = new Date().toISOString().split('T')[0];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      skippedCount++;
      continue; // Fila vacía
    }

    // Dividir celdas respetando el punto y coma
    const cells = line.split(';').map(cell => {
      // Limpiar comillas si existiesen
      let val = cell.trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
      }
      return val;
    });

    // Mapear fila a un objeto por columnas
    const row = {};
    columns.forEach((col, idx) => {
      row[col] = cells[idx] !== undefined ? cells[idx] : '';
    });

    const rowNum = i + 1;

    try {
      // Validaciones básicas de fila
      if (!row.cabana_nombre || !row.huesped_nombre || !row.check_in || !row.check_out) {
        throw new Error('Faltan campos obligatorios vacíos (Cabaña, Huésped, Entrada o Salida).');
      }

      // 1. Normalizar fechas
      const checkIn = parseAndNormalizeDate(row.check_in);
      const checkOut = parseAndNormalizeDate(row.check_out);

      if (!checkIn || !checkOut) {
        throw new Error(`Fechas con formato inválido. Entrada: "${row.check_in}", Salida: "${row.check_out}". Formato esperado: YYYY-MM-DD o DD-MM-YYYY`);
      }

      if (checkIn >= checkOut) {
        throw new Error(`La fecha de check_in (${checkIn}) debe ser anterior a check_out (${checkOut}).`);
      }

      // 2. Sanitizar precios
      const totalPrecio = parseMoney(row.precio_total);
      if (totalPrecio <= 0) {
        throw new Error(`Precio total inválido: "${row.precio_total}". Debe ser mayor que cero.`);
      }

      const montoAbonado = parseMoney(row.monto_abonado);

      // 3. Resolver IDs relacionales
      const cabinId = await resolveCabin(row.cabana_nombre);
      const plataformaId = await resolvePlatform(row.canal_venta);

      // 4. Determinar estado
      let status = row.estado ? row.estado.trim().toLowerCase() : '';
      if (!status) {
        // Inferencia inteligente: si la fecha de salida es pasada, asumimos checkout completado
        status = checkOut < todayStr ? 'checkout' : 'confirmada';
      }

      // 5. Normalizar RUT
      const guestRut = formatRut(row.huesped_rut);

      // 6. Preparar objeto de inserción de reserva
      const bookingData = {
        cabin_id: cabinId,
        guest_name: row.huesped_name || row.huesped_nombre,
        guest_rut: guestRut || null,
        guest_email: row.huesped_email || null,
        guest_phone: row.huesped_telefono || null,
        check_in: checkIn,
        check_out: checkOut,
        adults: parseInt(row.adults, 10) || 1,
        children: parseInt(row.children, 10) || 0,
        children_ages: row.children_ages ? row.children_ages.split(',').map(a => parseInt(a.trim(), 10)).filter(a => !isNaN(a)) : [],
        total_price: totalPrecio,
        status: status,
        plataforma_id: plataformaId,
        requires_invoice: row.requiere_factura ? (row.requiere_factura.toUpperCase() === 'SI' || row.requiere_factura.toLowerCase() === 'true') : false,
        admin_notes: row.notas || 'Carga masiva histórica.',
        admin_comision_porcentaje: parseMoney(row.admin_comision_porcentaje) || 0,
        plataforma_comision_aplicada: parseMoney(row.plataforma_comision_aplicada) || 0
      };

      console.log(`📌 [Fila ${rowNum}] Insertando reserva para ${bookingData.guest_name} en ${row.cabana_nombre} (${checkIn} al ${checkOut})...`);

      // Inserción en Supabase
      const { data: booking, error: insertError } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select('id')
        .single();

      if (insertError) {
        throw new Error(`Error en base de datos: ${insertError.message}`);
      }

      // 7. Si hay un abono registrado, insertamos el pago histórico
      if (montoAbonado > 0) {
        const paymentData = {
          booking_id: booking.id,
          amount: montoAbonado,
          payment_method: row.metodo_pago ? row.metodo_pago.trim() : 'Transferencia',
          reference: 'Pago histórico importado',
          notes: 'Registrado automáticamente desde Excel de migración.',
          created_at: new Date(checkIn).toISOString() // Registrar el pago en la fecha de check_in
        };

        const { error: paymentError } = await supabase
          .from('booking_payments')
          .insert(paymentData);

        if (paymentError) {
          console.warn(`  ⚠️ Alerta: Reserva insertada con éxito, pero falló el registro del abono: ${paymentError.message}`);
        } else {
          console.log(`  💵 Abono de $${montoAbonado.toLocaleString('es-CL')} registrado con éxito.`);
        }
      }

      successCount++;
    } catch (err) {
      errorCount++;
      console.error(`❌ [Fila ${rowNum}] Error al procesar: ${err.message}`);
      errors.push({
        fila: rowNum,
        cliente: row.huesped_nombre || 'Desconocido',
        error: err.message
      });
    }
  }

  // Imprimir reporte de resultados
  console.log('\n==================================================');
  console.log('🏁 MIGRACIÓN COMPLETADA CON ÉXITO');
  console.log('==================================================');
  console.log(`📝 Total filas leídas:      ${lines.length - 1}`);
  console.log(`✅ Reservas importadas:     ${successCount}`);
  console.log(`❌ Filas con error:         ${errorCount}`);
  console.log(`⏳ Filas vacías/omitidas:   ${skippedCount}`);
  console.log('==================================================\n');

  if (errors.length > 0) {
    console.log('⚠️ DETALLE DE ERRORES:');
    errors.forEach(e => {
      console.log(`  • Fila ${e.fila} (${e.cliente}): ${e.error}`);
    });
    console.log('\nPor favor corrige estos errores en tu archivo CSV e intenta importarlo de nuevo.');
  } else {
    console.log('🎉 ¡Increíble! Todas las filas se importaron sin ningún error.');
  }
}

// 4. Leer argumentos de terminal
const args = process.argv.slice(2);
const csvFile = args[0] || 'plantilla_carga_masiva.csv';

importCsv(csvFile).catch(err => {
  console.error('❌ Error catastrófico en el proceso de migración:', err);
});
