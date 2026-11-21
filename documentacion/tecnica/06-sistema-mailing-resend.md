# 📬 Documentación Técnica: Sistema de Mailing Transaccional (Resend)

**Proveedor:** [Resend](https://resend.com/) (API REST Saliente)  
**Motor de Plantillas:** React Email (`@react-email/components`, `@react-email/render`)  
**Estrategia de Renderizado:** Tablas HTML puras con anchos fijos y porcentuales (para neutralizar fallos de maquetación en Gmail y clientes corporativos)  
**Técnica Anti-Trimmed:** Inyección de firmas de transacción únicas con timestamp visible para evitar que Gmail oculte el contenido o agrupe reservas no relacionadas en hilos colapsados  

---

## 1. Configuración de Infraestructura

El despacho de correos se inicializa mediante:
```typescript
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);
```

### Dinamismo de Variables desde Supabase
El sistema no deja direcciones de correo en duro dentro del código. Cada envío consulta dinámicamente la tabla `settings`:
* `email_sender`: Dirección del remitente oficial autenticada en Resend (ej: `Rancho Carmelitas <reservas@ranchocarmelitas.com>`). Si no está configurada, utiliza como fallback temporal `Rancho Carmelitas <onboarding@resend.dev>`.
* `company_email`: Buzón receptor de las alertas administrativas (ej: `rancho.carmelitas.6@gmail.com`).
* `whatsapp_number`: Teléfono para enlaces de contacto directo.
* `bank_*`: Datos de la cuenta bancaria (Banco, Tipo de Cuenta, Número, RUT, Titular, Correo) incluidos en correos que esperan transferencia.

---

## 2. Catálogo Oficial de Plantillas de Correo

Todas las plantillas se encuentran en `src/components/emails/`:

### 2.1. `ConfirmationEmailTemplate.tsx`
* **Destinatario:** Huésped que acaba de generar una reserva pública en la web vía transferencia bancaria.
* **Contenido:**
  - Código identificador de reserva (UUID).
  - Fechas de entrada (`check_in`) y salida (`check_out`) formateadas en español de Chile (`es-CL`).
  - Total de la estancia y abono requerido del 50%.
  - Caja destacada Stitch UI con los datos bancarios oficiales del Rancho para realizar la transferencia.
  - Botón directo de acción hacia el Portal del Huésped (`/reserva/[id]`) para subir comprobantes o revisar el estado.

### 2.2. `PaymentConfirmationTemplate.tsx`
* **Destinatario:** Huésped cuando se acredita su abono o pago (ya sea vía Mercado Pago o registrado manualmente en el PMS).
* **Innovación Técnica (v1.4.4):** Desglose relacional completo de **todos los pagos realizados**. En lugar de mostrar solo un total genérico, despliega una sub-tabla con cada abono individual:
  - Número correlativo (Abono #1, Abono #2).
  - Medio de pago (Transferencia, Pago Online, Efectivo).
  - Referencia o comprobante.
  - Fecha exacta de la operación.
  - Saldo remanente a cancelar durante el check-in.
* **Privacidad Estricta:** Las comisiones de canales de venta (Booking.com) y las comisiones internas del dueño quedan 100% excluidas de este correo.

### 2.3. `CancelationTemplate.tsx`
* **Destinatario:** Huésped cuya reserva ha sido cancelada en el PMS.
* **Contenido:**
  - Motivo oficial de la cancelación (Plazo de 24h expirado, anulación voluntaria, mantenimiento extraordinario).
  - Información sobre políticas de devolución o reprogramación.
  - Botón de contacto directo con recepción vía WhatsApp.

### 2.4. `CheckoutThankYouTemplate.tsx`
* **Destinatario:** Pasajero tras procesarse con éxito su Check-Out físico en el PMS.
* **Contenido:**
  - Resumen afectuoso de la estancia completada en Rancho Carmelitas.
  - Caja de interacción con redes sociales para invitarlo a etiquetar fotos en Instagram y dejar su opinión en Google Maps.

### 2.5. `EventQuoteTemplates.tsx`
* **Módulo:** Arriendo de Recinto Completo (Eventos Diurnos de 8 Horas).
* **Plantillas Incluidas:**
  1. `EventQuoteReceivedClientTemplate`: Acuse de recibo para el organizador del grupo.
  2. `EventQuoteAdminAlertTemplate`: Notificación a la administración alertando sobre un nuevo evento propuesto (asistentes, fecha y monto).
  3. `EventQuoteApprovedClientTemplate`: Notificación formal de aprobación enviada al organizador con el botón directo de pago del 50% para reservar la fecha.
  4. `EventQuoteConfirmedClientTemplate`: Confirmación definitiva del arriendo exclusivo del recinto con las normas operativas del quincho y piscina.

---

## 3. Prevención de Colapso de Hilos en Gmail (Anti-Trimmed)

Gmail colapsa los correos repetitivos o los agrupa en un mismo hilo gigantesco si el asunto o el cuerpo son idénticos. Para resolver esto:
1. **Asunto con Folio Dinámico:** Cada correo incluye en el asunto el código único de la reserva o cotización (ej: `Confirmación de Pago: Cabaña Las Hortensias (Cód: A3F8B0E1)`).
2. **Pie de Firma Criptográfica Visible:** Al pie de cada correo se estampa un bloque de texto discreto con la marca temporal en milisegundos y un hash de transacción único:
   ```html
   <div style="font-size: 11px; color: #9ca3af; text-align: center; margin-top: 24px;">
     Ref: {bookingId} | Tx: {Date.now()} | Rancho Carmelitas, Pullally, Región de Valparaíso
   </div>
   ```
   Esto asegura que cada mensaje sea considerado un documento independiente y previene la aparición de los tres puntos de contenido oculto (`...`) en la interfaz de Gmail.
