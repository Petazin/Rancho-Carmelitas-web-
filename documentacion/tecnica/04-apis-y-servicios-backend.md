# 🔌 Documentación Técnica: Catálogo de APIs y Servicios Backend

**Tecnología:** Next.js 16 App Router (Route Handlers en `src/app/api/**`)  
**Formato de Intercambio:** JSON (`Content-Type: application/json`)  
**Mecanismos de Protección:** Autenticación de servidor (`server-auth.ts`), clientes con Service Role (`supabase-admin.ts`) y validación de esquemas  

---

## 1. Resumen de Endpoints Disponibles

| Endpoint | Métodos | Autenticación Requerida | Función Principal |
| :--- | :--- | :--- | :--- |
| `/api/admin/users` | `GET, POST, DELETE, PATCH` | Sesión Admin / Service Role | Lista colaboradores, invita por correo, elimina perfiles y solicita restablecimiento de contraseñas. |
| `/api/mercadopago/create-preference` | `POST` | Pública (validación de datos) | Genera la preferencia oficial de Checkout Pro en Mercado Pago para abonos (50%) o saldos de cabañas. |
| `/api/mercadopago/event-preference` | `POST` | Pública (validación de quote) | Genera la preferencia de pago de abono del 50% para cotizaciones de Arriendo de Recinto Completo (8h). |
| `/api/mercadopago/webhook` | `POST` | Pública (notificación de MP) | Receptor asíncrono de notificaciones de Mercado Pago (IPN), con lógica de idempotencia y auto-confirmación. |
| `/api/mercadopago/sync` | `POST` | Pública / Operativa | Sincronización manual bajo demanda consultando las últimas transacciones en la API oficial de Mercado Pago. |
| `/api/send-confirmation` | `GET, POST` | Pública (con chequeo de BD) | Despacha el correo de recepción de reserva al huésped y la notificación inmediata a la administración. |
| `/api/send-payment-confirmation` | `POST` | Pública (con chequeo de BD) | Despacha el correo oficial de abono confirmado con tabla desglosada de pagos y saldo remanente. |
| `/api/send-cancelation` | `POST` | **Obligatoria (`isStaffOrAdmin`)** | Despacha el correo formal de cancelación de reserva con el motivo específico seleccionado en el PMS. |
| `/api/send-checkout-thankyou` | `POST` | **Obligatoria (`isStaffOrAdmin`)** | Envía el correo de agradecimiento, resumen de estadía e invitación a reseñar en RRSS tras el Check-Out. |
| `/api/send-event-quote-email` | `POST` | Pública / Operativa | Despacha notificaciones de eventos diurnos (cotización recibida, cotización aprobada o evento confirmado). |

---

## 2. Especificación Detallada de Cada Endpoint

### 2.1. `/api/admin/users`
* **Archivo:** [`src/app/api/admin/users/route.ts`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/src/app/api/admin/users/route.ts)
* **GET:** Retorna el listado unificado de integrantes cruzando `auth.users` con `public.profiles`.
* **POST:** Invita a un nuevo colaborador por email (`supabaseAdmin.auth.admin.inviteUserByEmail`). Si el usuario ya está confirmado, detecta el caso y gatilla el envío de recuperación de contraseña (`resetPasswordForEmail`).
* **DELETE:** Elimina de forma atómica y definitiva al colaborador tanto de `auth.users` como de `public.profiles`.
* **PATCH:** Modifica nombre, teléfono, rol operativo o aplica/remueve baneos temporales (`banned_until` y `block_reason`).

### 2.2. `/api/mercadopago/create-preference`
* **Archivo:** [`src/app/api/mercadopago/create-preference/route.ts`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/src/app/api/mercadopago/create-preference/route.ts)
* **Parámetros de Entrada (Body JSON):**
  ```json
  {
    "bookingId": "uuid-de-la-reserva",
    "title": "Abono 50% - Cabaña Las Hortensias",
    "amount": 75000,
    "guestName": "Juan Pérez",
    "guestEmail": "juan.perez@gmail.com",
    "type": "abono", // o "saldo"
    "origin": "https://ranchocarmelitas.com"
  }
  ```
* **Respuesta Exitosa (200):**
  ```json
  {
    "success": true,
    "preferenceId": "123456789-abcdef",
    "initPoint": "https://www.mercadopago.cl/checkout/v1/redirect?pref_id=...",
    "sandboxInitPoint": "https://sandbox.mercadopago.cl/checkout/v1/redirect?pref_id=..."
  }
  ```
* **Comportamiento:** Configura `external_reference` con la estructura `${bookingId}__${type}__${amount}`, fija `binary_mode: true` (solo cobros aprobados o rechazados sin estados intermedios difusos) y define las URLs de retorno hacia `/checkout/success` o `/reserva/[id]`.

