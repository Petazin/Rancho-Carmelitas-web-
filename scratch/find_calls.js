const fs = require('fs');
const path = require('path');

function searchInDir(dir, filter, searchStr) {
  if (!fs.existsSync(dir)) {
    console.log(`Directorio no existe: ${dir}`);
    return;
  }

  const files = fs.readdirSync(dir);
  for (let i = 0; i < files.length; i++) {
    const filename = path.join(dir, files[i]);
    const stat = fs.lstatSync(filename);

    if (stat.isDirectory()) {
      searchInDir(filename, filter, searchStr);
    } else if (filter.test(filename)) {
      const content = fs.readFileSync(filename, 'utf-8');
      if (content.includes(searchStr)) {
        console.log(`Encontrado en: ${filename}`);
        // Mostrar líneas que contienen la cadena
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes(searchStr)) {
            console.log(`  Línea ${idx + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

console.log('Buscando llamadas a "send-payment-confirmation" o "send-confirmation"...');
searchInDir(path.join(__dirname, '../src'), /\.(tsx|ts|jsx|js)$/, 'send-payment-confirmation');
searchInDir(path.join(__dirname, '../src'), /\.(tsx|ts|jsx|js)$/, 'send-confirmation');
searchInDir(path.join(__dirname, '../src'), /\.(tsx|ts|jsx|js)$/, 'booking_payments');
