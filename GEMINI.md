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

Se ha completado la **Fase 1** (UI Base), la **Fase 2** (Integración de Supabase), la **Fase 3** (Correos), la **Fase 4** (PMS y Galería), la **Fase 4.5 (Gestión de Usuarios y Roles)**, la **Personalización de Contenido Real (Social Media Sync)**, la **Fase 4.75 (Evolución de Cobros y Comisiones Parametrizables)**, el **Saneamiento del Módulo de Reservas Manuales (Versión 0.8.1)**, el **Robustecimiento de Capacidad, Calendario Interactivo y Configuración de Canales (Versión 0.9.0)**, el **Refinamiento de Capacidad y Canales de Venta (Versión 0.9.1)**, la **Gestión Operativa de Reservas y Cancelación Multicanal (Versión 0.9.2)** y la **Gestión Diferenciada de Fotos de Portada y Galería en el PMS (Versión 0.9.3)**. Actualmente se está completando la sincronización con el repositorio oficial en GitHub.

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
- **Sistema Parametrizable de Comisiones:** Canales de venta (Booking.com, Airbnb, etc.) con comisiones por defecto en Supabase, selector dinámico al crear/editar reservas, cálculo inteligente sobre el Precio Bruto e IVA.
- **Ficha de Liquidación Interna Privada:** Desglose financiero reactivo en tiempo real para administradores, calculando el neto estimado al dueño y marcado bajo estricta exclusión de privacidad de los correos.
- **Desglose de Comisión en Correos (Resend):** Visualización del cobro de plataforma y precio bruto en el correo de confirmación de pago, manteniendo la comisión interna del dueño 100% oculta para el cliente.
- **Calendario Interactivo de Ocupación Premium en Reservas Manuales:** Integración de la elegante interfaz Stitch UI en el modal de reserva manual, consultando en tiempo real las reservas activas en Supabase para la cabaña elegida, deshabilitando y tachando en rojo los días ocupados para prevenir overbookings accidentales, y vinculando los clicks a los campos de fecha de solo lectura.
- **Control de Capacidad Excedida de Huéspedes (Bloqueo Estricto v0.9.1):** Verificación en tiempo real de la capacidad base y adicionales máximos de la cabaña. Si se superan, se despliega un banner de error rojo absoluto y se bloquea de forma rígida y definitiva el guardado, deshabilitando el botón de guardado en el modal y validando de forma estricta en el backend para evitar sobrecapacidades accidentales.
- **Descuentos Unificados de Tipo/Valor en Modal:** Posibilidad de aplicar descuentos porcentuales (`%`) o fijos (`$`) en el modal de creación manual de reservas, con recalculación interactiva Stitch UI en tiempo real y almacenamiento en pesos.
- **Desacoplamiento Estricto de IVA:** Modificación de las fórmulas financieras para que el IVA (19%) dependa única y exclusivamente de la casilla de verificación *"Suma 19% de IVA para Cálculo de Bruto"*, permitiendo registrar reservas de canales o clientes sin IVA si la casilla está desmarcada.
- **Panel Autogestionable de Configuración de Canales (Página Independiente v0.9.1):** Módulo administrativo premium con su propia ruta `/admin/configuracion` y acceso dedicado en el Sidebar del PMS ("Canales de Venta" con ícono de conector `🔌`). Permite agregar y remover canales externos de forma dinámica y autogestionada, propagándose al selector de reservas.
- **Saneamiento de Configuraciones Globales (v0.9.1):** La vista original `/admin/configuraciones` fue limpiada de comisiones y plataformas redundantes, manteniendo únicamente los datos de contacto y la información institucional de la empresa.
- **Hotfix de Robustez en Formularios (v0.9.1):** Integración de lógicas defensivas con coalescencia nula (`?? ''`) en la asignación de inputs reactivos controlados (`editForm` y `createForm`). Esto neutraliza de raíz los errores de cambio de estado de incontrolado a controlado disparados por valores `null` históricos en la base de datos Supabase.
- **Referencia Financiera en Registro de Pago (v0.9.1):** Presentación del *Total Neto* y el *Sugerido (50%)* en conjunto dentro del modal administrativo de confirmación, otorgando total claridad en la captura del abono sin abandonar el contexto del pago.
- **Calendario Interactivo Premium en Edición (v0.9.1):** Integración de la interfaz de calendario Stitch UI en la edición inline de reservas. El sistema consulta y marca las reservas de la cabaña deshabilitando días ocupados, pero excluye de forma inteligente la propia reserva que se está editando, logrando una UX sin fricciones al extender o reposicionar estadías.
- **Expiración de 24 Horas y Botón Rápido (v0.9.2):** Alerta automática para reservas en estado Pendiente de más de 24h con badge `⏰ Expirada (+Xh)` y un botón directo *"⏳ Expirar y Liberar"* que gatilla el flujo de cancelación multicanal.
- **Resolución Prioritaria de Overbooking (v0.9.2):** Lógica dinámica que prioriza reservas en conflicto por confirmación o creación más antiguas. La reserva secundaria muestra una alerta crítica roja y permite al administrador marcar `📢 Marcar: Ya le avisé` reactivamente (`admin_notified_conflict`), cambiando visualmente a verde mitigatorio.
- **Cancelación Multicanal e Interacciones WhatsApp / Resend (v0.9.2):** Opción multicanal en el modal de cancelación para despachar correo premium oficial (mediante la plantilla `CancelationEmailTemplate` y endpoint `/api/send-cancelation`) y abrir WhatsApp Web con un mensaje cortés pre-redactado de acuerdo a la razón exacta seleccionada.
- **Hotfix de Carga de Imagen en Checkout (v0.9.2):** Integración de lógica de renderizado condicional en `CheckoutForm.tsx` para evitar que cabañas con `imageUrl` vacío o nulo pasen un `src` vacío a la etiqueta de imagen, desplegando en su lugar un marcador de posición gris premium con ícono de casa.
- **Gestión Diferenciada de Fotos de Portada y Galería en el PMS (v0.9.3):** Incorporación de un cargador independiente para la **Foto de Portada Principal** oficial de cada cabaña (`image_url` en Supabase) con su guía de tamaño ideal (**Aspecto 3:2, ej: 1200x800 px**) y la integración de badges informativos dinámicos de ayuda visual sobre la galería de fotos, clasificando en tiempo real la **Primera Foto** de la galería combinada como `🌌 BANNER HERO` (**Recomendado: 1920x1080 px, 16:9/21:9**) y las **Fotos 2 en adelante** como `🖼️ CARRUSEL` (**Recomendado: 1200x800 px, 3:2**), para asegurar una edición precisa y estética sin reutilización ineficiente.

Próximos pasos: **Fase 7** (Validación final y QA de integración de la versión v0.9.3).
