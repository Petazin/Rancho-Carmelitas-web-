# Changelog - Rancho Carmelitas

## [1.3.8] - 2026-06-01

### Añadido / Mejorado (Flujo Completo de Restablecimiento y Renovación de Contraseñas v1.3.8)

- **Acción Inteligente del Administrador:** Modificación de `/api/admin/users/route.ts` para que, en caso de pulsar "Reenviar" sobre un colaborador cuya cuenta de Supabase ya ha sido confirmada y está activa, envíe automáticamente un correo oficial de restablecimiento/renovación de contraseña utilizando `auth.resetPasswordForEmail` y retorne un mensaje explicativo al panel administrativo.
- **Hotfix de Compilación de Producción en Vercel:** Se corrigió un error de tipado en `src/app/api/admin/users/route.ts:152` donde se invocaba `inviteUserByEmail` directamente sobre `supabaseAdminLocal.auth` en lugar del namespace administrador `supabaseAdminLocal.auth.admin.inviteUserByEmail`, resolviendo de inmediato el fallo en la nube de Vercel.
- **Auditoría Trace Trail Enriquecida:** Actualización de `src/app/admin/auditoria/page.tsx` para interpretar los nuevos logs de auditoría manuales del backend:
  * Si la acción en perfiles es un reenvío de invitación, renderiza el timeline con `📩` y una descripción en lenguaje natural en español.
  * Si la acción es un envío de restablecimiento de contraseña, renderiza el timeline con `🔑` y una descripción detallada en español.
- **Mensajería Reactiva en el Panel de Miembros:** Actualización en `src/app/admin/usuarios/page.tsx` para que el alert despliegue el mensaje personalizado devuelto por el backend en lugar de un texto fijo genérico, permitiendo al administrador saber con precisión qué tipo de correo se envió.
- **Interfaz de Auto-servicio en Acceso (`/login`):** Rediseño y evolución completa de `src/app/login/page.tsx` incorporando un sistema interactivo de 3 vistas fluidas con transiciones de diseño premium:
  * **Vista 1 (Login Tradicional):** Añade el botón "¿Olvidaste tu contraseña?" que transiciona a la segunda vista.
  * **Vista 2 (Solicitar Recuperación):** Formulario para ingresar el correo y recibir el enlace autogestionado de restauración mediante `resetPasswordForEmail`.
  * **Vista 3 (Establecer Nueva Contraseña):** Se activa dinámicamente mediante `useEffect` al escuchar cambios de hash (`#type=recovery` o `access_token`) en la URL cuando el usuario regresa del enlace de Supabase. Permite ingresar y validar una nueva contraseña, actualizándola de forma segura en Supabase Auth mediante `supabase.auth.updateUser` y redirigiendo al panel administrativo.

## [1.3.7] - 2026-06-01

### Añadido / Mejorado (Auditoría de Reenvío de Invitaciones de Correo v1.3.7)

- **Control Temporal en Base de Datos (`updated_at`):** Creación del script SQL `schema_update_reinvite_audit.sql` para inyectar de forma defensiva la columna `updated_at` a la tabla pública `profiles` en Supabase.
- **Sincronización en Backend (Next.js API):** Modificación en la API de gestión de usuarios (`src/app/api/admin/users/route.ts`) para registrar y actualizar la marca de tiempo `updated_at` con la fecha actual del servidor cada vez que un administrador invita, reenvía una invitación de correo SMTP o actualiza los datos de un colaborador.
- **Detección e Interpretación en Lenguaje Natural en el Timeline:** Actualización del panel de Auditoría (`src/app/admin/auditoria/page.tsx`) ampliando la función `getNaturalLanguageExplanation(log)` para identificar cambios exclusivos en el campo `updated_at` en `profiles`. Esto permite redactar fluidamente eventos con el icono de correo `📩` indicando de forma explícita que se reenvió la invitación al colaborador, al mismo tiempo que se excluyó este campo del diff técnico comparativo de campos modificados para evitar ruido visual en la UI.

## [1.3.6] - 2026-06-01

### Corregido / Mejorado (Hotfix de Redirección Robusta de Invitaciones en Producción v1.3.6)

- **Redirección Defensiva de Invitación a Colaboradores:** Se implementó una lógica de origen defensiva (`siteOrigin`) en el endpoint API de administración de usuarios (`src/app/api/admin/users/route.ts`). El sistema ahora detecta de forma activa si el flujo opera en entorno local (`localhost:3000`) o en la nube. Si es en la nube, fuerza estrictamente el uso del dominio oficial de producción `https://ranchocarmelitas.com` en el parámetro `redirectTo` enviado a Supabase Auth. Esto previene de forma rígida que se generen enlaces de confirmación dirigidos al servidor local de desarrollo (`localhost:3000`) cuando las invitaciones o reenvíos de invitaciones son gestionados desde el panel en producción.

## [1.3.5] - 2026-05-30

### Corregido / Mejorado (Hotfix de Renderizado Dinámico en Tiempo Real v1.3.5)

- **Soporte de Autogestión Inmediata en el Home:** Se inyectó la directiva `export const dynamic = 'force-dynamic';` al inicio de la Landing Page pública (`src/app/page.tsx`). Esto fuerza a Next.js a desactivar la compilación estática (SSG) de la página principal en Vercel, permitiendo realizar consultas en caliente y en tiempo real a Supabase en cada visita. De esta forma, cualquier cambio realizado por el administrador en `/admin/landing` (cambios en el lema, textos del Hero, logotipo del Rancho o fotos de la Galería de Momentos) se refleja de inmediato en `ranchocarmelitas.com` sin requerir reconstrucciones ni nuevos despliegues del sitio en la nube.
- **Renderizado Dinámico en Detalles de Cabañas:** Se inyectó la misma directiva `export const dynamic = 'force-dynamic';` en la ruta dinámica pública de cabañas (`src/app/cabins/[id]/page.tsx`), garantizando que la disponibilidad de bloqueos por housekeeping, tarifas, adicionales y la pestaña de identidad local de Pullally muestren siempre información fresca y sin caché en producción.

## [1.3.4] - 2026-05-30

### Añadido / Mejorado (Cabañas Narrativas e Identidad de Pullally con Pestañas Dinámicas v1.3.4)

