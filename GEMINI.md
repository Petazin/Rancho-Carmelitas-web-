# Proyecto Rancho Carmelitas - GEMINI

Este archivo consolida las decisiones arquitectónicas, convenciones de código y la guía base del proyecto Rancho Carmelitas para la asistencia de Inteligencia Artificial.

## 1. Stack Tecnológico

- **Framework Web:** Next.js (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS y CSS Nativo (Vanilla CSS) enfocado en animaciones y UI premium.
- **Base de Datos & Backend:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth
- **Emails Transaccionales:** [Resend](https://resend.com/) con plantillas de React Email.
- **Despliegue:** [Vercel](https://vercel.com).

## 2. Decisiones de Diseño (Stitch UI)

- **Tipografía:** Inter
- **Color Principal:** #11d442 (Verde Rancho)
- **Bordes:** `ROUND_TWELVE` (Radios de 12px)
- **Estética:** Premium, responsiva, moderna y con microinteracciones.

## 3. Convenciones de Desarrollo

- **Estructura de Carpetas:**
  - `src/app/`: Rutas generales de Next.js (Landing, checkout).
  - `src/app/admin/`: Rutas protegidas del PMS.
  - `src/components/`: Componentes reutilizables.
  - `src/lib/`: Utilidades, configuración de Supabase.
  - `src/styles/`: Archivos CSS globales y utilidades.
- **Idioma:** Todos los comentarios, documentación (como este archivo), README, y mensajes de Commit de Git DEBEN ESTAR EN ESPAÑOL.
- **Flujo de Trabajo:**
  - Desarrollar las vistas en local.
  - Probar conectividad con Supabase.
  - Las ejecuciones de prueba las solicita la IA pero las corre el usuario.

Se ha completado la **Fase 1** (UI Base), la **Fase 2** (Integración de Supabase), la **Fase 3** (Correos), la **Fase 4** (PMS y Galería), la **Fase 4.5 (Gestión de Usuarios y Roles)** y la **Personalización de Contenido Real (Social Media Sync)**. Actualmente se está completando la sincronización con el repositorio oficial en GitHub.

El sistema ahora soporta:

- **RBAC (Role Based Access Control):** Perfiles de `admin` y `staff`.
- **Panel de Gestión de Equipo:** Los administradores pueden invitar nuevos colaboradores por correo y gestionar sus roles.
- **Protección de Rutas:** Seguridad en el servidor y en la UI basada en el rol del usuario autenticado.
- **Identidad Dinámica:** Reconocimiento personalizado de cada integrante del equipo en el panel administrativo.
- **Contenido Localizado:** Landing page con fotos reales de las instalaciones y datos oficiales (SERNATUR, Pullally).

Próximos pasos: **Fase 5** (QA final, optimización de carga y despliegue en producción).
