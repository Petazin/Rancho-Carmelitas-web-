# 📋 Manual de Usuario: 05. Gestión Operativa de Reservas de Cabañas

**Pantalla:** `/admin/reservas`  
**Roles involucrados:** Administradores, Recepcionistas y Personal Operativo  

---

## 1. Estructura de la Pantalla de Reservas

La pantalla central del PMS se organiza en cuatro pestañas maestras:

1. **Todas las Reservas:** Listado completo y unificado con filtros por estado, buscador reactivo (por nombre, RUT o código), resumen de pagos y acciones rápidas.
2. **⚠️ Reservas en Conflicto:** Aísla de forma inmediata las reservas que tienen colisiones de fechas (overbooking) o que chocan con cierres temporales de mantención.
3. **📊 Reporte Financiero & SII:** Herramienta contable para la liquidación mensual al dueño e impuestos (IVA 19%).
4. **🎪 Arriendos de Recinto (8h):** Gestión de cotizaciones y reservas de eventos diurnos de grupos masivos.

---

## 2. Creación Manual de Reservas en el PMS

Cuando un cliente solicita una reserva por teléfono, WhatsApp o en el mesón de recepción:

1. Haz clic en el botón verde superior **"+ Nueva Reserva Manual"**.
2. **Selecciona la Cabaña:** Al elegir una cabaña, el modal cargará de inmediato su calendario interactivo Stitch UI.
   - Los días ocupados por otras reservas o bloqueados por mantención aparecerán **tachados y en color rojo** para prevenir errores humanos.
3. **Selecciona Fechas de Entrada y Salida:** Haz clic en el día de llegada y en el día de salida.
4. **Pasajeros y Edades:**
   - Ingresa la cantidad de adultos y niños.
   - Si viajan niños, se desplegarán campos obligatorios para ingresar la edad exacta de cada menor, permitiendo un cálculo tarifario óptimo.
5. **Gestión Inteligente de Pasajeros Adicionales:**
   - Si el grupo supera la capacidad base de la cabaña, el sistema activará el selector de adicionales.
   - **Estadía Completa vs Días Parciales:** Puedes marcar si los adicionales se quedan toda la estadía o si llegan en días posteriores (ingresando fechas exactas de llegada y salida del pasajero extra).
   - El sistema calcula las noches exactas pernoctadas aplicando el piso mínimo garantizado de **$10.000 CLP / noche**.
6. **Ficha de Registro Anticipada (Check-in Rápido):**
   - Puedes ingresar de antemano el **RUT chileno** (con formato reactivo con puntos y guion), la **Patente del Vehículo**, la **Nacionalidad**, la **Fecha de Cumpleaños** y sus **Preferencias**.
7. **Aspectos Comerciales y Financieros:**
   - **Canal de Venta:** Selecciona por dónde llegó la reserva (Directo, Booking.com, Airbnb).
   - **Comisión de Administración:** Se auto-rellena con el valor global (ej: 10%), pero puedes ajustarlo si hay una excepción.
   - **Facturación SII:** Marca la casilla *"¿Requiere Factura con IVA (19%)?"* si el cliente necesita factura fiscal.
   - **Descuentos Comerciales:** Puedes aplicar descuentos en porcentaje (`%`) o en monto fijo en pesos (`$`).
8. Haz clic en **"Crear Reserva"**.

---

## 3. Gestión Unificada de Pagos Múltiples y Abonos

En Rancho Carmelitas, los clientes pueden abonar mediante distintos métodos y en fechas diferentes (ej: un primer abono por transferencia bancaria y el saldo en efectivo al llegar).

Para gestionar los pagos de una reserva:
1. En la fila de la reserva, haz clic en el botón azul **"💳 Pagos"**.
2. Se abrirá el **Timeline de Transacciones**, donde verás todos los abonos históricos registrados para esa estancia.
3. **Sugerencia Dinámica del 50%:**
   - Si la reserva está pendiente, un banner naranja te indicará exactamente el monto que falta para completar el 50% obligatorio.
   - Incluye un botón de un clic para pre-llenar ese monto en el formulario de pago.
