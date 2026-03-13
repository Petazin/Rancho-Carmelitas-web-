# Proyecto Rancho Carmelitas - GEMINI

Este archivo consolida las decisiones arquitectónicas, convenciones de código y la guía base del proyecto Rancho Carmelitas para la asistencia de Inteligencia Artificial.

## 1. Stack Tecnológico

- **Framework Web:** Next.js (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS y CSS Nativo (Vanilla CSS) enfocado en animaciones y UI premium.
- **Base de Datos & Backend:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth
- **Emails Transaccionales:** Resend (o SMTP configurado en entorno local)
- **Despliegue:** Vercel (Producción)

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

## 4. Estado Actual

Se ha completado la **Fase 1** (UI Base) y la **Fase 2** (Integración de Supabase). El proyecto ya consume datos reales de cabañas y guarda reservaciones en la nube. Actualmente iniciando **Fase 3/4** (Correos y Admin Panel).
