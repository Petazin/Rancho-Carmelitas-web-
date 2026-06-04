const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'admin', 'reservas', 'page.tsx');
if (!fs.existsSync(filePath)) {
  console.error('No se encontró page.tsx en la ruta especificada:', filePath);
  process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

console.log('Buscando coincidencias de checkout en reservas/page.tsx...');
lines.forEach((line, index) => {
  if (line.toLowerCase().includes('checkout') || line.toLowerCase().includes('check-out')) {
    console.log(`Línea ${index + 1}: ${line.trim()}`);
  }
});