- **Campos Narrativos en Base de Datos:** Creación y despliegue del script de base de datos `schema_update_cabana_narrativa.sql` para inyectar cuatro nuevas columnas seguras en la tabla `cabins` de Supabase: `slogan` (lema/bajada poética), `origin_title` (título de sección de origen), `origin_description` (reseña histórica/local de conexión) y `fun_fact` (dato curioso destacado de Pullally).
- **Módulo de Edición e Inserción Narrativa en el PMS:** Modificación integral del panel administrativo de cabañas (`src/app/admin/cabanas/page.tsx`) ampliando los formularios de creación y de edición inline para capturar y guardar de forma estructurada los lemas, reseñas y datos curiosos locales de cada cabaña, sincronizándose en tiempo real con Supabase.
- **Componente de Cliente de Pestañas Dinámicas (Stitch UI):** Creación del componente interactivo `<CabinDetailTabs />` (`src/components/ui/CabinDetailTabs.tsx`) que divide de forma responsiva la información de la cabaña:
  - **Pestaña 1: La Estadía:** Renderiza ordenadamente la descripción física tradicional, la galería secundaria de fotos y la lista de instalaciones/comodidades.
  - **Pestaña 2: El Alma de la Cabaña:** Despliega con transiciones fluidas el Slogan en Serif itálico grande, el origen de su nombre y el recuadro estilizado crema cálida (`bg-[#fef9f3]`) del **Dato Curioso** con icono de bombilla (`💡`) sutilmente animado.
- **Integración Modular en la Vista Pública:** Reemplazo de los bloques estáticos en el Server Component del detalle de cabaña (`src/app/cabins/[id]/page.tsx`) por el nuevo componente interactivo, manteniendo la tarjeta de reservas (`BookingForm`) 100% operativa e inalterada en su comportamiento de checkout.

## [1.3.3] - 2026-05-29

### Añadido / Mejorado (Ampliación de Auditoría Completa en Lenguaje Natural v1.3.3)

- **Triggers de Auditoría Extendida en Supabase:** Creación y despliegue del script de migración SQL `schema_update_auditoria_completa.sql` que asocia el trigger `process_audit_logging()` a las tablas restantes del sistema que carecían de auditoría: `landing_settings` (logotipo y textos del Hero), `landing_gallery` (imágenes de la galería), `settings` (variables de configuración del negocio como WhatsApp, RUT y correos) y `plataformas` (canales de venta externos y comisiones). Esto garantiza que absolutamente cualquier cambio de contenido realizado en el PMS y la página pública quede registrado con precisión milimétrica.
- **Explicaciones Dinámicas en Lenguaje Natural en Español:** Actualización completa del timeline y el inspector en la sección de Auditoría (`src/app/admin/auditoria/page.tsx`). Se programó soporte nativo para estas cuatro tablas dentro de la función `getNaturalLanguageExplanation(log)`, interpretando campos específicos y generando descripciones fluidas y explicativas en español de los cambios visuales, subida/eliminación de fotos, cambios de logotipo, reordenamiento de galería, y alteraciones en las variables comerciales globales.
- **Filtros Adicionales de Auditoría:** Incorporación de las nuevas tablas al selector de filtros del Timeline de Auditoría, facilitando la auditoría y depuración en caliente por parte de los administradores.

## [1.3.2] - 2026-05-29

### Añadido / Mejorado (Despliegue Exitoso en Vercel & Vinculación de Dominio v1.3.2)

- **Puesta en Marcha en Vercel:** Compilación e integración exitosa del pipeline de Vercel en base al commit `3ec5989`. La aplicación se encuentra en línea y 100% operativa en su URL directa.
- **Configuración DNS de Producción:** Vinculación exitosa del dominio propio `ranchocarmelitas.com` en Vercel. Se configuraron en el proveedor de dominios (Dominios Chile) el registro tipo `A` apuntando a la IP Anycast regional `216.198.79.1` y el subdominio `www` tipo `CNAME` apuntando a la dirección de validación delegada `3f849c1cb6125e21.vercel-dns-017.com`.
- **Propagación y Certificado SSL:** Los registros DNS fueron validados con éxito a nivel global por los servidores DNS de Google (`8.8.8.8`). Vercel generó y activó automáticamente el certificado de seguridad SSL (HTTPS), asegurando una conexión segura y cifrada para todos los usuarios.

## [1.3.1] - 2026-05-29

### Corregido / Mejorado (Hotfix de Build de Producción en Vercel v1.3.1)

- **Error de Tipado en Acceso a Cabaña de Reserva:** Corrección del error de TypeScript en `src/app/admin/cabanas/page.tsx:156` donde el tipo de `c.cabin` inferido por la consulta de Supabase era tratado estrictamente como un array de objetos (`{ name: any; }[]`) en lugar de un objeto plano. Se introdujo una comprobación segura (`Array.isArray(c.cabin) ? c.cabin[0] : (c.cabin as any)`) que extrae de forma defensiva el primer elemento del array si existe, o utiliza la aserción de tipo si es un objeto simple, neutralizando el fallo de compilación estática y habilitando que el pipeline de Vercel complete el build exitosamente.
- **Falta de Propiedad en Interfaz Cabin:** Corrección del error de compilación en `src/app/admin/cabanas/page.tsx:558` donde la verificación del estado de aseo de housekeeping (`housekeeping_status === 'Necesita Aseo'`) fallaba porque la propiedad `housekeeping_status` no estaba declarada en la interfaz estática `Cabin`. Se agregó `housekeeping_status?: string` en la declaración de la interfaz de TypeScript, erradicando el error estático de compilación de producción.
- **Falta de Propiedad logo_url en Interfaz LandingSettings:** Corrección del error de compilación en `src/app/admin/landing/page.tsx:92` donde el guardado del Hero Banner fallaba porque la propiedad `logo_url` no estaba definida en la interfaz estática `LandingSettings`. Se añadió `logo_url?: string` en la declaración de la interfaz de TypeScript, neutralizando el fallo de compilación.
- **Firma de Argumentos en saveEdit:** Corrección de la llamada en `src/app/admin/reservas/page.tsx:2585` donde el botón de guardar invocaba `saveEdit(booking.id)` pasando una clave de ID que la función no requiere, puesto que lee y actualiza a partir del estado de React `editingBooking`. Se removió el argumento innecesario de la llamada (`saveEdit()`), erradicando el fallo de compilación.
- **Inconsistencia de Tipos en Valor de Descuento:** Corrección del error de compilación en `src/app/admin/reservas/page.tsx:3162` debido a la comparación estricta del string `createForm.discount_value` con el valor numérico `0`. Se removió la comparación numérica sin overlap (`=== 0`), manteniendo las comparaciones exclusivas de string (`=== '0' || === ''`), satisfaciendo las restricciones de TypeScript.
- **Saneamiento de database.types.ts:** Corrección de un fallo crítico del compilador provocado por la corrupción del archivo `src/lib/database.types.ts`. El archivo contenía texto residual de instalación de `npx` ("Need to install the following packages...") y estaba guardado en codificación UTF-16 LE generada por PowerShell. Se sobrescribió con una estructura de tipos TypeScript válida en UTF-8, erradicando el error estático de sintaxis.

## [1.3.0] - 2026-05-27

