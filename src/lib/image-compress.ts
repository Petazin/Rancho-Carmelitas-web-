/**
 * Utilidad de compresión de imágenes del lado del cliente (en el navegador).
 * Utiliza Canvas HTML5 para redimensionar y comprimir imágenes antes de subirlas a Supabase.
 */
export async function compressImage(
  file: File,
  maxDimension: number = 1600,
  quality: number = 0.8
): Promise<File> {
  // Asegurar que estamos en el entorno del cliente y que es una imagen procesable (excluyendo SVG)
  if (
    typeof window === "undefined" ||
    !file.type.startsWith("image/") ||
    file.type.includes("svg")
  ) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Redimensionar proporcionalmente si excede la dimensión máxima
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file); // Retornar archivo original en caso de fallo en el contexto
          return;
        }

        // Dibujar la imagen en el canvas con las nuevas dimensiones
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir el canvas a Blob en formato JPEG con la calidad definida (0.0 a 1.0)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Generar un nuevo archivo con extensión .jpg reemplazando la original
              const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
              const compressedFile = new File([blob], `${nameWithoutExt}.jpg`, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Fallback si falla la generación del blob
            }
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
