# 📅 Manual Funcional — Gestión de Reservas y Lógicas de Cálculo

Esta sección detalla de forma exhaustiva el funcionamiento del panel de **Reservas (`/admin/reservas`)**, el ciclo de cobros, abonos múltiples, check-in/check-out y las fórmulas matemáticas de cálculo financiero aplicadas tanto en el frontend como en el backend.

---

## 1. Introducción y Propósito
La sección de Reservas es el núcleo de facturación y control operativo del PMS. Permite registrar abonos parciales, realizar check-in obligando al registro de datos vehiculares y de huésped, documentar inspecciones de cabañas en check-out, y emitir reportes financieros optimizados para la declaración tributaria ante el SII (Servicio de Impuestos Internos de Chile).

---

## 2. Mapa de Elementos de la Interfaz

La pantalla cuenta con un sistema de pestañas (Tabs) interactivo de marca:

1. **📋 Listado General:** Tabla completa con paginación, filtros de fechas y badges interactivos.
2. **⚠️ Reservas en Conflicto:** Pestaña dinámica Rancho Stitch UI con contador pulsante que lista y filtra en caliente las reservas que colisionan en fechas.
3. **📊 Reporte Financiero & SII:** Visor tributario con filtros anuales y mensuales de recaudación.

---

## 📐 3. Especificación de Fórmulas y Lógica de Negocio

El sistema aplica tres algoritmos matemáticos clave para asegurar la exactitud tributaria y operativa:

### 3.1 Algoritmo de Redondeo Automático (A las Decenas)
A petición de la administración del Rancho, todos los precios calculados en cotizaciones y reservas manuales se redondean automáticamente a la **decena de peso chileno más cercana (múltiplo de 10) hacia abajo**.

* **Fórmula Matemática:**
  $$\text{Precio Redondeado} = \lfloor \frac{\text{Precio Bruto}}{10} \rfloor \times 10$$
* **Fórmula en Código (React/TypeScript):**
  ```typescript
  const rawTotal = basePrice + extraGuestsCost - discountApplied;
  const roundedTotal = Math.floor(rawTotal / 10) * 10;
  const roundingDiscount = rawTotal - roundedTotal; // Descuento por redondeo
  ```
* **Ejemplo Práctico:** Si el precio bruto del cotizador es de $123,456 CLP:
  1. Se divide por 10: $12,345.6$
  2. Se redondea al entero inferior: $12,345$
  3. Se multiplica por 10: **$123,450 CLP** (Total a pagar).
  4. La diferencia de **$6 CLP** se registra automáticamente y se le muestra al cliente bajo la glosa `"Descuento por Redondeo"`.

### 3.2 Lógica de Auto-Confirmación Financiera (Uso de Abonos Múltiples)
Las reservas creadas inician en estado `'Pendiente' (🟡)`. El sistema realiza una evaluación reactiva en caliente cada vez que el staff registra un pago en el modal de abonos múltiples.

* **Fórmula de Confirmación:**
  $$\text{Abonos Acumulados} = \sum (\text{Montos de Pagos Registrados en } \texttt{booking\_payments})$$
  $$\text{Umbral de Confirmación} = \text{Total Reserva} \times 0.5$$
* **Regla de Negocio:**
  - Si $\text{Abonos Acumulados} \ge \text{Umbral de Confirmación}$, el backend de Next.js cambia automáticamente el estado de la reserva a `'Confirmada' (🟠)`, registra la marca de tiempo de confirmación y despacha de forma desatendida el correo de confirmación definitiva al huésped.

### 3.3 Fórmulas de Desglose del Reporte Financiero & SII
La pestaña del Reporte calcula en tiempo real los ingresos brutos, el IVA devengado (para reservas que requirieron factura ante el SII de Chile) y la distribución de comisiones de canales de venta (Airbnb, Booking.com) y comisiones administrativas del PMS del Rancho.

* **Fórmula de Desglose Financiero:**
  $$\text{Ingreso Bruto} = \text{Monto Total Recaudado por Reservas}$$
  $$\text{IVA SII (19\%)} = \sum (\text{Precio Bruto de Reservas con Factura}) \times 0.19$$
  $$\text{Comisión Plataforma} = \sum (\text{Tarifa Reserva} \times \text{Comisión \% del Canal de Venta})$$
  $$\text{Comisión Rancho PMS} = \sum (\text{Tarifa Reserva} \times \text{Comisión \% del PMS})$$
  $$\text{Ingreso Neto Liquidado} = \text{Ingreso Bruto} - \text{IVA SII} - \text{Comisión Plataforma} - \text{Comisión Rancho PMS}$$

---

## 🚗 4. Manual de Procedimientos Paso a Paso

### 4.1 Registro de Check-in Defensivo y Saldo Cero
Cuando un huésped llega físicamente al Rancho:
1. Haga clic en el botón **"🚗 Registrar Check-In"** en la fila de la reserva confirmada.
2. El sistema abrirá el modal interactivo. Si la reserva tiene un saldo pendiente de pago por saldar (saldo > 0), el botón de confirmación de check-in aparecerá **bloqueado**, obligando al staff a saldar la deuda en caliente en el mismo modal.
3. Ingrese el monto del pago en la casilla correspondiente, presione **"Registrar Pago"** para saldar la deuda a cero.
4. Complete obligatoriamente los 5 campos de la Ficha del Huésped:
   - **RUT / Pasaporte:** Formateado automáticamente (ej. `12.345.678-9`).
   - **Patente Vehicular:** Placa del vehículo del huésped (ej. `ABCD-12` o `AB-1234`).
   - **Nacionalidad:** País de origen.
   - **Fecha de Nacimiento:** Utilizado para enviar felicitaciones de cumpleaños.
   - **Observaciones:** Preferencias especiales (ej. "Trae mascota", "Solicita toallas extra").
5. Presione **"Confirmar Check-In"**. El estado de la reserva cambiará a `'En Cabaña' (🟢)`.

### 4.2 Registro de Check-out Físico Asistido
Al finalizar la estadía del huésped:
1. Presione el botón **"🔑 Registrar Check-Out"**.
2. Complete la auditoría física interactiva en el modal:
   - Marque la casilla **"Recepción de llaves confirmada"**.
   - Marque la casilla **"Cabaña inspeccionada sin daños"** (de lo contrario, redacte en el campo de texto las notas de daños o cargos adicionales).
3. Presione **"Confirmar Check-Out"**. La reserva mutará a `'Completada' (🔵)` y la cabaña cambiará automáticamente su estado a `'Necesita Aseo'`, bloqueando nuevas reservas hasta que el personal de housekeeping termine la limpieza.