### Reinicio Operacional y Carga Masiva (Inicio de Datos Reales)

- **Reinicio Total de Base de Datos de Prueba:** Se eliminaron de forma irreversible y confirmada por el propietario todos los datos de prueba del sistema. Las tablas limpiadas son: `bookings`, `booking_payments`, `cabin_closures`, `cabins`, `plataformas`, `audit_logs` y `landing_gallery`. La tabla `landing_settings` fue restaurada a sus valores por defecto del Hero Banner.
- **Preservación de Usuarios:** La tabla `profiles` con los **2 usuarios** registrados del equipo fue preservada completamente e intacta.
- **Módulo de Carga Masiva e Importación Histórica:** 
  - **Plantilla CSV del Historial:** Creación de [`plantilla_carga_masiva.csv`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/migration/plantilla_carga_masiva.csv) delimitada por punto y coma (`;`), lista para rellenarse con datos reales y compatible de forma nativa con Excel de Windows.
  - **Archivo de Ejemplo:** Creación de [`ejemplo_carga_masiva.csv`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/migration/ejemplo_carga_masiva.csv) con datos basados en el Excel real de origen (ej. Empresa ERE, Constanza Soto, Broyan Rojas) que ilustra cómo mapear el control diario a registros relacionales históricos tabulares.
  - **Script de Importación Inteligente:** Creación de [`importador.js`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/migration/importador.js) que lee el CSV, normaliza formatos de fecha y RUT chileno, crea dinámicamente las cabañas y canales de venta faltantes, inserta de forma segura las reservas y registra los pagos históricos acumulados en la tabla relacional `booking_payments` usando Supabase.
- **Estado:** El sistema queda en estado cero y con el motor de carga masiva listo para recibir todo el historial de reservas de Rancho Carmelitas (2023-2026).


## [1.2.6] - 2026-05-27

### Corregido / Mejorado (Registro de Bloqueo en Auditoría v1.2.6)

- **Detección Dinámica de banned_until en Auditoría:** Modificación en la función `getNaturalLanguageExplanation` dentro de `src/app/admin/auditoria/page.tsx` para interceptar si la propiedad `banned_until` en la tabla pública `profiles` sufre modificaciones durante un `UPDATE`.
- **Normalización Defensiva Coalescente:** Se inyectó coalescencia nula (`|| null`) en la comparación de `banned_until` para normalizar los valores vacíos de baneo (`null` y `undefined`). Esto neutraliza de raíz los falsos positivos de reactivación/desbloqueo al actualizar perfiles históricos que no contenían explícitamente esa clave en su estructura anterior.
- **Íconos y Explicación Contextualizada:** Si se suspende y bloquea a un colaborador de pruebas, se traduce a lenguaje natural detallando al administrador operador, el usuario bloqueado y el motivo del bloqueo (`block_reason`) con el ícono `🔒`. Si se desbloquea al usuario, se ilustra su reactivación con el ícono `🔓`.

## [1.2.5] - 2026-05-27

### Corregido / Mejorado (Hotfix Definitivo de Reactividad en Check-In v1.2.5)

- **Inyección Reactiva Inmediata en Check-In:** Modificación en la función `handleAddPmsPayment` en `reservas/page.tsx` para inyectar localmente y en caliente el nuevo pago registrado directamente en el array `booking_payments` de la reserva seleccionada para Check-In (`selectedBookingForCheckIn`), además de la de pagos múltiples. Esto garantiza que el modal de Check-In re-renderice instantáneamente el saldo pendiente a `$0` (`✓ Pagado 100%`) y active al segundo el botón `"🚗 Completar Check-In & Entregar Cabaña"` en color verde Rancho sin forzar cierres de modal ni esperas asíncronas de red.
- **Simplificación del onClick:** Eliminación de la consulta redundante de red a Supabase en el callback del botón azul `"✓ Registrar Pago de Saldo"` en el modal de Check-In, delegando la reactividad al flujo centralizado y optimizado de `handleAddPmsPayment`.

## [1.2.4] - 2026-05-27

### Corregido / Mejorado (Hotfix de Reactividad en Check-In v1.2.4)

- **Consulta en Caliente de Supabase:** Intento preliminar de solucionar el bug de reactividad diferida en el Check-in mediante la consulta en caliente a Supabase de la reserva específica (`freshBooking`) en el `onClick` del botón azul del Check-in, que posteriormente se mejoró y simplificó en la v1.2.5 con la inyección local directa.

## [1.2.3] - 2026-05-27

### Añadido / Mejorado (Sincronización Total de Cobros y Botones Transformables v1.2.3)

- **Auditoría Cruzada de Pagos Rápidos:** Modificación del flujo de confirmación rápida de fila (`confirmPaymentAndBooking`) para registrar de forma directa el abono de bienvenida en la tabla relacional `booking_payments`. Esto unifica el origen de los datos y asegura que el panel de historial y transacciones (`💳 Pagos`) liste y sume este pago inicial de forma automática, manteniendo consistencia absoluta.
- **Sugerencia de Faltante en Modal Rápido:** Rediseño del modal de confirmación rápida de fila para calcular el abono previo acumulado (restando registros de `booking_payments`) y sugerir exactamente el monto faltante necesario para alcanzar el 50% de la tarifa total de la reserva, pre-llenando el formulario reactivo al instante de abrirse.
- **Botón Reactivo Transformable (Monto Inteligente):** Reemplazo del botón estático de pagos múltiples por un IIFE reactivo. En reservas pendientes, si el monto a abonar ingresado + abonos previos es menor al 50%, el botón permanece azul como `"✓ Registrar Abono"`. Si se alcanza o supera el 50% mínimo, el botón cambia dinámicamente en caliente a color verde oficial y su texto muta a `"✓ Registrar y Confirmar Reserva"`, gatillando la confirmación, auditoría y despacho de correos en un único paso al hacer clic.

## [1.2.2] - 2026-05-27

### Añadido / Mejorado (Control de Abonos, Auto-Confirmación y Sugerencias de Pago v1.2.2)

- **Auto-Confirmación Inteligente al 50% de Abonos:** Incorporación de lógica dentro de `handleAddPmsPayment` en `reservas/page.tsx` para verificar reactivamente si el abono total acumulado (abonos anteriores + abono nuevo) alcanza o supera el 50% de la tarifa total de la reserva pendiente. Si se cumple este umbral, el sistema actualiza automáticamente el estado de la reserva a `'Confirmada'`, asocia los metadatos de auditoría de confirmación en Supabase y realiza una llamada desatendida y asíncrona al endpoint de correo `/api/send-payment-confirmation` para notificar al huésped sobre su reserva definitiva.
- **Banner Dinámico de Sugerencia del 50% en Modal de Pagos:** Diseño de un banner de información de Stitch UI (`bg-orange-50`) inyectado en el modal de pagos múltiples (`paymentsModalOpen`). Muestra de forma destacada el 50% requerido del total y ofrece botones rápidos de pre-llenado interactivos de un solo clic que calculan el 50% exacto o el saldo faltante necesario para alcanzar dicho umbral en reservas en estado `'Pendiente'`.
- **Botón Manual de Confirmación en Fila:** Adición del botón visual `✓ Confirmar` en las acciones de fila para reservas en estado `'Pendiente'`, permitiendo desplegar de forma interactiva el modal de confirmación estándar y abonos iniciales de manera manual ante excepciones de negocio.

