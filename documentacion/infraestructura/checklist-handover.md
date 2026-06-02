# 📋 Runbook de Handover — Traspaso Definitivo de Infraestructura

Este documento sirve como la **Hoja de Ruta de Handover** definitiva para garantizar el aislamiento y la entrega de todas las credenciales técnicas del desarrollador original a la administración del Rancho de forma independiente y segura.

---

## 🏁 Checklist de Handover Secuencial

Siga este orden estricto de tareas para completar la migración de infraestructura sin fugas de datos ni interrupción de servicios:

### 1. 🪪 Fase Inicial: Identidad y Seguridad (Completado)
- `[x]` Unificar la propiedad de los servicios bajo el correo institucional **`rancho.carmelitas.6@gmail.com`**.
- `[x]` Cambiar la contraseña de la cuenta del correo y guardarla en el Vault administrativo de la aplicación.
- `[x]` Verificar que el dominio `ranchocarmelitas.com` en DominiosChile esté asociado a la cuenta del Rancho.

### 2. 🛢️ Fase Central: Backend & Auth en Supabase (Completado)
- `[x]` Crear una cuenta corporativa en Supabase utilizando el correo unificado del Rancho.
- `[x]` Levantar el nuevo proyecto e importar los esquemas relacionales DDL del PMS y de la Landing Page.
- `[x]` Ejecutar el script seguro en Node.js de importación para migrar los perfiles y contraseñas cifradas del staff de `auth.users` preservando sus IDs únicos.
- `[x]` Copiar las nuevas llaves API de Supabase (`URL`, `ANON_KEY`, `SERVICE_ROLE_KEY`).

### 3. 🔌 Fase de Despacho: Mailing en Resend (Completado)
- `[x]` Crear una cuenta corporativa en Resend usando el correo del Rancho.
- `[x]` Dar de alta el dominio `ranchocarmelitas.com` en el panel de Resend Domains.
- `[x]` Añadir los registros DKIM y SPF (TXT/MX) en las zonas DNS para habilitar la firma de entregabilidad segura.
- `[x]` Generar la nueva API Key de envío de Resend.

### 4. 🚀 Fase de Hosting: Traspaso en Vercel (Completado)
- `[x]` Invitar al correo del Rancho como miembro administrador en el proyecto de Next.js en Vercel.
- `[x]` Aceptar la invitación y transferir la propiedad legal del proyecto al equipo corporativo.
- `[x]` Desvincular la cuenta del desarrollador original de los miembros del proyecto.
- `[x]` Reemplazar las variables de entorno de producción en Vercel por las nuevas credenciales de Supabase, Resend y la clave simétrica `ENCRYPTION_SECRET`.
- `[x]` Realizar un Redeploy con limpieza de caché en producción para aplicar los cambios en caliente.

### 5. 🔑 Fase Final: Parametrización y Vault in-app (Completado)
- `[x]` Reemplazar las referencias quemadas (*hardcoded*) de correo en el endpoint `send-confirmation/route.tsx` para consultar los datos dinámicamente de Supabase settings.
- `[x]` Activar el panel `/admin/infraestructura` e ingresar las claves del Llavero Seguro (Vault) para accesos de DominiosChile y Vercel.
- `[x]` Realizar pruebas de humo (envío de correos de confirmación y flujo de reservas) confirmando la operatividad del ecosistema al 100% de manera independiente.