### 2.3. `/api/mercadopago/event-preference`
* **Archivo:** [`src/app/api/mercadopago/event-preference/route.ts`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/src/app/api/mercadopago/event-preference/route.ts)
* **Parámetros:** `{ "quoteId": "uuid-de-la-cotizacion", "origin": "..." }`
* **Comportamiento:** Valida en Supabase que la cotización exista y esté en estado `'Aprobada'`. Configura `external_reference: EVENT__${quoteId}__${amount}` y redirige el retorno a `/recinto-completo/pago?id=${quoteId}`.

### 2.4. `/api/mercadopago/webhook`
* **Archivo:** [`src/app/api/mercadopago/webhook/route.ts`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/src/app/api/mercadopago/webhook/route.ts)
* **Flujo Operativo:**
  1. Recibe la notificación de pago por query param o payload JSON (`topic=payment` o `type=payment`).
  2. Consulta la API oficial de Mercado Pago (`mpPayment.get({ id })`) para obtener el estado verificado del cobro.
  3. Si el estado es `'approved'`:
     - **Caso Recinto Completo (`EVENT__...`):** Actualiza `event_quotes` a `'Confirmada'`, guarda el abono pagado y dispara el correo de confirmación mediante `sendEventEmails({ action: 'confirmed' })`.
     - **Caso Cabaña (`bookingId__type__amount`):** Comprueba idempotencia en `booking_payments` con `reference = 'MP-${paymentId}'`. Si no estaba registrado, inserta el pago, recalcula el total abonado acumulado, actualiza la reserva a `'Confirmada'` (salvo que el admin la haya cancelado manualmente) y despacha el correo `/api/send-payment-confirmation`.

### 2.5. `/api/mercadopago/sync`
* **Archivo:** [`src/app/api/mercadopago/sync/route.ts`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/src/app/api/mercadopago/sync/route.ts)
* **Flujo Operativo:** Consulta las últimas 30 transacciones aprobadas en Mercado Pago mediante `mpPayment.search(...)`. Recorre los resultados verificando si ya existen en `booking_payments`. Si encuentra abonos pendientes no acreditados (por ejemplo, si el webhook de Mercado Pago sufrió demoras de red), los inserta y actualiza la reserva manteniendo la idempotencia silenciosa.

### 2.6. `/api/send-confirmation`
* **Archivo:** [`src/app/api/send-confirmation/route.tsx`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/src/app/api/send-confirmation/route.tsx)
* **Protección:** Valida en Supabase que el `bookingId` exista y coincida exactamente con el `guestEmail`.
* **Despacho Doble:**
  1. **Al Huésped:** Enlace a la reserva, datos de estancia, valor total y datos bancarios para transferencia (plantilla [`ConfirmationEmailTemplate`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/src/components/emails/ConfirmationTemplate.tsx)).
  2. **A la Administración (`company_email`):** Alerta inmediata de nueva reserva recibida en el sistema.

### 2.7. `/api/send-payment-confirmation`
* **Archivo:** [`src/app/api/send-payment-confirmation/route.tsx`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/src/app/api/send-payment-confirmation/route.tsx)
* **Contenido del Correo:** Desglose del abono recién pagado, tabla con el historial de todos los pagos registrados previamente en `booking_payments`, saldo remanente a pagar en el check-in, políticas de llegada y firma digital anti-colapso de Gmail.

### 2.8. `/api/send-cancelation`
* **Archivo:** [`src/app/api/send-cancelation/route.tsx`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/src/app/api/send-cancelation/route.tsx)
* **Protección:** Requiere autenticación de staff/admin (`isStaffOrAdmin()`). Responde `401` si no hay sesión.
* **Contenido:** Notificación cortés y formal de anulación de reserva especificando la razón seleccionada (ej: expiración de plazo de 24h, colisión de fechas o solicitud del huésped).

### 2.9. `/api/send-checkout-thankyou`
* **Archivo:** [`src/app/api/send-checkout-thankyou/route.tsx`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/src/app/api/send-checkout-thankyou/route.tsx)
* **Protección:** Requiere autenticación de staff/admin (`isStaffOrAdmin()`).
* **Contenido:** Despedida afectuosa tras completar el Check-Out físico, resumen de días pernoctados y enlaces interactivos para valorar la estadía o dejar reseñas en las redes sociales oficiales del Rancho.

### 2.10. `/api/send-event-quote-email`
* **Archivo:** [`src/app/api/send-event-quote-email/route.ts`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/src/app/api/send-event-quote-email/route.ts)
* **Acciones Manejadas (`action`):**
  - `'created'`: Envía acuse de recibo de cotización al organizador y alerta al administrador con los detalles del grupo.
  - `'approved'`: Envía correo oficial al organizador con el botón directo de pago del 50% de abono para congelar la fecha.
  - `'confirmed'`: Envía confirmación definitiva con comprobante de arriendo exclusivo del recinto por 8 horas.
