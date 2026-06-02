# ⚙️ Manual Funcional — Configuraciones Globales del Rancho

Esta sección detalla el funcionamiento del panel de **Configuraciones Globales (`/admin/configuraciones`)** y cómo las variables ingresadas impactan en el comportamiento financiero de las reservas y en las plantillas de correo automatizadas.

---

## 1. Introducción y Propósito
El panel de Configuraciones Globales centraliza los datos institucionales, de contacto y financieros base de Rancho Carmelitas. Esta información es crucial, ya que alimenta de forma reactiva el pie de firma de todos los correos transaccionales enviados a los huéspedes y el cotizador de reservas manuales.

---

## 2. Mapa de Elementos de la Interfaz

La pantalla se distribuye en tres bloques lógicos interactivos:

### Bloque A: 📱 Contacto y Redes
- **Número de WhatsApp:** Canal principal de contacto.
  - **Regla de Formato Exigida:** Debe ingresarse con código de país (56 para Chile), **sin el símbolo "+", sin espacios y sin caracteres especiales** (ej: `56912345678`). Esto es sumamente importante para que la redirección a la API de WhatsApp Web (`https://wa.me/...`) en las cancelaciones o confirmaciones manuales funcione correctamente sin arrojar errores de enlace roto.

### Bloque B: 🏢 Datos de la Empresa / Rancho
- **Nombre de la Empresa / Rancho:** Nombre oficial que aparecerá en el encabezado de los correos (ej: `Rancho Carmelitas`).
- **RUT de la Empresa:** RUT institucional (ej: `77.123.456-K`) utilizado para las cotizaciones e IVA SII.
- **Dirección Física:** Ubicación oficial del Rancho (Camino Los Álamos 123, Pullally).
- **Teléfono y Correo de Contacto:** Teléfono y email visibles en el pie de firma que el huésped ve en sus recibos.

### Bloque C: 💰 Comisión Administrativa por Defecto
- **Comisión de Administración por Defecto (%):** Porcentaje de comisión administrativa interna (ej: `10%` o `12.5%`) que se aplica por defecto al cotizar o registrar reservas manuales creadas por el staff en el modal del PMS, con total libertad para que el administrador pueda introducir excepciones puntuales para reservas específicas en caliente.

---

## 🔄 3. Manual de Procedimientos Paso a Paso

### Cómo Actualizar los Datos del Rancho
1. Diríjase a la sección **Configuraciones** en el menú de navegación izquierdo.
2. Modifique los campos del formulario según sea necesario (ej: si cambia el teléfono de contacto o la dirección física del Rancho).
3. Presione el botón **"Guardar Configuraciones Globales"** al pie de la pantalla.
4. **Impacto Inmediato (SSR):** Las variables se persistirán mediante un `upsert` en Supabase y se propagarán en caliente a Next.js de manera desatendida. Cualquier correo que se despache a partir de ese segundo (confirmaciones de pago, cancelaciones, etc.) mostrará de inmediato la información actualizada en sus pies de firma, sin requerir reconstrucciones de software.
