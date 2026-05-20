# Changelog - Rancho Carmelitas

## [0.7.4] - 2026-05-20

### Añadido / Mejorado (QA Parte 4)

- **Redondeo Inteligente de Tarifas:** Implementación de redondeo automático hacia abajo (al múltiplo de 1000 más cercano) en el precio total de las reservas.
- **Desglose de Descuentos por Redondeo:** Visualización clara y transparente del "Descuento por redondeo" tanto en la vista previa del cliente (`BookingForm`) como en el resumen de confirmación del checkout (`CheckoutForm`).
- **Formatos Premium de Moneda:** Incorporación de formato de números localizado con separador de miles en los resúmenes financieros para una estética impecable.
- **Sugerencia de Abono en Confirmación:** Al momento de registrar un pago para confirmar la reserva en el PMS, el sistema calcula de forma dinámica y pre-rellena el campo del abono con el 50% recomendado del saldo neto a pagar, incluyendo un mensaje descriptivo.
- **Diferenciación de Reservas en Calendario:** Visualización avanzada con código de colores en el calendario del Dashboard para distinguir claramente entre reservas Pendientes (Amarillo `🟡`), Confirmadas sin abono (Naranja `🟠`), Abonadas parcialmente al 50% (Verde `🟢`), Totalmente Pagadas (Azul `🔵`), y Conflictos de Overbooking (Rojo/Alerta `⚠️` / `🔴`). Actualización de la leyenda visual del pie del calendario.
- **Navegación Interactiva de Reservas:** El nombre del huésped en el calendario y en la lista de llegadas inminentes del Dashboard ahora es un enlace interactivo. Al hacer clic, redirige al administrador a la vista de reservas filtrando automáticamente por esa reserva específica.
- **Banner de Filtro Activo:** Implementación de un banner informativo animado de color azul en la sección de reservas cuando hay un filtro por ID activo, permitiendo restablecer la vista de todas las reservas con un solo clic.
- **Nombre de Huésped y Cabaña en Calendario:** Las tarjetas en el calendario del Dashboard ahora muestran la información en formato `Huésped: Cabaña` (ej. `Juan Pérez: Suite del Lago`) en lugar de solo el nombre de la cabaña, permitiendo al administrador identificar de un vistazo a quién pertenece cada reserva.


## [0.7.3] - 2026-05-20

### Añadido / Mejorado (QA Parte 3)

- **Gestión Avanzada de Huéspedes:** Añadida configuración por cabaña para el número máximo de huéspedes adicionales y el porcentaje de cobro extra por persona.
- **Facturación Dinámica:** El sistema de reservas y checkout ahora calcula y desglosa automáticamente el costo de los huéspedes adicionales en el total de la reserva.
- **Configuraciones Globales:** Nueva pantalla de configuración en el panel de administrador para modificar variables globales, comenzando con el número de WhatsApp de contacto.
- **Descuentos Administrativos:** Añadida funcionalidad en el panel de reservas para que los administradores puedan aplicar descuentos manuales y añadir notas a reservas existentes.

## [0.7.2] - 2026-05-20
### Corregido / Mejorado (QA Parte 2)

- **Límite Dinámico de Huéspedes:** Ahora el formulario de reserva impide matemáticamente seleccionar un total de huéspedes mayor a la capacidad máxima de la cabaña + 2 (reservado para cargos extras).
- **Validación Estricta:** El formulario de Checkout ahora impide por completo enviar la reserva si no hay datos de contacto reales en Nombre, Correo y Teléfono (evitando envíos vacíos).
- **Dashboard Administrativo:** El teléfono del huésped ahora es visible en la lista de reservas para facilitar el contacto rápido por WhatsApp.

## [0.7.1] - 2026-05-20
### Corregido / Mejorado (QA Parte 1)

- **Selector de Huéspedes:** Reemplazo de dropdowns nativos en formulario de reservas por un diseño personalizado y animado.
- **Flujo de Facturación:** Inclusión de campos obligatorios (RUT, Razón Social, Giro) al solicitar Boleta/Factura durante el Checkout.
- **Validación de Correo:** Nuevo campo de confirmación de email para evitar errores de contacto.
- **Contacto Proactivo:** Agregado botón de WhatsApp en la página de éxito de reserva para facilitar la gestión del abono.

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
