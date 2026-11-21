# 🔒 Documentación Técnica: Seguridad, RLS y Autenticación

**Arquitectura:** Modelo Defensivo Multi-Capa (Zero-Trust)  
**Mecanismos:** Row Level Security (RLS) en PostgreSQL, Next.js Middleware, Cookies HTTP-only PKCE y Roles RBAC  

---

## 1. Modelo de Seguridad Multi-Capa

El sistema aplica seguridad en tres capas concéntricas:

```
[ Capa 1: Red y Perímetro ]
       │  Next.js middleware.ts (Sesiones en cookies, intercepción de rutas /admin)
       ▼
[ Capa 2: Backend de Aplicación ]
       │  Server Actions / API Routes con helper isStaffOrAdmin() y validación de BD
       ▼
[ Capa 3: Base de Datos Relacional ]
       │  PostgreSQL Row Level Security (RLS) y Triggers SECURITY DEFINER
```

---

## 2. Guardián de Rutas: `src/middleware.ts`

El archivo [`src/middleware.ts`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/src/middleware.ts) intercepta cada petición entrante:
* **Rutas `/admin/:path*`:** Valida la sesión activa invocando `supabase.auth.getSession()` a través del cliente `@supabase/ssr`. Si no existe sesión, redirige inmediatamente a `/login`.
* **Ruta `/login`:** Si el usuario ya cuenta con una sesión válida y activa, lo redirige automáticamente al Dashboard `/admin` para evitar inicios de sesión redundantes.
* **Manejo de Cookies:** Sincroniza y renueva los tokens de sesión de Supabase Auth en las cabeceras HTTP de respuesta mediante `cookies.get`, `cookies.set` y `cookies.remove`.

---

## 3. Matriz de Roles y Permisos (RBAC)

La tabla `public.profiles` almacena el rol asignado a cada cuenta de usuario. Existen cuatro niveles preestablecidos:

| Rol | Identificador | Alcance Operativo | Pantallas Accesibles en Sidebar |
| :--- | :--- | :--- | :--- |
| **Administrador** | `'admin'` | Control total del sistema, finanzas, usuarios, auditoría y gobernanza. | Dashboard, Reservas, Cabañas, Usuarios, Auditoría, Canales, Landing, Configuraciones, Gobernanza, Desarrollo. |
| **Personal (Staff)** | `'staff'` | Operación diaria del complejo, recepción y gestión de reservas. | Dashboard, Reservas, Cabañas. |
| **Recepcionista** | `'recepcion'` | Check-in, check-out y visualización de disponibilidad de calendario. | Dashboard, Reservas, Cabañas (solo lectura/operaciones). |
| **Mantenimiento** | `'mantenimiento'` | Housekeeping, estado de limpieza y liberación de cabañas. | Dashboard, Cabañas (panel de housekeeping). |

### Helper de Autorización Backend: `isStaffOrAdmin()`
Ubicado en [`src/lib/server-auth.ts`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/src/lib/server-auth.ts), es utilizado por las API Routes de Next.js para asegurar que operaciones sensibles (cancelaciones, envíos de correo administrativo o gestión de usuarios) solo puedan ser invocadas por personal operativo con sesión activa y rol verificado en la base de datos.

---

## 4. Estado Detallado de Políticas Row Level Security (RLS)

Todas las tablas de la base de datos tienen activado `ROW LEVEL SECURITY`. A continuación se detalla la configuración de políticas aplicadas en PostgreSQL:

| Tabla | Operación | Rol de Base de Datos | Cláusula USING / WITH CHECK | Explicación de Seguridad |
| :--- | :--- | :--- | :--- | :--- |
| `bookings` | `ALL` | `authenticated` | `USING (true) WITH CHECK (true)` | El personal administrativo autenticado tiene control total sobre las reservas. |
| `bookings` | `INSERT` | `anon, authenticated` | `WITH CHECK (true)` | Permite el registro de nuevas reservas (respaldo para cotizador). |
| `bookings` | `SELECT` | `anon` | **DENEGADO (Sin política)** | **Blindaje v1.9.0:** Los datos personales de huéspedes (RUT, patentes, emails, teléfonos) quedan bloqueados para visitantes o bots anónimos. |
| `cabins` | `SELECT` | `public (anon)` | `USING (true)` | Permite que los visitantes consulten el catálogo y detalles de las cabañas. |
| `cabins` | `ALL` | `authenticated` | `USING (true) WITH CHECK (true)` | Solo administradores y staff pueden crear, editar o eliminar cabañas. |
| `plataformas` | `SELECT` | `public (anon)` | `USING (true)` | Lectura pública de canales y comisiones para cotizadores. |
| `plataformas` | `ALL` | `authenticated` | `USING (true) WITH CHECK (true)` | Edición exclusiva para personal autenticado. |
| `cabin_closures` | `SELECT` | `public (anon)` | `USING (true)` | Permite que el calendario público bloquee fechas cerradas. |
| `cabin_closures` | `ALL` | `authenticated` | `USING (true) WITH CHECK (true)` | Edición exclusiva para personal autenticado. |
| `profiles` | `SELECT` / `ALL`| `authenticated` | `USING (true) WITH CHECK (true)` | Solo el personal autenticado puede consultar perfiles de usuarios. |
| `settings` | `SELECT` | `public (anon)` | `USING (true)` | Permite al frontend público leer variables como `whatsapp_number` o datos de contacto. *(Ver Sección de Incongruencias y Hallazgos).* |
| `settings` | `ALL` | `authenticated` | `USING (true) WITH CHECK (true)` | Edición exclusiva para personal autenticado. |
| `booking_payments` | `SELECT` | `public (anon)` | `USING (true)` | Permite consultar historial de pagos asociados a la reserva. |
| `booking_payments` | `ALL` | `authenticated` | `USING (true) WITH CHECK (true)` | Solo personal autenticado o webhooks con Service Role pueden registrar pagos. |
| `landing_settings` | `SELECT` | `public (anon)` | `USING (true)` | Consulta pública de los textos del Hero y logo. |
| `landing_settings` | `ALL` | `authenticated` | `USING (true) WITH CHECK (true)` | Edición exclusiva para administradores. |
| `landing_gallery` | `SELECT` | `public (anon)` | `USING (true)` | Galería de imágenes pública. |
| `landing_gallery` | `ALL` | `authenticated` | `USING (true) WITH CHECK (true)` | Subida y ordenamiento exclusivo para administradores. |
| `event_quotes` | `ALL` | `authenticated` | `USING (true) WITH CHECK (true)` | Gestión completa de cotizaciones de eventos para personal autenticado. |
| `event_quotes` | `SELECT` | `anon` | `USING (true)` | Lectura pública para el portal de pago de eventos. *(Ver Sección de Incongruencias).* |
| `audit_logs` | `SELECT` | `authenticated` | `USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))` | **Estricto:** Solo usuarios con rol `'admin'` pueden consultar la bitácora histórica. |

---

## 5. Almacenamiento Seguro de Archivos (Supabase Storage)

El sistema utiliza dos buckets de almacenamiento con políticas de acceso:
1. `cabin-images`:
   - Almacena fotografías de cabañas (`cabins/`), imágenes de la landing page (`landing/`), logotipos (`logo/`) y capturas de bugs del roadmap (`bugs/`).
   - Lectura pública (`SELECT`) permitida para despliegue en la web.
   - Subida y borrado restringidos a usuarios autenticados.
2. `payment-receipts`:
   - Almacena los comprobantes de transferencias bancarias y abonos subidos en el PMS o el checkout.
   - Lectura y escritura restringidas a personal autenticado con sesión activa.

---

## 6. Protección contra Bots y Abuso de Recursos

1. **Ofuscación de Correo Institucional:** En la landing page pública ([`src/components/ui/SocialSection.tsx`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/src/components/ui/SocialSection.tsx)), la dirección de correo no está en texto plano, sino que se renderiza mediante un componente reactivo ofuscado para neutralizar scrapers de spam.
2. **Endpoints de Correo Protegidos:**
   - `/api/send-cancelation` y `/api/send-checkout-thankyou` requieren sesión administrativa verificada (`isStaffOrAdmin()`). Responden con `401 Unauthorized` si un bot intenta invocarlas directamente.
   - `/api/send-confirmation` y `/api/send-payment-confirmation` validan que el `bookingId` exista en Supabase y que el `guestEmail` coincida con el email registrado en la base de datos antes de enviar cualquier mensaje, evitando abuso de cuota de Resend.
