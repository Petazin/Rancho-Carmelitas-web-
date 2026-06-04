const fs = require('fs');
const path = require('path');
const { Resend } = require('resend');

// Leer y parsear el archivo .env.local de forma nativa para evitar dependencias externas
let resendApiKey = '';
try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      if (line.startsWith('RESEND_API_KEY=')) {
        resendApiKey = line.split('=')[1].trim();
        break;
      }
    }
  }
} catch (err) {
  console.error("Error al leer .env.local de forma nativa:", err);
}

if (!resendApiKey) {
  console.error("Error: La variable RESEND_API_KEY no se encontró en .env.local o el archivo no existe.");
  process.exit(1);
}

const resend = new Resend(resendApiKey);

async function testEmail() {
  console.log("Iniciando prueba de envío con Resend...");
  console.log("API Key configurada:", resendApiKey.substring(0, 10) + "...");
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'Rancho Carmelitas <reservas@ranchocarmelitas.com>',
      to: ['rancho.carmelitas.6@gmail.com'], // Se envía al correo maestro del rancho
      subject: '🧪 Prueba de Conexión Resend - Ambiente de Test',
      html: `
        <div style="font-family: sans-serif; padding: 25px; border: 1px solid #e1e1e1; border-radius: 12px; max-width: 500px;">
          <h2 style="color: #11d442; margin-top: 0;">¡Conexión Exitosa!</h2>
          <p>Este es un correo de prueba automatizado del ambiente de **desarrollo local** de Rancho Carmelitas.</p>
          <p>Si has recibido este mensaje, significa que:</p>
          <ul style="padding-left: 20px;">
            <li>Tu nueva API Key de Resend está activa y configurada.</li>
            <li>El dominio <strong>ranchocarmelitas.com</strong> está autenticado y enviando correos correctamente.</li>
          </ul>
          <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;" />
          <p style="font-size: 11px; color: #888888; margin-bottom: 0;">Rancho Carmelitas PMS - Módulo de Gobernanza Técnica</p>
        </div>
      `
    });

    if (error) {
      console.error("❌ Error de Resend:", error);
    } else {
      console.log("✅ ¡Correo de prueba enviado con éxito!");
      console.log("ID del Mensaje:", data.id);
    }
  } catch (err) {
    console.error("❌ Error crítico durante el envío:", err);
  }
}

testEmail();