## [1.2.1] - 2026-05-27

### Añadido / Mejorado (Mejoras de Control de Negocio y UX v1.2.1)

- **Localización Chilena de Moneda Estricta (es-CL):** Normalización total de la visualización de montos y dinero en toda la plataforma (cotizador público `BookingForm`, cotizador de confirmación `CheckoutForm`, panel operativo PMS `reservas/page.tsx` y Dashboard administrativo `page.tsx`). Reemplazo estricto de `.toLocaleString()` y `$amount` manuales por el helper centralizado `formatMoney(amount)` para forzar punto (`.`) para miles y coma (`,`) para decimales de forma independiente del idioma del navegador del usuario.
- **Formateo y Autocompletado Reactivo de RUT:** Integración del helper `formatRut` en todos los inputs de RUT de la plataforma. Formatea dinámicamente y reactivamente a medida que se digita en los campos de checkout (Titular y Facturación Empresa) y del PMS (modal de creación manual, formulario de edición inline, y modal operativo de Check-in).
- **Cotizador con Edades de Niños Individuales:** Sustitución de la caja de texto única para las edades de los niños en `CheckoutForm.tsx` por inputs numéricos individuales dinámicos y obligatorios correspondientes a la cantidad exacta de niños seleccionados. Las edades son serializadas en un string separado por comas (ej. `"10, 8, 4"`) al persistirse en `children_ages` para mantener el 100% de compatibilidad con la base de datos de Supabase sin migraciones disruptivas.
- **Transparencia en Huéspedes Adicionales y Tarifas:** Incorporación de un banner informativo Stitch UI premium en color naranja suave (`bg-orange-50/60`) en la página pública de detalles de cabaña (`src/app/cabins/[id]/page.tsx`) y en el cotizador de reservas (`BookingForm.tsx`). Detalla claramente la capacidad base, el máximo de adicionales permitidos y el valor exacto del recargo por huésped adicional por noche, previniendo malos entendidos comerciales.
- **Nomenclatura y Código de Colores Consistente en Dashboard:** Actualización de la función `getStatusColor` y de los badges de la tabla *"Próximas Llegadas Inminentes"* en el Dashboard (`src/app/admin/page.tsx`). Traduce los estados a español nativo y normaliza los badges según la nomenclatura y colores del ciclo de vida del PMS (Pendiente `🟡`, Confirmada `🟠`, En Cabaña `🟢`, Completada `🔵`, Cancelada `🔴`).
- **Unificación de Estado "pending" a Español:** Corrección de la inserción de reservas nativas en `CheckoutForm.tsx` para registrarse directamente en español con el estado `'Pendiente'` en la base de datos, manteniendo retrocompatibilidad visual robusta.
- **Visibilidad Extrema del Teléfono en PMS:** Resaltado de alta legibilidad en el teléfono del cliente dentro de la tabla de reservas con un badge premium azul con ícono de llamada (`📞`), facilitando el cierre de tratos por parte de los recepcionistas.
- **Hotfix de Referencias en Checkout (`CheckoutForm.tsx`):** Corrección del error de ejecución de `ReferenceError: confirmEmail is not defined` mediante la inyección del estado `confirmEmail` y `guestPhone` que se habían omitido accidentalmente en los estados de React, restaurando la estabilidad del 100% de la experiencia de reserva.

## [1.2.0] - 2026-05-27

### Añadido / Mejorado (Sistema PMS Unificado de Operaciones v1.2.0 - Fase 2)

- **Gestión Unificada de Pagos Múltiples:** Desacoplamiento total del flujo de pagos en una tabla relacional `booking_payments`, permitiendo recibir múltiples abonos en diferentes monedas/medios (transferencia, cash, tarjeta) con desglose en tiempo real y soporte para subir comprobantes físicos directamente a Supabase Storage.
- **Historial e Histórico de Transacciones (Timeline):** Visualización interactiva premium (Línea de tiempo Stitch UI) en un modal dedicado a pagos para inspeccionar todos los abonos, referencias y comprobantes cargados, con soporte de fallbacks retrocompatibles automáticos para abonos históricos preexistentes.
- **Check-In Operativo Restrictivo y Defensivo:** Flujo asistido mediante el botón `🚗 Registrar Check-In` para reservas confirmadas. Valida y completa de forma obligatoria la ficha del huésped (RUT, Patente, Nacionalidad, Preferencias, Cumpleaños) y restringe de forma estricta el check-in si existe algún cobro pendiente. Permite registrar el pago del saldo pendiente ahí mismo de forma fluida. Al completar, actualiza la cabaña a `Ocupada` y el estado de reserva a `checkin`.
- **Check-Out Físico Asistido:** Flujo guiado por el botón `🔑 Registrar Check-Out` para huéspedes en estadía. Requiere que el recepcionista corrobore físicamente la recepción de llaves y la inspección general de la cabaña, con captura de notas/daños y actualización automática del alojamiento a `Necesita Aseo` y la reserva a `checkout`.
- **Panel de Limpieza y Housekeeping Activo:** Módulo premium e interactivo inyectado en la página de Gestión de Cabañas (`src/app/admin/cabanas/page.tsx`). Si alguna cabaña requiere aseo, se despliega una tarjeta de alerta Stitch UI roja pulsante, permitiendo al personal de aseo pulsar `🧼 Registrar Aseo Terminado` para restablecer asíncronamente el estado a `Disponible`.
- **Reportabilidad Financiera y Contabilidad SII:** Pestaña premium `"📊 Reporte Financiero & SII"` en el panel de reservas con filtros por Año y Mes. Realiza el cálculo matemático en caliente del Ingreso Bruto, el IVA Recaudado para declaración tributaria ante el SII (19% sobre reservas con factura), comisiones pagadas a canales (Airbnb/Booking) y la comisión de Rancho Carmelitas, determinando el Ingreso Neto final a transferir al dueño.

## [1.1.5] - 2026-05-27

### Añadido / Mejorado (Eliminación Segura de Cabañas con Validación de Reservas y Rol v1.1.5)

