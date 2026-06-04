const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/admin/reservas/page.tsx');
if (!fs.existsSync(filePath)) {
  console.log('El archivo no existe.');
  process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

console.log('Buscando ocurrencias de confirmModal o confirmación manual en page.tsx...');
lines.forEach((line, idx) => {
  if (line.includes('confirmModalOpen') || line.includes('setConfirmModalOpen') || line.includes('handleConfirmBooking')) {
    console.log(`Línea ${idx + 1}: ${line.trim()}`);
  }
});