4. **Auto-Confirmación Inteligente al 50%:**
   - Si al ingresar un abono la suma acumulada alcanza o supera el 50% del total de la reserva, **el botón de guardar muta automáticamente a color verde oficial y su texto cambia a `"✓ Registrar y Confirmar Reserva"`**.
   - Al presionarlo, el sistema registra el abono, promueve la reserva a `'Confirmada'` y despacha desatendidamente el correo oficial de confirmación al huésped con el desglose de todos los abonos realizados.
5. **Carga de Comprobantes:** Puedes adjuntar fotos de transferencias bancarias o recibos físicos, los cuales quedan guardados de forma segura en la nube.

---

## 4. Check-In Defensivo: Entrega Segura de Cabaña

El día de la llegada del pasajero:

1. Ubica la reserva en el listado y haz clic en el botón verde **"🚗 Registrar Check-In"**.
2. **Inspección de la Ficha del Huésped:**
   - Verifica el RUT, patente del vehículo para acceso por portón y datos de contacto. Si faltan datos, el recepcionista puede completarlos en caliente en ese mismo momento.
3. **Bloqueador Rígido de Saldo Pendiente:**
   - Si el huésped mantiene un saldo pendiente por pagar (por ejemplo, el 50% restante), el botón final de entrega estará **bloqueado y deshabilitado**.
   - El modal despliega una caja integrada de cobro donde el recepcionista puede seleccionar el medio de pago (Efectivo, Tarjeta, Transferencia) e ingresar el monto restante.
   - **Actualización en Caliente:** Al registrar el pago, el saldo baja a **$0 al instante**, y el botón muta a color verde activo: **`"🚗 Completar Check-In & Entregar Cabaña"`**.
4. Al completarlo, la reserva pasa al estado `'checkin'` (🟢 En Cabaña).

---

## 5. Check-Out Asistido e Inspección Física

El día de la salida del huésped (máximo a las 12:00 hrs):

1. En la fila de la reserva, haz clic en el botón azul **"🔑 Registrar Check-Out"**.
2. **Checklist Obligatorio de Recepción:**
   - Marca la casilla *"✓ Llaves de la cabaña devueltas por el pasajero"*.
   - Marca la casilla *"✓ Inspección física completada (sin daños extraordinarios)"*.
   - En caso de existir alguna rotura, pérdida de toallas o desperfecto, ingrésalo en el campo *"Observaciones de salida / Desperfectos"*.
3. Presiona **"Confirmar Check-Out y Liberar Pasajero"**.
4. **Acciones Automáticas del Sistema:**
   - La reserva pasa al estado `'checkout'` (🔵 Completada).
   - La cabaña cambia automáticamente su estado de limpieza a **`'Necesita Aseo'`**, alertando al equipo de housekeeping.
   - El sistema despacha automáticamente un **Correo de Agradecimiento y Despedida** al huésped deseándole un buen viaje e invitándolo a calificar su experiencia en redes sociales.

---

## 6. Cancelación Multicanal e Interacción con WhatsApp

Si una reserva debe ser anulada:

1. Haz clic en el botón rojo **"❌ Cancelar"** de la reserva.
2. Selecciona el **Motivo Oficial de Cancelación:**
   - *Expiración de plazo de 24 horas sin acreditación de abono.*
   - *Cancelación solicitada por el cliente.*
   - *Fuerza mayor o reprogramación acordada.*
3. **Canales de Notificación Simultáneos:**
   - Marca *"Enviar correo formal de cancelación vía Resend"*.
   - Marca *"Abrir WhatsApp con mensaje cortés pre-redactado"*.
4. Haz clic en **"Confirmar Cancelación"**.
5. La cabaña quedará liberada de inmediato en los calendarios públicos para que otros clientes puedan reservarla, y se abrirá una pestaña de WhatsApp Web con el texto oficial listo para enviar.