- **Eliminación Defensiva de Cabañas en el PMS:** Implementación del botón "Eliminar" en la sección de administración de cabañas (`src/app/admin/cabanas/page.tsx`), inyectado con estilo Stitch UI rojo, bordes limpios y un ícono interactivo de papelera.
- **Restricción Estricta por Rol (RBAC):** El botón "Eliminar" y la funcionalidad asociada están condicionados y restringidos de forma única para usuarios que posean el rol de administrador (`profiles.role = 'admin'`).
- **Validación en Caliente de Reservas Futuras:** Al invocar la acción de eliminación, el sistema realiza una consulta directa en caliente a la tabla `bookings` de Supabase para buscar reservas activas en curso o a futuro (donde `check_out >= HOY` y el estado no sea `'Cancelada'`).
- **Bloqueo Informativo de Seguridad:** Si se detectan reservas conflictivas, la eliminación se detiene de forma definitiva y se despliega una alerta descriptiva al administrador que lista cada uno de los huéspedes y las fechas correspondientes para que proceda a cancelarlas o reubicarlas antes de dar de baja el alojamiento.
- **Bitácora de Auditoría Automática (Trace Trail):** Al realizar una eliminación permitida, el trigger de PostgreSQL `audit_cabins_trigger` registra de forma transparente y sin interacción humana una entrada de tipo `DELETE` en la tabla `audit_logs`, resguardando el registro anterior en formato JSONB e identificando plenamente al administrador ejecutor.
- **Ajuste de Redondeo Inteligente a la Decena:** A petición del usuario, se modificó el algoritmo de redondeo automático hacia abajo para que aplique sobre la decena (múltiplo de 10) en lugar de los miles. Esta mejora de precisión se propagó transparentemente al cotizador de clientes (`BookingForm.tsx`), al formulario de confirmación final (`CheckoutForm.tsx`) y al cotizador interno de reservas manuales en el PMS (`reservas/page.tsx`).

## [1.1.4] - 2026-05-25

### Añadido / Mejorado (Sección Premium "Ubicación y Comunidad" e Integración de Logo v1.1.4)

- **Evolución y Jerarquía Visual de Marca (Branding Hierarchy):** Se implementó un sistema de escala visual para el logotipo oficial en la landing page pública, consagrando la dedicación al arte y la marca del Rancho. Se estructuró en tres niveles jerárquicos:
  *   **Logo Grande (Protagonista / Pieza de Arte):** Inyección majestuosa del logotipo con un tamaño de `w-32` a `w-40` (`w-40 h-40` en pantallas grandes) como elemento central en el **Hero Section**, justo encima del título principal de bienvenida. Cuenta con bordes semitransparentes en cristal, sombras profundas tridimensionales y micro-interacciones de escala al pasar el cursor, brindando un impacto visual espectacular de resort de primer nivel.
  *   **Logos Medianos (Identidad de Sección):** Rediseño de las cabeceras de las secciones clave (Nuestras Cabañas, Galería de Momentos y Reglas de Convivencia) ampliando el isotipo a un tamaño de `w-24` a `w-28` con sombras medias y sutiles efectos de escala dinámicos, permitiendo apreciar nítidamente los detalles artísticos del logo.
  *   **Logos Sutiles (Identificación y Respaldo):** Se conservó el logo en tamaños discretos en el Navbar (`w-10`) para un scroll no invasivo, en la tarjeta de SERNATUR (`w-16`) como sello de confianza, y en el Footer (`w-14`) para el cierre de página.
- **Script Local de Descarga Auxiliar:** Se conservó el script de Node.js [`download-logo.js`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/download-logo.js) para descargar de manera inicial el logo oficial de redes como respaldo local en `public/logo.png`.
- **Nuevo Componente Reutilizable `SocialSection`:** Creación de un componente paramétrico y autónomo en `src/components/ui/SocialSection.tsx`, diseñado con iconos SVG nativos optimizados para maximizar el rendimiento de carga y el SEO.
- **Google Maps Interactivo Integrado:** Incorporación de un mapa responsivo y estable de Google Maps centrado con precisión en "Rancho Carmelitas Cabañas, Pullally, Papudo, Chile", integrado mediante iframe con estilos adaptados al modo claro y oscuro del sitio.
- **Tarjetas Sociales Estilizadas en Stitch UI:** Diseño asimétrico y sumamente interactivo para las cuentas oficiales de Instagram (`@ranchocarmelitas`) y Facebook (`rancho.c.pullally`). Cuentan con micro-animaciones al pasar el cursor (`hover-lift`), bordes decorativos dinámicos degradados y un feed visual simulado utilizando fotos reales de las cabañas y piscinas del Rancho Carmelitas.
- **Optimización de Metadatos de SEO:** Ajuste estructural en `src/app/layout.tsx` reemplazando los títulos genéricos de Next.js por metadatos altamente descriptivos y optimizados para buscadores: *"Rancho Carmelitas • Exclusivas Cabañas en Pullally, Papudo"*, incluyendo una descripción cautivadora y palabras clave.
- **Navegación e Integración de Anclajes:** Inyección de enlaces fluidos y consistentes de redes sociales y ubicación física en el Header/Navbar superior ("Ubicación" apuntando a `#location-social`) y en el Footer general del sitio.

## [1.1.3] - 2026-05-25

### Añadido / Mejorado (Comisión de Administración por Defecto Autogestionable v1.1.3)

- **Parámetro Global de Comisión:** Incorporación de la clave de configuración global `default_admin_commission` en el panel de Configuraciones Globales (`/admin/configuraciones`), permitiendo a los administradores parametrizar y actualizar el porcentaje por defecto en Supabase.
- **Auto-relleno Inteligente en Reservas Manuales:** Al abrir el modal de nueva reserva manual en el PMS, el campo `admin_comision_porcentaje` se inicializa dinámicamente con el porcentaje por defecto cargado asíncronamente desde Supabase.
- **Flexibilidad de Edición Individual:** El recepcionista conserva la libertad absoluta de modificar o sobrescribir manualmente el porcentaje en esa reserva individual si se acuerda una tarifa o trato preferencial, respetando y persistiendo el valor personalizado directamente en `bookings.admin_comision_porcentaje`.

## [1.1.2] - 2026-05-25

### Añadido / Mejorado (Ficha de Registro de Huésped y Vehículo - Check-in v1.1.2)

