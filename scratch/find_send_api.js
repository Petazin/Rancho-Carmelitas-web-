const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'admin', 'reservas', 'page.tsx');
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

console.log('Buscando llamadas a send- en reservas/page.tsx...');
lines.forEach((line, index) => {
  if (line.includes('send-')) {
    console.log(`Línea ${index + 1}: ${line.trim()}`);
  }
});
