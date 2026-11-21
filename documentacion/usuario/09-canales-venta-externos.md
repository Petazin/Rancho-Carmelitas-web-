# 🔌 Manual de Usuario: 09. Canales de Venta y Comisiones Externas

**Pantalla:** `/admin/configuracion` (Menú lateral: "Canales de Venta")  
**Roles involucrados:** Administradores  

---

## 1. ¿Qué es un Canal de Venta?

Rancho Carmelitas comercializa sus cabañas tanto de forma directa (a través del sitio web oficial, WhatsApp y teléfono) como mediante Agencias de Viajes Online (OTAs) como Booking.com o Airbnb.

El módulo de **Canales de Venta** permite:
* Registrar cada plataforma externa con la que opera el complejo.
* Fijar el porcentaje de comisión contractual que cobra cada plataforma.
* Habilitar el selector de canales al momento de crear o editar reservas en el PMS.

---

## 2. Cómo Agregar un Nuevo Canal de Venta

1. En el menú lateral, haz clic en **"Canales de Venta"** (`/admin/configuracion`).
2. En el formulario superior, ingresa:
   - **Nombre de la Plataforma:** Ej: *Booking.com*, *Airbnb*, *Directo Rancho*, *Convenio Empresa*.
   - **Comisión de la Plataforma (%):** Porcentaje de comisión estándar (ej: `15` para Booking.com, `3` para Airbnb, `0` para venta directa).
3. Haz clic en **"+ Agregar Canal"**.
4. El nuevo canal aparecerá inmediatamente en la tabla inferior y quedará disponible para ser seleccionado en cualquier reserva nueva.

---

## 3. Impacto de las Comisiones en las Reservas y Contabilidad

Al crear o editar una reserva en `/admin/reservas`:
1. Cuando seleccionas el canal (ej: *Booking.com*), el sistema lee automáticamente el porcentaje de comisión configurado.
2. Calcula en tiempo real el monto exacto en pesos que retendrá esa plataforma sobre el precio bruto de la estancia.
3. Este cálculo alimenta de forma directa el **Reporte Financiero & SII**, permitiendo conocer con exactitud el ingreso neto real tras el descuento de comisiones.

---

## 4. Edición y Eliminación de Canales

* **Eliminar un Canal:** Si el rancho deja de trabajar con una plataforma específica, haz clic en el botón rojo **"Eliminar"** de la fila correspondiente.
* **Preservación Histórica:** Si eliminas un canal que ya fue utilizado en reservas pasadas, la base de datos mantiene las reservas históricas intactas gracias a la regla relacional `ON DELETE SET NULL`, evitando que se borren o alteren registros contables previos.