- **Ficha Detalle en Tabla de Reservas:** Integración premium debajo de la información de contacto de una tarjeta fluida Stitch UI. Despliega al instante el RUT o Pasaporte (`🪪`), la Patente/Matrícula del Vehículo (`🚗`), la Nacionalidad/Ciudad de Origen (`🌎`), la Fecha de Nacimiento formateada en español (`🎂`), y las Preferencias u Observaciones del Huésped (`✨`), proporcionando una visibilidad completa de la ficha de Check-in al recepcionista.
- **Edición en Caliente en Formulario Inline:** Inyección de los 5 inputs de registro en el formulario de edición inline del PMS administrativo. Esto permite al recepcionista capturar, completar o corregir en caliente la patente, el RUT o las observaciones del huésped en el momento del Check-in o en cualquier punto del hospedaje previo al check-out.
- **Modal de Creación Manual Enriquecido:** Adición de la tarjeta de inputs *"🪪 Ficha de Registro de Huésped (Check-in Anticipado)"* en el modal de reservas manuales externas del PMS, asegurando que el recepcionista pueda capturar estos datos cruciales al crear reservas administrativas.
- **Reseteo Seguro de Formulario:** Inclusión de lógica segura de reseteo (`guest_rut`, `vehicle_plate`, `guest_nationality`, `guest_preferences`, `guest_birthdate` a cadena vacía `''`) al abrir el modal de creación y tras guardar la reserva en la base de datos de Supabase.
- **Persistencia Transparente en Supabase:** Sincronización y persistencia garantizada en la tabla nuclear `bookings` de Supabase, actualizando el estado reactivo en caliente de React al momento de guardar.

## [1.1.1] - 2026-05-25

### Añadido / Mejorado (Gestión Avanzada, Edición y Bloqueo Nativo de Usuarios v1.1.1)

- **Edición en Caliente de Datos de Equipo:** Implementación del botón "Editar" en la tabla de miembros que abre un modal Stitch UI reactivo para modificar en tiempo real el Nombre Completo, el Celular/Teléfono de Contacto y el Rol Operativo de cualquier colaborador del Rancho.
- **Bloqueo y Suspensión Nativa con Motivo Obligatorio:** Integración nativa con la propiedad de baneo de Supabase Auth (`ban_duration: '87600h'` para bloqueo permanente y `ban_duration: 'none'` para desbloquear). Solicita de forma obligatoria un motivo de bloqueo que se almacena en los metadatos de autenticación y se sincroniza en caliente en la tabla pública de perfiles (`profiles.block_reason` y `profiles.banned_until`), garantizando trazabilidad y transparencia absoluta en el panel.
- **Badges Premium de Visualización de Bloqueo:** Adición de un badge de estado `🔒 BANEADO` con estilo Stitch UI rojo en la tabla de miembros bajo el nombre del usuario bloqueado. Despliega de forma interactiva e inmediata el motivo del bloqueo al pasar el cursor o mediante texto auxiliar descriptivo.
- **Eliminación Definitiva de Colaboradores:** Habilitación de la revocación completa de accesos a la plataforma eliminando de forma física y permanente al colaborador en Supabase Auth y en la tabla de perfiles sincronizada.

## [1.1.0] - 2026-05-25

### Añadido / Mejorado (Bitácora de Auditoría Trace Trail y Roles Dinámicos Fase 1)

- **Triggers de Auditoría en Supabase PostgreSQL:** Creación del script `src/lib/setup_audit_logs.sql` que inicializa de forma automatizada y segura la tabla centralizada `audit_logs` con seguridad de filas (RLS) habilitada únicamente para roles de administrador. Registra de forma proactiva cada `INSERT`, `UPDATE` o `DELETE` sobre las tablas nucleares del PMS (`bookings`, `cabins`, `cabin_closures` y `profiles`), comparando mediante diferencias JSONB los datos anteriores (`old_data`) y posteriores (`new_data`), identificando al instante el ID, correo, nombre y rol del operador que ejecutó el cambio.
- **Panel Premium interactivo "Bitácora de Auditoría":** Desarrollo de una sofisticada interfaz de usuario Stitch UI bajo la ruta exclusiva `/admin/auditoria`. Incorpora un timeline vertical interactivo y filtros avanzados reactivos de tipo de acción, módulo/tabla, fecha y búsqueda por usuario.
- **Traductor Inteligente a Lenguaje Natural:** Incorporación de un motor generador de explicaciones en lenguaje natural en el timeline e inspector de detalles. Traduce al instante las operaciones JSON frías en enunciados amigables para humanos en español nativo. Resuelve de forma proactiva nombres dinámicos de cabañas cargados en memoria a través de su identificador y formatea los eventos de manera contextual según el módulo:
  - **Cierres/Bloqueos (`cabin_closures`):** Detalla si es de una cabaña específica o un cierre total del Rancho, el motivo exacto, fechas y estado (Ej: *"⚙️ Claudio Milanolo aplicó un nuevo bloqueo por 'EXTRA Vacaciones' restringiendo la cabaña 'Suite del Lago'..."* o *"🔓 Claudio Milanolo levantó y eliminó el bloqueo..."*).
  - **Reservas (`bookings`):** Identifica el nombre del huésped, la cabaña asignada, acciones de creación, modificación general, eliminación o cambios puntuales de estado de reserva (Ej: *"🔄 Claudio Milanolo cambió el estado de la reserva de 'Huésped' a 'Confirmada'..."*).
  - **Usuarios/Perfiles (`profiles`):** Traduce creaciones, cambios específicos de roles de seguridad (Staff, Administrador, etc.) o revocaciones (Ej: *"👤 Claudio Milanolo creó el perfil de usuario asignándole el rol de..."* o *"🛡️ Claudio Milanolo actualizó el rol de seguridad..."*).
  - **Cabañas (`cabins`):** Narra creaciones, deshabilitaciones o activaciones de servicio y bajas.
- **Visualizador Comparativo de Cambios en Caliente:** Diseño en el panel de detalle de un renderizador de diferencias inteligente (`renderDataDiff`) que detecta y lista de forma coloreada y formateada únicamente las propiedades modificadas de primer nivel en updates, ofreciendo también exportación directa de la bitácora a formato JSON.
- **Enlace Dedicado en Sidebar:** Adición del enlace *"Bitácora de Auditoría"* con ícono de documento en el sidebar lateral de administrador (`src/app/admin/layout.tsx`).
- **Pestaña de Roles y Permisos Dinámicos en Usuarios:** Rediseño modular de `/admin/usuarios` estructurado en pestañas fluidas. La primera contiene el listado de miembros del equipo y la segunda presenta la **Matriz de Permisos Dinámicos**, donde el administrador puede visualizar interactivamente la matriz de permisos de los roles principales (`admin`, `staff`, `recepcion`, `mantenimiento`) con preajustes de acceso a pantallas y botones del PMS.
- **Robustecimiento del Pipeline de Invitación y Reenvío de Usuarios:** Rediseño estructural en el flujo de invitaciones de Supabase Auth. El endpoint GET de `api/admin/users/route.ts` ahora cruza dinámicamente y en caliente la tabla pública `public.profiles` con la base de datos interna de usuarios de autenticación `auth.users` mediante privilegios administrativos (`listUsers`), garantizando que **todos los datos de contacto reales** (email y teléfono/celular) se visualicen de inmediato en la tabla de miembros en `/admin/usuarios` sin esperar a que el usuario complete su registro. Se inyectó soporte para capturar e invitar con **Celular / Teléfono de Contacto**, columna de Contacto enriquecida visualmente con íconos premium de correo/teléfono de Stitch UI, y un flujo interactivo de **Reenvío de Invitaciones** en caliente.


