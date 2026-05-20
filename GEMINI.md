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
- **Redondeo de Tarifas a 1000:** Algoritmo de redondeo automático hacia abajo (al múltiplo de 1000 más cercano) para el total de la reserva, mostrando de manera transparente el desglose del descuento por redondeo en la interfaz de usuario.
- **Abono Sugerido Automático (50%):** Al confirmar una reserva en el panel de administración, el sistema pre-rellena automáticamente el input de pago con el 50% sugerido del total a pagar (neto de descuentos manuales) y muestra el valor sugerido formateado.
- **Diferenciación de Reservas en Calendario:** Visualización avanzada con código de colores en el calendario del Dashboard para distinguir claramente entre reservas Pendientes (Amarillo `🟡`), Confirmadas sin abono (Naranja `🟠`), Abonadas parcialmente al 50% (Verde `🟢`), Totalmente Pagadas (Azul `🔵`), y Conflictos de Overbooking (Rojo/Alerta `⚠️` / `🔴`).
- **Navegación y Filtrado Reactivo por Reserva:** El hacer clic en el nombre del huésped en el calendario y en la lista de próximas llegadas inminentes del Dashboard ahora redirige a la gestión de reservas filtrando dinámicamente por el ID de la reserva seleccionada, mostrando un banner azul interactivo que permite limpiar el filtro instantáneamente.
- **Detalle de Huésped y Cabaña en Calendario:** Las tarjetas de reserva del calendario del Dashboard ahora muestran la información en formato `Huésped: Cabaña` (ej. `Juan Pérez: Suite del Lago`) en lugar de solo la cabaña, facilitando una rápida identificación.

Próximos pasos: **Fase 5** (QA final, optimización de carga y despliegue en producción).

