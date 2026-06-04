const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'src', 'app', 'admin', 'reservas', 'page.tsx');

if (!fs.existsSync(targetPath)) {
  console.error("El archivo no existe:", targetPath);
  process.exit(1);
}

const content = fs.readFileSync(targetPath, 'utf8');
const lines = content.split('\n');

console.log("Resultados de búsqueda en reservas/page.tsx:");
lines.forEach((line, index) => {
  if (line.includes('admin_comision_porcentaje') || line.includes('Comisión Administración') || line.includes('Pago Neto Estimado')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