## [1.0.1] - 2026-05-25

### Añadido / Mejorado (Enlaces Directos y Vista Centralizada de Reservas en Conflicto)

- **Enlaces Directos en Banners de Alerta Crítica:** Modificación de los banners rojos interactivos animados en el **Dashboard** (`src/app/admin/page.tsx`) y en la **Gestión de Reservas** (`src/app/admin/reservas/page.tsx`). Ahora el nombre de los huéspedes en conflicto con cierres temporales es un `<Link>` interactivo directo que filtra el panel a esa reserva específica al instante, acelerando los tiempos de reubicación del PMS.
- **Pestaña Centralizada de Conflictos en Reservas:** Integración de un sistema de pestañas premium Stitch UI sobre la tabla principal en el panel de reservas.
- **Agrupación y Conteo Reactivo de Incidentes:** Creación de una pestaña dedicada `"⚠️ Reservas en Conflicto"` que calcula y muestra dinámicamente un contador de advertencia rojo pulsante con el total de incidentes activos. Al seleccionarse, la tabla principal se filtra instantáneamente para agrupar únicamente:
  - Reservas con colisiones por **cierres temporales** (`closureConflicts`).
  - Reservas con colisiones por **overbooking o duplicidad de fechas** cruzadas.
- **Barra de Filtro Activo Inteligente con Alternador de Conflictos:** Rediseño completo del banner de filtro de URL (`bookingIdFilter`). Ahora despliega de forma explícita el nombre del huésped filtrado, su cabaña y el rango de fechas. Además, incluye un selector dinámico (`select`) Rancho Stitch UI para alternar instantáneamente entre todas las reservas en conflicto activas de manera ágil y visual.
- **Refresco Reactivo de Conflictos en Tiempo Real:** Corrección en el flujo del PMS; ahora tras confirmar, cancelar, registrar pagos o guardar modificaciones de reservas en la base de datos (incluso a través del modal de confirmación de cancelación), el sistema invoca de forma inmediata `fetchBookings()`. Esto recalcula las colisiones y asegura que los banners superiores de advertencia se limpien y desvanezcan al instante tan pronto como los incidentes sean resueltos en Supabase.
- **Limpieza de Filtrado Multi-Capa:** Garantía de coherencia al mezclar el filtro de URL proveniente del Dashboard con la pestaña de conflictos de forma robusta.

## [1.0.0] - 2026-05-25

### Añadido / Mejorado (Sistema de Cierres y Bloqueos Temporales Parcial y Total)

- **Arquitectura de Base de Datos para Bloqueos:** Creación e integración de la tabla `cabin_closures` en Supabase con RLS habilitada para lectura pública y permisos administrativos de edición, optimizada con índices cronológicos para búsquedas de disponibilidad inmediatas.
- **Cierre Individual y Cierre Total:** Capacidad para configurar bloqueos parciales por rango de fechas para cabañas específicas (mantenciones, reparaciones, etc.) y opción rápida de **Cierre Total** (todas las cabañas a la vez) para vacaciones del Rancho.
- **Bloqueo Estricto de Reservas (Frontend Cliente):** Integración de cierres temporales en la Landing y Checkout públicos. El calendario interactivo (`BookingForm.tsx`) ahora marca los días cerrados como no seleccionables con un estilo visual premium de bloqueo (`bg-gray-100 border border-dashed border-gray-300`) y despliega alertas animadas Stitch UI especificando el motivo del cierre ingresado por el administrador.
- **Bloqueo Estricto de Reservas (Frontend Admin):** Inyección de la misma lógica de deshabilitación y marcado en los calendarios interactivos del modal de creación manual y edición inline de reservas en el PMS.
- **Lógica de Seguridad en Backend (API & Supabase):** Implementación de validaciones a nivel de base de datos y en los métodos de inserción y actualización (`CheckoutForm.tsx`, `createBooking` y `saveEdit`). Bloquea de forma absoluta cualquier intento de inserción de reserva si coincide con un cierre temporal, mostrando mensajes de error descriptivos.
- **Detección Preventiva de Conflictos de Cierre:** Al configurar un cierre, el panel analiza reservas activas en ese rango de fechas y despliega un diálogo confirmatorio detallado advirtiendo las colisiones.
- **Alertas Críticas e Intensas (`🚨`):** Si existe algún conflicto activo entre un cierre y una reserva, el sistema inyecta un banner rojo animado de Stitch UI super llamativo y prioritario en el **Dashboard** y la **Lista de Reservas**, exigiendo la atención del administrador.
- **Apagado Reactivo de Alertas:** Las alertas se desvanecen automáticamente del PMS tan pronto como todas las colisiones sean resueltas (reubicando o cancelando las reservas afectadas, o eliminando el cierre temporal).
- **Módulo de Gestión "Cierres y Bloqueos" en Cabañas:** Nueva pestaña/sección autogestionable premium en la página de Gestión de Cabañas (`src/app/admin/cabanas/page.tsx`) con un formulario intuitivo de bloqueo y tabla dinámica para auditar y remover cierres futuros o en curso.

## [0.9.4] - 2026-05-23

### Añadido / Mejorado (Módulo de Gestión de Landing Page Autogestionable en el PMS)

- **Módulo Administrativo "Gestión de Landing":** Creación de una página exclusiva de administración (`/admin/landing`) protegida para roles `admin` que permite gestionar globalmente el diseño de la Landing Page pública de Rancho Carmelitas de manera centralizada.
- **Autogestión de Hero Banner (Textos y Fondo):** Integración de campos editables en tiempo real para el título y el subtítulo del encabezado del Home. Permite subir de forma independiente una imagen de fondo panorámica al Storage de Supabase, impactando de forma reactiva en el portal.
- **Galería de Momentos Dinámica y Reordenable:** Módulo de administración para el carrusel de la Landing. Permite la subida múltiple de archivos de fotos de instalaciones reales con edición directa del texto alternativo (SEO) y controles interactivos premium de flechas (`▲` / `▼`) para reordenar las imágenes e intercambiar el `order_index` en la base de datos de manera fluida.
- **Nueva Pestaña en Sidebar:** Inyección en el menú lateral administrativo de Next.js (`layout.tsx`) de la pestaña `"Gestión de Landing"` con un ícono interactivo Stitch UI estilizado y validación de permisos de seguridad RBAC.
- **Arquitectura de Base de Datos Separada (v0.9.4):** Diseño del script `schema_update_v3.sql` que implementa la tabla de configuración global única `landing_settings` y la tabla relacional de fotos `landing_gallery` con seguridad de filas (RLS) habilitada para lectura pública y control de escritura administrativa.
- **Lógica Defensiva de Fallback Local:** Integración de bloques robustos de interceptación `try-catch` en la Landing pública (`src/app/page.tsx`). Si la base de datos no tiene las nuevas tablas creadas, el sistema atrapa el error y de forma automática usa el fallback de fotos locales estáticas en `/public/gallery` y textos por defecto, garantizando que el portal permanezca 100% estable y visible sin interrupciones del servicio.

