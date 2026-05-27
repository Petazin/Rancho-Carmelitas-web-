const fs = require('fs');
const https = require('https');
const path = require('path');

// URL para obtener el avatar/logo oficial de Instagram @ranchocarmelitas
const logoUrl = 'https://unavatar.io/instagram/ranchocarmelitas';
const targetDir = path.join(__dirname, 'public');
const targetPath = path.join(targetDir, 'logo.png');

console.log('Iniciando descarga del logo de Rancho Carmelitas desde redes...');
console.log(`Origen: ${logoUrl}`);
console.log(`Destino: ${targetPath}`);

// Asegurar que exista la carpeta public
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Función para descargar manejando redirecciones (unavatar.io redirige al CDN final de Instagram)
function downloadFile(url, destPath) {
  https.get(url, (res) => {
    // Si hay redirección (códigos 3xx)
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      console.log(`Redirigiendo a: ${res.headers.location}`);
      downloadFile(res.headers.location, destPath);
      return;
    }

    if (res.statusCode !== 200) {
      console.error(`Error en la descarga. Código de estado: ${res.statusCode}`);
      process.exit(1);
    }

    const fileStream = fs.createWriteStream(destPath);
    res.pipe(fileStream);

    fileStream.on('finish', () => {
      fileStream.close();
      console.log('✅ Descarga completada con éxito. El logo se guardó en public/logo.png');
    });

    fileStream.on('error', (err) => {
      fs.unlink(destPath, () => {});
      console.error('Error al guardar el archivo:', err.message);
      process.exit(1);
    });
  }).on('error', (err) => {
    console.error('Error en la conexión de red:', err.message);
    process.exit(1);
  });
}

downloadFile(logoUrl, targetPath);
