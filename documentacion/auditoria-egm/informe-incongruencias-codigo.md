# 🔍 Informe Forense de Auditoría EGM: Incongruencias, Vulnerabilidades y Código Fantasma

**Proyecto:** Rancho Carmelitas Web & PMS  
**Marco Metodológico:** Ensemble Goldfish Method (EGM) — Auditoría Pedante de Calidad Técnica y Seguridad  
**Fecha:** Noviembre 2026  
**Severidad Global:** 8 Blockers (Críticos) / 7 Majors (Altos) / 5 Nits (Menores)  

---

## 1. Resumen Ejecutivo de la Auditoría EGM

Se ha ejecutado una inspección forense exhaustiva sobre el 100% de los módulos de la plataforma Rancho Carmelitas Web & PMS, cruzando el código fuente de Next.js App Router (rutas públicas, PMS `/admin` y Route Handlers `/api`), esquemas SQL, políticas de Row Level Security (RLS) en Supabase, pasarela de pagos con Mercado Pago, plantillas de correo con Resend y lógica de negocio.

Se identificaron **20 hallazgos técnicos** de alto impacto para la seguridad, estabilidad e integridad operativa del sistema:

---

## 2. Bloque A: Fallas Críticas (Blockers)

### 🔴 1. Supresión de SELECT anónimo en `bookings` quiebra el Portal del Huésped (`/reserva/[id]`)
* **Ubicación:** [`schema_security_produccion.sql:138-142`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/schema_security_produccion.sql#L138-L142) y [`src/app/reserva/[id]/page.tsx:51-55`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/src/app/reserva/%5Bid%5D/page.tsx#L51-L55)
* **Diagnóstico:** En la v1.9.0 se revocó con éxito la lectura anónima sobre `bookings` para proteger datos de huéspedes. Sin embargo, el Portal del Huésped (`/reserva/[id]`) es un Client Component (`'use client'`) que consulta directamente a Supabase con la anon key. PostgREST deniega la consulta y retorna `data = null`. Ningún huésped puede ver su estadía ni saldar el saldo en línea.
* **Solución EGM:** Implementar una API Route de servidor o función RPC `get_public_booking_by_id(p_booking_id UUID)` con `SECURITY DEFINER` que devuelva solo campos seguros.

### 🔴 2. Exposición Masiva de PII / Falla Funcional en Buscador de Reservas (`/reserva`)
* **Ubicación:** [`src/app/reserva/page.tsx:56-67`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/src/app/reserva/page.tsx#L56-L67) y [`schema_event_quotes_fase1_test.sql:353-358`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/schema_event_quotes_fase1_test.sql#L353-L358)
* **Diagnóstico:** La búsqueda descarga en bloque hasta 100 reservas y 100 cotizaciones de eventos en el navegador. En `bookings`, como RLS deniega SELECT, la búsqueda siempre da vacía. Pero en `event_quotes`, la política es `USING (true)`, permitiendo que cualquier visitante descargue los datos de contacto y colegios de los últimos 100 eventos.
* **Solución EGM:** Eliminar la descarga a memoria en el cliente. Delegar la búsqueda a una función RPC en PostgreSQL con parámetros específicos (`p_rut`, `p_email`, `p_id`).

### 🔴 3. Reconciliación Ciega e Insegura en `checkout/success` (Confirmación Gratuita de Reservas)
* **Ubicación:** [`src/app/checkout/success/page.tsx:84-110`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/src/app/checkout/success/page.tsx#L84-L110)
* **Diagnóstico:** `CheckoutSuccessPage` lee los parámetros de la URL (`?status=approved&method=mercadopago`) e inserta de inmediato el abono y confirma la reserva en Supabase **sin consultar a la API de Mercado Pago (`mpPayment.get`)**. Cualquier usuario malicioso que manipule la URL puede confirmar reservas sin pagar un solo peso.
* **Solución EGM:** Exigir validación obligatoria contra la API oficial de Mercado Pago antes de insertar abonos en `CheckoutSuccessPage`, o delegar la confirmación exclusivamente al Webhook IPN de servidor.

### 🔴 4. Confirmación no Verificada de Eventos en `/recinto-completo/pago`
* **Ubicación:** [`src/app/recinto-completo/pago/page.tsx:70-96`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/src/app/recinto-completo/pago/page.tsx#L70-L96)
* **Diagnóstico:** Si la URL contiene `?payment_status=approved`, el cliente intenta actualizar `event_quotes` a `'Confirmada'` y dispara `/api/send-event-quote-email` con `action: 'confirmed'`, despachando correos falsos de confirmación sin chequear el estado real del cobro en Mercado Pago.
* **Solución EGM:** La confirmación debe ser orquestada exclusivamente por el Webhook de servidor con Service Role.

### 🔴 5. Rollback Fallido en Checkout y Overbooking Fantasma
* **Ubicación:** [`src/components/ui/CheckoutForm.tsx:294-299`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/src/components/ui/CheckoutForm.tsx#L294-L299)
* **Diagnóstico:** Si falla Mercado Pago, el bloque catch intenta borrar la reserva provisional con `supabase.from('bookings').delete()`. Como `anon` no tiene permisos `DELETE`, la operación es rechazada y la reserva en `'Pendiente'` bloquea las fechas para siempre.
* **Solución EGM:** Crear función RPC `cancel_provisional_booking(p_id)` con `SECURITY DEFINER`.

### 🔴 6. Escalación Automática a Rol `admin` para Cuentas sin Perfil
* **Ubicación:** [`src/app/api/admin/users/route.ts:56-71`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/src/app/api/admin/users/route.ts#L56-L71) y [`src/lib/server-auth.ts:60-63`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/src/lib/server-auth.ts#L60-L63)
* **Diagnóstico:** Si un usuario existe en `auth.users` pero no en `public.profiles`, la API le crea automáticamente un perfil con `role: 'admin'`. Cualquier cuenta huérfana obtiene acceso total al PMS.
* **Solución EGM:** Limitar esta auto-creación a un fallback con rol `'staff'` o denegar el acceso hasta que un administrador le asigne un rol explícito.

### 🔴 7. Desconexión Total entre el CMS de Landing y la Landing Pública
* **Ubicación:** [`src/app/page.tsx:134-147`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/src/app/page.tsx#L134-L147) vs [`src/app/admin/landing/page.tsx:188-203`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/src/app/admin/landing/page.tsx#L188-L203)
* **Diagnóstico:** El administrador en `/admin/landing` guarda las fotos en la tabla **`landing_gallery`**, mientras que la Landing pública en `page.tsx` consulta la tabla **`landing_moments`**. Las fotos que el administrador suba jamás se muestran al público.
* **Solución EGM:** Unificar `src/app/page.tsx` para consultar la tabla `landing_gallery`.

### 🔴 8. Amenidad "Pet Friendly" vs Reglamento Oficial del Complejo
* **Ubicación:** [`src/app/admin/cabanas/page.tsx:10`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/src/app/admin/cabanas/page.tsx#L10) vs [`src/app/reglamento/page.tsx:65`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/src/app/reglamento/page.tsx#L65)
* **Diagnóstico:** El selector de amenidades incluye "Pet Friendly", contradiciendo la prohibición estricta de mascotas en todo el recinto.
* **Solución EGM:** Eliminar "Pet Friendly" de `AVAILABLE_AMENITIES`.

---

## 3. Bloque B: Fallas Mayores (Majors)

### 🟡 9. Exposición Pública de Contraseñas del Llavero (Vault) en `settings`
* **Ubicación:** [`src/app/admin/infraestructura/page.tsx:10-13`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/src/app/admin/infraestructura/page.tsx#L10-L13) y [`schema_security_saneamiento.sql:98-101`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/schema_security_saneamiento.sql#L98-L101)
* **Diagnóstico:** Las contraseñas de Vercel, DominiosChile y Resend se guardan en `settings`, que tiene lectura pública `USING (true)`.

### 🟡 10. Comprobantes Bancarios en Storage Público
* **Ubicación:** [`migration/parche_test_pms.sql:21-29`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/migration/parche_test_pms.sql#L21-L29)
* **Diagnóstico:** El bucket `payment-receipts` tiene `public: true`, dejando expuestos números de cuenta y datos bancarios por URL.

### 🟡 11. Conflicto de Dominios `.cl` vs `.com`
* **Ubicación:** Layout y SEO usan `ranchocarmelitas.com`, mientras que pasarelas de pago y webhooks usan `ranchocarmelitas.cl`.

### 🟡 12. Inconsistencia de Puertos en Desarrollo (`3000` vs `3005`)
* **Ubicación:** `create-preference` y `webhook` usan `localhost:3005`, mientras que `event-preference` y Next.js usan `3000`.

### 🟡 13. Eventos Diurnos no Sincronizables en `/api/mercadopago/sync`
* **Ubicación:** [`src/app/api/mercadopago/sync/route.ts:31`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/src/app/api/mercadopago/sync/route.ts#L31)
* **Diagnóstico:** Al recibir `EVENT__quoteId__amount`, evalúa `bookingId = 'EVENT'`, fallando con error de casteo UUID.

### 🟡 14. Omisión de `notification_url` en `event-preference`
* **Ubicación:** [`src/app/api/mercadopago/event-preference/route.ts`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/src/app/api/mercadopago/event-preference/route.ts)
* **Diagnóstico:** No define `notification_url`, arriesgando pérdida de notificaciones del webhook para eventos.

### 🟡 15. `/api/send-event-quote-email` sin Autenticación
* **Ubicación:** [`src/app/api/send-event-quote-email/route.ts:4-24`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/src/app/api/send-event-quote-email/route.ts#L4-L24)
* **Diagnóstico:** Cualquier cliente puede enviar un POST y despachar correos falsos de confirmación.

---

## 4. Bloque C: Código Fantasma, Huérfano y Nits

1. **`esquema_produccion.sql`:** Archivo vacío de 0 bytes en la raíz.
2. **`download-logo.js` y `verify-rls.js`:** Scripts ad-hoc obsoletos en la raíz.
3. **`src/components/layout/`:** Carpeta vacía en el árbol de componentes.
4. **`src/lib/setup_audit_logs.sql`:** Script SQL duplicado en carpeta de código TypeScript.
5. **`src/lib/database.types.ts`:** Stub vacío con `[_ in never]: never`.
6. **21 Scripts en `scratch/`:** Scripts de diagnóstico residuales acumulados.
7. **Monolito de 4.837 líneas en `src/app/admin/reservas/page.tsx`:** Debe modularizarse.
8. **Duplicidad Léxica:** `/admin/configuracion` (Canales) vs `/admin/configuraciones` (Ajustes).
9. **Formateo de Fecha `'es-MX'` en lugar de `'es-CL'`:** En `CheckoutForm.tsx` y `CheckoutSuccessPage`.
10. **`@supabase/supabase-js` en `devDependencies`:** Debe moverse a `dependencies` en `package.json`.