## [0.9.3] - 2026-05-23

### Añadido / Mejorado (Gestión Diferenciada de Fotos de Portada y Galería en el PMS)

- **Cargador Dedicado de Portada Principal:** Incorporación de una sección exclusiva e independiente en el panel de administración (creación y edición inline) para subir la **Foto de Portada Principal** oficial de cada cabaña (`image_url` en Supabase). Cuenta con previsualizaciones interactivas locales y persistidas en la nube y la indicación de su tamaño ideal sugerido (**Aspecto 3:2, ej: 1200x800 px**).
- **Badges de Ayuda Visual Inteligentes en Galería:** Rediseño completo del panel de carga de la galería de fotos. Incorpora un banner instructivo de posicionamiento de imágenes y badges dinámicos en tiempo real sobre las miniaturas que clasifican la **Primera Foto** de la galería combinada como `🌌 BANNER HERO` (**Recomendado: 1920x1080 px, 16:9/21:9**) y las **Fotos 2 en adelante** como `🖼️ CARRUSEL` (**Recomendado: 1200x800 px, 3:2**), reflejando con precisión matemática y visual el despliegue del portal público.
- **Limpieza de Sintaxis TSX:** Saneamiento y validación de las etiquetas React y el flujo de estados condicionales en el formulario de edición inline para evitar warnings de consola y fallos de compilación con Turbopack.

## [0.9.2] - 2026-05-23

### Añadido / Mejorado (Gestión Operativa de Reservas y Cancelación Multicanal)

- **Expiración de 24 Horas con Acción Rápida:** Implementación de la visualización y alerta para reservas pendientes que superen las 24 horas de antigüedad desde su creación sin registrar abono. Se muestra un badge interactivo vibrante `⏰ Expirada (+Xh)` y un botón rápido de acción *"⏳ Expirar y Liberar"* que redirige automáticamente al flujo de cancelación multicanal.
- **Resolución y Priorización de Conflictos de Fechas (Overbooking):** Sistema inteligente de colisiones que cruza reservas no canceladas de una misma cabaña. Se establece prioridad absoluta para la reserva confirmada primero (`confirmed_at` más antiguo) o en su defecto la creada primero (`created_at` más antiguo). La reserva secundaria de menor prioridad despliega un banner de alerta rojo animado de Stitch UI informando el conflicto. Se integró un control interactivo `📢 Marcar: Ya le avisé` que persiste el estado en Supabase (`admin_notified_conflict`), cambiando de inmediato a un banner verde mitigado de huésped notificado.
- **Flujo de Cancelación Multicanal Interactivo:** Nuevo modal Stitch UI premium al cancelar o expirar una reserva que ofrece la opción de enviar correo electrónico oficial de cancelación (Resend), abrir WhatsApp Web con un mensaje cortés personalizado y pre-redactado de acuerdo a la razón del desestimiento (por vencimiento de 24h, colisión de fechas, u otros), o ambas opciones en paralelo.
- **Plantilla de Correo de Cancelación Oficial:** Creación del componente `CancelationEmailTemplate` en `src/components/emails/CancelationTemplate.tsx` y el endpoint `/api/send-cancelation` para el envío transaccional automático utilizando Resend, respetando los estándares de maquetación y de privacidad corporativa del Rancho.
- **Hotfix de Carga de Imagen en Checkout (v0.9.2):** Corrección del error de consola de Next.js/React: *"An empty string ("") was passed to the src attribute"*. Se implementó un renderizado condicional en `CheckoutForm.tsx` para evitar que cabañas de prueba con `imageUrl` vacío o nulo pasen una cadena vacía a la propiedad `src` del componente de imagen, desplegando en su lugar un elegante contenedor de marcador de posición (placeholder) gris premium con un ícono y texto descriptivo.

## [0.9.1] - 2026-05-23

### Añadido / Mejorado (Refinamiento de Capacidad y Canales de Venta del PMS)

- **Bloqueo Estricto de Capacidad:** Exceder la capacidad de la cabaña (capacidad base + adicionales) ahora bloquea de forma rígida y absoluta el guardado de la reserva manual en el PMS. Se ha removido por completo la opción interactiva de anulación ("Autorizar sobrecapacidad") y el botón de guardado en el formulario se deshabilita automáticamente con una advertencia en rojo absoluto. También valida en el submit para mayor seguridad.
- **Página de Canales Independiente:** La administración autogestionable de plataformas y comisiones externas de venta se ha reubicado en su propia ruta exclusiva `/admin/configuracion` bajo una interfaz Stitch UI premium, agregando un acceso directo dedicado ("Canales de Venta" con ícono de conector `🔌`) en el Sidebar de navegación del PMS.
- **Saneamiento de la Página de Configuraciones:** La vista de configuraciones globales fue limpiada a fondo de secciones duplicadas de plataformas, manteniéndose fiel a su propósito original (datos de contacto de WhatsApp, correo, dirección, teléfono y empresa).
- **Hotfix de Inputs Controlados:** Resolución del warning/error de React en la página de administración de reservas que indicaba *"A component is changing an uncontrolled input to be controlled"*. Se introdujeron operadores de coalescencia nula (`?? ''`) en la asignación de `editForm` (como `plataforma_comision_aplicada`, `admin_comision_porcentaje` y `admin_notes`) al iniciar la edición y directamente en las propiedades de renderizado JSX. Esto previene que registros históricos de reservas con valores `null` en Supabase rompan el control del formulario en React al momento de su apertura.
- **Referencia Financiera en Registro de Pago:** Integración de la visualización en tiempo real del *Total Neto* de la reserva junto al valor *Sugerido (50%)* en el modal de confirmación y registro de pago. Esto provee al administrador de toda la información de cobro de un vistazo rápido sin abandonar el modal.
- **Calendario Interactivo Premium en Edición:** Integración de la interfaz Stitch UI de calendario de ocupación en la edición de reservas inline. Realiza consultas a Supabase de los días ocupados para la cabaña, excluyendo la reserva que se está editando para evitar autoconflictos, permitiendo al administrador extender, mover o conservar las fechas con absoluta flexibilidad y con el mismo estándar de UX de la creación.

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
