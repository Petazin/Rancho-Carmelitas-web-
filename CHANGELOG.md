# Changelog - Rancho Carmelitas

## [0.9.0] - 2026-05-23

### Añadido / Mejorado (Control de Capacidad, Calendario Interactivo y Configuración de Canales)

- **Calendario Interactivo Premium en Reservas Manuales:** Integración de la elegante interfaz de calendario Stitch UI en el modal de reserva manual del PMS. Consulta en tiempo real las reservas existentes en Supabase para la cabaña elegida y deshabilita/marca en rojo tachado (`bg-red-50 text-red-400 line-through`) las fechas ocupadas para evitar overbookings accidentales, vinculando la selección reactiva a los campos de fecha de solo lectura.
- **Control de Capacidad y Límite de Huéspedes:** Obtención dinámica de la capacidad y adicionales máximos de la cabaña. Si la cantidad ingresada la supera, se muestra un banner de advertencia visual rojo y se bloquea el guardado a menos que el administrador autorice de forma explícita mediante una casilla interactiva de *"Autorizar sobrecapacidad (Reserva de Emergencia)"*.
- **Descuento Unificado de Tipo/Valor en Modal:** Implementación de la selección de descuento porcentual (`%`) y descuento fijo (`$`) en el modal de creación manual de reservas. Realiza la conversión matemática automática a pesos y agrega la información del porcentaje en las notas administrativas de forma transparente.
- **Desacoplamiento Estricto de IVA:** Modificación de la lógica financiera para que el IVA (19%) dependa única y exclusivamente de la casilla *"Suma 19% de IVA para Cálculo de Bruto"*, permitiendo que las reservas asociadas a plataformas o huéspedes directos se calculen sin IVA si el administrador desmarca la casilla.
- **Panel Autogestionable de Configuración de Canales:** Enriquecimiento de la página `/admin/configuraciones` con una sección dedicada premium para agregar y eliminar canales/plataformas con sus respectivas comisiones por defecto en Supabase. Las comisiones ingresadas aquí se propagan automáticamente al selector de plataforma de la reserva manual.

## [0.8.1] - 2026-05-22

### Corregido / Mejorado (Reserva Manual y Desglose Financiero)

- **Remoción de Alertas Restrictivas:** Eliminación de los paneles visuales de overbooking ("Cabaña Ocupada") y capacidad ("Capacidad Máxima Excedida") en la creación de reservas manuales. Se quitó el bloqueo por `alert` en el `onSubmit` del formulario para conceder control y libertad total al administrador.
- **Autopreferencia de Tarifas Reactiva:** Modificación de los inputs de selección de cabaña, fechas, adultos y niños en el modal de reserva manual para usar el helper reactivo `handleCreateFormChange`, garantizando que al cambiar de cabaña o fechas se auto-rellene de forma inmediata el precio base oficial de la cabaña (calculado mediante `calcularTarifaOficial`), permitiendo su edición manual posterior.
- **Saneamiento de Sintaxis JSX:** Reparación completa del bloque roto al pie del modal de reservas manuales (línea de notas administrativas y fragmentos JSX residuales corruptos) que provocaba errores de renderizado/compilación en Next.js.
- **Desglose de Previsualización Avanzada:** Adición de la visualización del campo `Precio Bruto (Sin IVA)` en el desglose del huésped en el modal manual, permitiendo previsualizar los cálculos de IVA y comisiones tal como se hace en la edición inline de la tabla de reservas.

## [0.8.0] - 2026-05-22

### Añadido / Mejorado (Evolución de Cobros y Liquidación)

- **Sistema Parametrizable de Comisiones:** Creación e integración de la tabla `plataformas` en Supabase para almacenar canales de reserva (Booking, Airbnb, etc.) con sus comisiones por defecto en %.
- **Campos Estáticos en Reservas:** Modificación de la tabla `bookings` para registrar estáticamente `plataforma_id`, `plataforma_comision_aplicada` (el porcentaje específico al reservar) y `admin_comision_porcentaje` (comisión de administración interna).
- **Selector de Plataforma al Editar/Crear:** Carga relacional en la UI de reservas de las plataformas disponibles. Al seleccionar una plataforma, se pre-rellena el porcentaje sugerido, con opción de sobreescritura manual.
- **Cálculo Dinámico sobre Precio Bruto:** Lógica en frontend para calcular la comisión de plataforma sobre el Precio Bruto de la reserva (antes de IVA, dividiendo por 1.19 si la reserva requiere factura en base a las regulaciones de Chile).
- **Ficha de Liquidación Interna Privada:** Incorporación en el detalle de la reserva de una tarjeta interactiva en tiempo real ("Ficha de Liquidación") exclusiva para administradores. Calcula la comisión de administración sobre el Total (post-IVA) y el pago neto estimado al dueño.
- **Visualización de Origen en la Lista de Reservas:** Etiquetas personalizadas e interactivas en la tabla de reservas para identificar de inmediato si es una reserva directa (`👤 Directo`) o externa (`🔌 Booking`, `Airbnb`, etc.).
- **Micro-ficha de Liquidación Discreta:** Bloque de uso interno privado desplegado directamente en la columna "Total Pagar" si la reserva cuenta con comisiones registradas.
- **Modal Premium de Creación Manual:** Formulario premium de registro de reservas externas bajo el estándar Stitch UI (bordes de 12px, Inter, color `#11d442`). Incluye los datos del huésped, fechas de estadía, requiere boleta/factura y una sección interactiva de previsualización de costos y liquidación en tiempo real.
- **Desglose de Comisión Externa en Correos:** Modificación de `PaymentConfirmationTemplate.tsx` (Resend) para presentar al cliente el cobro de la comisión de servicio externa de la plataforma en base a su precio bruto.
- **Garantía de Privacidad Absoluta:** Exclusión rigurosa de la comisión de administración interna en las plantillas y flujos de envío de correos electrónicos.

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
