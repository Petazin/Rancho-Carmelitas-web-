# Changelog - Rancho Carmelitas

## [0.3.0] - 2026-03-13
### Agregado
- **Panel Administrativo (PMS):** Dashboard central para gestión de la propiedad.
- **Autenticación Segura:** Sistema de login protegido con Supabase Auth y Middleware de Next.js.
- **Gestión de Reservas:** Tabla interactiva capaz de cambiar estados (Pendiente, Confirmada, Cancelada).
- **Gestión de Cabañas:** Interfaz para editar precios, nombres y activar/desactivar alojamientos.
- **Seguridad:** Migración a `@supabase/ssr` para manejo avanzado de sesiones por cookies.

## [0.2.1] - 2026-03-13
### Agregado
- Integración completa con **Resend** para notificaciones por correo electrónico.
- Plantilla de correo premium diseñada con `@react-email/components`.
- Sistema de logs de depuración para la API de correos (activado durante desarrollo).

### Corregido
- Error de renderizado de componentes React en el servidor mediante la instalación de `@react-email/render`.
- Problemas de conectividad de API mediante la validación de variables de entorno en runtime.

## [0.2.0] - 2026-03-13
### Agregado
- Integración con **Supabase** para datos de cabañas y reservas.
- Carga dinámica de cabañas desde la base de datos en Home y Detalle.
- Flujo de reservación funcional: ahora se guardan los datos del cliente en la tabla `bookings`.
- Página de éxito (`/checkout/success`) con código de referencia único.
- Selector de huéspedes dividido en Adultos y Niños.
- Lógica condicional para solicitar edades de niños si aplica.
- Opción de "Otro motivo" en el formulario de viaje con campo de texto expansible.

### Cambios
- Rediseño de selectores de fecha en la vista de cabaña para una mejor UX.
- Reemplazo de todos los datos estáticos (Mocks) por consultas directas a Supabase.

---

## [v0.1.0] - 2024-03-13
### Inicial
- Estructura base del proyecto con Next.js y Tailwind CSS.
- Vistas de Landing Page, Detalle de Cabaña y Checkout (Maquetación).
- Configuración de componentes base (Navbar, Footer, Button).
