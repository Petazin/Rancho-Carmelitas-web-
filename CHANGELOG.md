# Changelog - Rancho Carmelitas

## [0.7.0] - 2026-03-19

### Agregado

- **Sincronización con GitHub:** Preparación y subida del repositorio oficial a GitHub.
- **Documentación Actualizada:** Revisión de `GEMINI.md`, `README.md` y `CHANGELOG.md` para reflejar el estado actual del proyecto.

## [0.6.2] - 2026-03-18

### Mejorado

- **Calidad de Imágenes HD:** Sustitución de capturas de baja resolución por fotografías profesionales de alta definición (3000x2000) obtenidas de fuentes oficiales (Booking.com).
- **Contenido Auténtico:** Selección rigurosa de fotos de instalaciones reales y huéspedes disfrutando, sin textos publicitarios.

## [0.6.1] - 2026-03-18


### Corregido

- **Sustitución de Contenido IA por Real:** Reemplazo de todas las imágenes generadas artificialmente por fotografías auténticas capturadas de las redes sociales oficiales.
- **Transparencia Visual:** Ajuste de textos para reflejar fielmente las instalaciones reales del Rancho.

## [0.6.0] - 2026-03-18


### Agregado

- **Contenido Real de Redes Sociales:** Integración de información extraída de Instagram y Facebook (Pullally, Papudo).
- **Imágenes Premium Personalizadas:** Sustitución de placeholders genéricos por recursos visuales generados por IA que reflejan la arquitectura y entorno real del Rancho (Cabañas, Piscina, Bosque).
- **Sello de Confianza SERNATUR:** Inclusión visual del registro oficial № 71034 para validación de servicios turísticos.
- **Galería Local:** Implementación de una estructura de archivos en `public/gallery` para manejo de recursos multimedia del sitio.

## [0.5.0] - 2026-03-14

### Agregado
- **Gestión de Usuarios y Roles (RBAC):** Sistema centralizado para administrar el equipo del Rancho.
- **Roles Admin/Staff:** Diferenciación de permisos; solo administradores pueden gestionar usuarios e invitaciones.
- **Invitaciones por Email:** Pipeline seguro usando Supabase Admin API para invitar nuevos colaboradores.
- **Perfiles Dinámicos:** El panel ahora reconoce y saluda al usuario logueado con su nombre real y rol.
- **Seguridad de API:** Endpoints administrativos protegidos mediante validación de sesión y rol en el servidor.

## [0.4.0] - 2026-03-14
### Agregado
- **Galería de Cabañas (Supabase Storage):** Integración nativa con Supabase Storage para subir, almacenar y eliminar archivos físicos (JPG, PNG) directamente desde el panel administrativo.
- **Carrusel Frontend:** Incorporación de un *slider horizontal* en la vista pública de cada cabaña para exhibir la galería completa.
- **Píldoras de Amenidades:** Nuevo seleccionador interactivo visual para amenidades (Wi-Fi, Jacuzzi, etc.) en el CMS.
- **Prevención de Conflictos de Fechas:** Lógicas para inhabilitar visualmente fechas bloqueadas con un widget de calendario customizado.
- **Configuración de Seguridad:** Reglas RLS insertadas en Supabase Storage (Upload Access / Public Access).

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
