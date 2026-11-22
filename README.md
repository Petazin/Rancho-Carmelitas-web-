# Rancho Carmelitas Web (Client & PMS)

Bienvenido al repositorio principal de la página web interactiva y el Sistema de Gestión de Propiedades (PMS) del Rancho Carmelitas.

## Descripción del Proyecto

Este proyecto es una plataforma integral desarrollada con las últimas tecnologías web para permitir que los usuarios exploren y reserven cabañas en Rancho Carmelitas con un diseño premium y responsive, y que al mismo tiempo, los administradores cuenten con un "Panel Mágico" (PMS) seguro para gestionar el check-in rápido, validación de reservas y reagendamientos.

El diseño se basa en un concepto _Premium_, con uso intensivo de modulares CSS (Vanilla) y animaciones fluidas (Tipografía: Inter, Acentos: #11d442).

## Biblioteca de Documentación Oficial (v2.0.0)

El proyecto cuenta con un sistema documental vivo y fidedigno del código fuente:

*   📖 **[Portal Maestro de Documentación](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/documentacion/README.md)**: Mapa general, glosario de términos y guía de navegación.
*   🛠️ **[Documentación Técnica](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/documentacion/tecnica/)**: 8 runbooks de arquitectura, bases de datos (ER), RLS, endpoints API, pasarela Mercado Pago, mailing Resend, recinto completo y DevOps.
*   👥 **[Manual de Usuario y Operativo PMS](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/documentacion/usuario/)**: 14 manuales funcionales para administradores, recepcionistas y personal de operaciones.
*   🔍 **[Auditoría Forense EGM](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/documentacion/auditoria-egm/)**: Informe de 20 inconsistencias detectadas y plan de acción priorizado en 5 fases.

## Características Principales

*   **Responsividad Móvil y Usabilidad EGM (v2.4.3):**
    *   **Navegación Móvil Táctil en PMS:** Drawer deslizante con backdrop y botón hamburguesa en `/admin/*`, permitiendo administrar el complejo desde smartphones con comodidad.
    *   **Menú Desplegable en Landing Pública:** Componente `LandingNavbar.tsx` con accesos rápidos móviles a Cabañas, Recinto Completo, Galería, Preguntas, Reglamento y Mi Reserva.
    *   **Estandarización Semántica de Rutas:** Desacoplamiento entre Canales de Venta (`/admin/canales`) y Configuraciones Globales (`/admin/configuraciones`).
*   **Orden Estructural y Saneamiento EGM (v2.4.2):**
    *   **Raíz del Repositorio Limpia:** Centralización de más de 20 scripts SQL dispersos en [database/history/](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/database/history), reubicación de herramientas de testing a `scripts/` y eliminación de archivos de 0 bytes.
    *   **Optimización de Assets en `public/`:** Eliminación de íconos por defecto no usados y purga de imágenes preliminares no referenciadas.
    *   **Consolidación de Manuales de Usuario:** Eliminación de 8 borradores no estructurados en `/documentacion/usuario`, preservando la serie oficial fidedigna numerada del `01` al `13`.
*   **Seguridad y Blindaje EGM (v2.4.1):**
    *   **Supresión de Escalada de Privilegios a Administrador:** Eliminación del auto-upsert incondicional a rol administrador en `/api/admin/users`, requiriendo perfil administrativo previamente validado.
    *   **Protección de Despacho de Correos de Recinto:** Control de acceso en `/api/send-event-quote-email` exigiendo `isStaffOrAdmin()` para aprobaciones y confirmaciones, validación estricta de formato UUID y lista blanca de acciones.
    *   **Sincronización Segura de Mercado Pago:** Blindaje de `/api/mercadopago/sync` con verificación de sesión y soporte integrado para pagos de recinto (`EVENT__`).
    *   **Homologación de Dominios:** Estandarización de retornos de pagos a `https://ranchocarmelitas.com` y eliminación de puertos de desarrollo en desuso.
*   **Tarifas Fijas por Tramo de Recinto y Coordinación de Adicionales (v2.4.0):**
    *   **Supresión de Adicionales para Recinto Completo (8h):** Eliminación definitiva del concepto de personas adicionales en el arriendo exclusivo de recinto, manteniendo 100% inalterada la política de adicionales en cabañas.
    *   **Editor Simplificado de Tramos (`/admin/configuraciones`):** Tabla interactiva y limpia de 4 columnas principales (`Nombre del Plan`, `Desde pers.`, `Hasta pers.` y `Tarifa Fija del Tramo $`), con auto-encadenamiento sin gaps (`rechainTiers`).
    *   **Cotizador Web Directo y Transparente:** Tarjetas de planes con la indicación `Adicionales: Coordinar con administración`, desglose financiero plano sin multiplicaciones extras, y placeholder enriquecido en el campo de comentarios de contacto para especificar asistentes por coordinar.
*   **Cotizador Dinámico de Recinto y Rediseño Visual Hero Full-Width (v2.3.0):**
    *   **Inyección SSR Inmediata (`/recinto-completo`):** Server Component que precarga en el primer renderizado las tarifas de `venue_pricing_tiers`, costo de inflables, porcentaje de abono y aforo máximo desde la tabla `settings`, erradicando parpadeos de carga y fallbacks estáticos.
    *   **Selector de Planes a Ancho Completo (Full-Width Hero UI):** Arquitectura visual renovada en `VenueQuoteForm.tsx` con Paso 1 a 12 columnas (~900px), tarjetas espaciosas de ~280px libres que eliminan cualquier truncamiento de texto, botones de selección reactivos `✓ Plan Seleccionado` / `Elegir este Plan` y tipografía clara para tarifas base y aforos.
    *   **Control Granular de Asistentes:** Especificación detallada de participantes con contadores independientes para Adultos, Niños (3 a 17 años) y Bebés menores de 3 años exentos de cobro.
    *   **Protección de Aforo Máximo y Canal de Eventos Masivos:** Detección en tiempo real de sobrepaso de aforo (`isOverCapacity`) con bloqueo preventivo del botón de envío y enlace interactivo a WhatsApp para cotizaciones personalizadas de eventos corporativos o masivos.
*   **Editor de Tramos Dinámicos, Máx. Adicionales y Alerta Reactiva de Aforo (v2.2.0):**
    *   **Configuración Comercial Intuitiva (`/admin/configuraciones`):** Administración interactiva de tarifas de recinto completo (8h) basada en personas base cubiertas, precio base, máximo de adicionales y cobro por persona extra.
    *   **Auto-Encadenamiento Matemático:** El aforo de cada tramo se calcula automáticamente garantizando continuidad matemática absoluta y cero vacíos de tarifas.
    *   **Protección y Sincronización de Aforo:** Detección en tiempo real de desfases entre el aforo físico máximo y las tarifas ofrecidas, con botón de 1 clic para alinear valores y validación preventiva que impide guardar inconsistencias.
    *   **Tramos Extensibles y Reversión Rápida:** Soporte para agregar tramos personalizados ilimitados y botón para restablecer a la configuración recomendada de 2 tramos limpios (1 a 29 pers. y 30 a 70 pers.).
*   **Arriendo de Recinto Completo 8h y Rediseño Modular de Landing (v2.1.0):**
    *   **Pestañas en Administración (`/admin/landing`):** Navegación compacta por selectores horizontales (`Hero & Portada`, `Galería Portada`, `Galería Recinto`, `Textos & Reglas`, `Equipo`, `Contacto & Ubicación`), eliminando el scroll vertical con persistencia en memoria (CSS `hidden`).
    *   **Galería Dinámica de Recinto:** Subida y gestión de fotos exclusivas para eventos con purga automática en Supabase Storage y visualización pública en `/recinto-completo` con fallback resiliente.
    *   **Seguridad Financiera Zero-Trust:** Cálculo y validación autoritativa de montos en PostgreSQL en la RPC `create_public_event_quote`, impidiendo inyecciones de precios desde el cliente.
    *   **Trazabilidad Limpia:** Triggers antiruido para `settings` y `landing_gallery` hacia `audit_logs`.
*   **Sistema de Arriendo de Recinto Completo (v2.0.0):** Modelo de negocio para eventos diurnos (8 horas) con uso exclusivo de las 4 cabañas e instalaciones. Incluye cotizador paramétrico por tramos (40 y 60 personas), adicionales por persona e inflables, exención a menores de 3 años, pasarela de pago y bloqueo atómico de todas las cabañas en `cabin_closures` al confirmarse el evento.
*   **Suite Integral de Blindaje de Seguridad, Privacidad de Datos y Accesibilidad Web (v1.9.0):** Cierre total de políticas RLS públicas permisivas (`USING true`) sobre la tabla de reservas en Supabase PostgreSQL. Consultas y registro de reservas mediante funciones RPC blindadas en el servidor (`get_occupied_dates`, `check_dates_overlap` y `create_public_booking` con casteo nativo a `integer[]`); protección de endpoints de correo en Next.js App Router (Resend) contra abuso de bots y cobros imprevistos de API; cumplimiento legal bajo la Ley N° 19.628 con portal institucional de `/privacidad` y checkbox legal en el checkout; y soporte de accesibilidad WCAG 2.1 con etiquetas ARIA en controles interactivos.
*   **Fotografía Real Panorámica para Portada Open Graph, Redes Sociales y Galería (v1.8.1):** Sustitución de portadas previas por la imagen oficial panorámica de alta definición de la piscina familiar y cabañas (`og-image.jpg` y `og-image.png` en ratio 1.91:1 / 1200x630 px) para previsualizaciones impecables en WhatsApp, Meta (Facebook e Instagram) y Twitter/X. Incorporación de nuevas vistas de jardines y áreas verdes en la galería del sitio y fallback prioritario en el Hero banner.
*   **Optimización Integral de SEO, Redes Sociales y Rendimiento Web (v1.8.0):** Implementación de Open Graph y Twitter Cards con imagen de portada oficial (`og-image.png` en 1200x630 px) para previsualizaciones en WhatsApp, Instagram y Facebook; generación automática de `sitemap.xml` con rastreo dinámico de cabañas y `robots.txt`; datos estructurados Schema.org (`LodgingBusiness` y `FAQPage`) para Google Maps y Google Rich Snippets; pantalla de error 404 personalizada branded (`not-found.tsx`); y aceleración de Largest Contentful Paint (LCP) en portada con Next.js `<Image fill priority />`.
*   **Página de Inicio y Reservas (Cliente):** Experiencia de usuario inmersiva con vista detallada de cabañas, formulario de reserva rápido y sección premium de Ubicación y Comunidad (Google Maps interactivo, e integración estética de Instagram y Facebook con micro-animaciones Stitch UI). Incorpora visualización 100% transparente de capacidad base y recargo por huésped adicional con banners Stitch UI premium (`bg-orange-50/60`).
*   **Cotizador y Checkout Inteligente:** Formulario interactivo con desglose financiero exacto en tiempo real, edades de niños individualizadas y obligatorias según la cantidad seleccionada para un cálculo óptimo, y soporte de autocompletado reactivo de RUT chileno en inputs.
*   **PMS / Panel de Administración:**
    *   Gestión centralizada de múltiples reservas en calendario.
    *   **Localización y Normalización de Dinero Global (es-CL):** Consistencia regional del 100% con punto para miles y coma para decimales mediante helper `formatMoney(amount)` centralizado.
    *   **Autocompletado de RUT Reactivo:** Formateador de RUT reactivo en la edición inline, creación manual y en el modal de Check-In del PMS.
    *   **Gestión Unificada de Pagos Múltiples (v1.4.4):** Soporte de abonos parciales y combinados almacenados en la tabla relacional `booking_payments`, con timeline de transacciones y subida de comprobantes. Incluye **Sugerencia Dinámica del 50%** interactiva con botón de pre-llenado (calculando montos faltantes) y **Auto-Confirmación Inteligente**, que promueve la reserva al estado `'Confirmada'` automáticamente al alcanzar o superar el 50% acumulado, enviando el correo definitivo con el desglose detallado de cada abono realizado. El botón de pagos muta en caliente a color verde y texto `"✓ Registrar y Confirmar Reserva"` al alcanzar el 50% de abono acumulado en reservas pendientes.
    *   **Check-In Defensivo y Restrictivo:** Registro obligatorio de ficha del huésped con bloqueo de estancia si existe saldo pendiente por liquidar. Habilita un botón directo de confirmación manual `✓ Confirmar` en las reservas pendientes que calcula y sugiere de forma dinámica el abono faltante exacto para cubrir el 50% (restando abonos previos) e inserta el pago rápida de forma unificada en `booking_payments`.
    *   **Hotfix Definitivo de Reactividad en Check-In (v1.2.5):** Inyección de abonos registrados en caliente y en tiempo real directamente en la ficha del Check-In local (`selectedBookingForCheckIn`), permitiendo que el saldo pendiente baje a `$0` al instante y active de inmediato el botón `"🚗 Completar Check-In & Entregar Cabaña"` sin forzar cierres de modal ni consultas asíncronas de red diferidas.
    *   **Registro de Bloqueo en Auditoría (v1.2.6):** Identificación y traducción dinámica a lenguaje natural de eventos de bloqueo (`🔒`) y desbloqueo (`🔓`) de colaboradores en el Trace Trail, exponiendo al administrador operador, el usuario afectado y el motivo de suspensión ingresado.
    *   **Ampliación de Auditoría Completa en Lenguaje Natural (v1.3.3), Invitaciones (v1.3.7) y Roadmap (v1.4.9):** Extensión de la bitácora histórica de auditorías para registrar absolutamente cualquier cambio en el portal (logotipos, imágenes de la galería, textos del Hero banner, variables de configuración comercial, canales de venta externos e ideas o bugs del roadmap). Registra además de forma relacional el reenvío de invitaciones de correo SMTP a colaboradores y las acciones del roadmap, interpretando y formateando reactivamente los eventos en descripciones fluidas y explicativas en lenguaje natural en español.
    *   **Roadmap y Módulo de Desarrollo (v1.4.9):** Panel interactivo exclusivo para administradores (`/admin/desarrollo`) para proponer mejoras y reportar bugs. Permite arrastrar y soltar (Drag & Drop nativo de HTML5 en React 19) tarjetas para reordenar la prioridad en tiempo real. Incorpora un dropzone reactivo que admite la subida de múltiples fotos de soporte, arrastre de archivos y pegado directo de capturas con `Ctrl+V`, guardándolas en Supabase Storage (`cabin-images/bugs/`). Permite marcar requerimientos como completados estampando la hora exacta, atenuando la tarjeta en la lista y desplegando estadísticas en vivo (Propuestas, Bugs y Completadas) en la cabecera del panel.
    *   **Flujo de Restablecimiento y Renovación de Contraseñas (v1.3.8):** Solución interactiva de 360 grados para recuperación de claves. Los administradores pueden de forma segura forzar el envío de un correo oficial de restablecimiento desde `/admin/usuarios` al pulsar "Reenviar" sobre perfiles activos. Paralelamente, se implementó una interfaz de auto-servicio premium en `/login` para solicitar enlaces y establecer nuevas contraseñas de forma segura con actualización en caliente de Supabase Auth.
    *   **Migración de Infraestructura, Gobernanza in-app y Documentación Académica (v1.4.0):** Refactorización de las API de mailing de Resend para consumir de manera dinámica el remitente (`email_sender`) y notificaciones desde Supabase settings. Desarrollo del panel de Gobernanza y Servidores (`/admin/infraestructura`) integrado con un Llavero Seguro (Vault) encriptado in-app para claves institucionales y modal de re-autenticación de seguridad en caliente. Creación de una biblioteca de documentación de doble nivel con 9 manuales de usuario funcionales (Nivel 1 con lógicas de decenas, abono del 50% e IVA) y 7 runbooks de infraestructura de servidores (Nivel 2 con backups, RLS y contingencias) en el directorio `/documentacion` en la raíz del proyecto.
    *   **Corrección de Doble IVA en Edición de Reservas (v1.4.1):** Solución al problema de doble cobro de IVA al editar reservas mediante la reconstrucción inversa del precio base neto, sustrayendo el 19% del total almacenado en Supabase para inicializar el formulario de edición con el neto original sin redundancias de cálculo.
    *   **Check-Out Físico Asistido:** Auditoría de entrega de llaves, inspección de cabañas y registro automático de notas o desperfectos.
    *   **Módulo Activo de Housekeeping:** Panel interactivo en tiempo real para que el personal de limpieza marque aseos completados, liberando el estado de la cabaña.
    *   **Reportes Financieros & SII:** Panel interactivo para el cálculo asíncrono de Ingreso Bruto, IVA (19% sobre reservas con factura), comisiones de canales de venta (Airbnb/Booking.com), comisión de Rancho Carmelitas e Ingreso Neto final liquidado al dueño.
    *   **Gestión Multi-Media (Supabase Storage):** Subida de galerías por bloque y amenidades interactivas.
    *   **Galería de Imágenes Premium:** Integración de recursos visuales personalizados basados en la identidad real del Rancho.
    *   **Control de roles (Admin/Guest) y control de accesos RBAC para Staff.**
    *   **Sistema de Comisiones Dinámicas:** Gestión y cálculo automático de comisiones de plataformas (externas) sobre el Precio Bruto e IVA de la reserva.
    *   **Ficha de Liquidación Interna Privada:** Desglose interactivo en tiempo real del pago neto estimado al dueño, excluido de los correos transaccionales por privacidad.
    *   **Creación Manual de Reservas:** Formulario premium de registro con previsualización financiera reactiva en tiempo real.
    *   **Cierres y Bloqueos Temporales (Parcial / Total):** Módulo administrativo autogestionable para declarar periodos de cierre por mantención o vacaciones del Rancho. Bloquea de forma estricta reservas en el cliente y el PMS e inyecta alertas rojas prioritarias ante colisiones con reservas activas.
    *   **Visualización Homologada de Estados en Dashboard:** Agenda del calendario y listado de Llegadas Inminentes en español nativo con badges homologados de colores del ciclo de vida del PMS. Resaltado de alta legibilidad para el teléfono del cliente (`📞`).
    *   **Gestión Inteligente de Huéspedes Adicionales & Fechas Parciales (v1.7.5):** Soporte integral para cobro de adicionales con piso mínimo garantizado de $10.000 CLP / noche por persona. Permite al administrador seleccionar entre estadía completa o estadía parcial indicando las fechas exactas de llegada y salida del pasajero adicional, calculando dinámicamente las noches pernoctadas y generando glosas explicativas en las notas de la reserva con botón de 1 clic para aplicar la tarifa sugerida.
*   **Módulo Oficial de Reglamento y Convivencia (v1.5.0):**
    *   **Página Oficial (`/reglamento`):** Portal dedicado con diseño editorial premium, filtros dinámicos por ámbito (General y Piscina) y compatibilidad nativa con impresión en PDF (`window.print`).
    *   **Aceptación Vinculante en Checkout:** Checkbox obligatorio de aceptación de términos antes de abonar con modal interactivo emergente (`RulesModal`) en `/checkout`.
    *   **Portal del Huésped y Detalle de Cabañas:** Inserción de recordatorios de convivencia en `/reserva/[id]` y pestaña dedicada *"📜 Normas"* en `/cabins/[id]`.
    *   **Unificación Operativa Oficial:** Sincronización 100% fiel con la cartelería física de la administración: prohibición absoluta de mascotas, check-out a las 12:00 hrs, no fiestas ni parlantes, y cobro de $10.000 por huésped adicional coordinado.
*   **Correos de Confirmación y Notificación (Resend v1.4.5):**
    *   **Confirmación de Pago:** Envíos automatizados al huésped con el desglose del cobro de plataforma, el comprobante oficial de pago y el desglose detallado de todos los abonos o pagos registrados en el Historial de Abonos, protegiendo al mismo tiempo los datos confidenciales internos de administración.
    *   **Agradecimiento y Despedida:** Envío automatizado al huésped en el momento de procesar su Check-Out en el PMS, deseándole un feliz viaje de regreso, detallando su estadía y ofreciendo enlaces interactivos a redes sociales para invitarle a valorar su experiencia (Stitch Box).

## Stack Tecnológico

Este repositorio está construido sobre estas bases:

*   **Frontend:** [Next.js](https://nextjs.org/) (App Router), React, TypeScript.
*   **Estilos:** Tailwind CSS y CSS Nativo (Vanilla CSS) arquitecturado para micro-interacciones.
*   **Base de Datos / Backend / Auth:** [Supabase](https://supabase.com/).
*   **Emails:** [Resend](https://resend.com/) con @react-email.
*   **Despliegue:** [Vercel](https://vercel.com).

## Instrucciones para el Desarrollo Local

Sigue estos pasos para arrancar el entorno en tu computadora:

1.  Asegúrate de tener instalado [Node.js](https://nodejs.org/) (versión 18+).
2.  Instala las dependencias del proyecto:
    ```bash
    npm install
    ```
3.  Crea un archivo `.env.local` en la raíz del proyecto (Aquí irán tus claves de Supabase).
4.  Inicia el servidor local de desarrollo:
    ```bash
    npm run dev
    ```
5.  Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la página de inicio. El código maestro de la landing page se encuentra en `src/app/page.tsx`.

## Carga Masiva e Importación Histórica (v1.3.0)

El sistema cuenta con un módulo de migración seguro en `migration/` diseñado para cargar registros históricos (desde 2023 en adelante) provenientes de planillas Excel de control diario de arriendos.

El proceso traduce el formato diario horizontal del Excel clásico en registros relacionales tabulares verticales aptos para bases de datos relacionales, admitiendo la ausencia de datos opcionales (RUT, email, teléfono, edades de niños) típicos del historial.

### Estructura de Archivos
*   [`plantilla_carga_masiva.csv`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/migration/plantilla_carga_masiva.csv): Archivo base vacío delimitado por punto y coma (`;`), óptimo para ser rellenado por el usuario y abrirse en Excel de Windows sin problemas de codificación.
*   [`ejemplo_carga_masiva.csv`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/migration/ejemplo_carga_masiva.csv): Ejemplo real rellenado en base a los arriendos diarios del Excel histórico de origen, sirviendo como guía para el mapeo.
*   [`importador.js`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/migration/importador.js): Script administrativo robusto en Node.js que lee el archivo CSV, realiza validaciones estrictas y carga secuencialmente las cabañas, plataformas, reservas e historial de pagos directo a Supabase.

### Instrucciones de Ejecución
Para importar tus datos históricos reales:
1. Completa tus datos en `migration/plantilla_carga_masiva.csv` (puedes apoyarte en `ejemplo_carga_masiva.csv`).
2. Abre la terminal de Windows en el directorio `rancho-carmelitas-web`.
3. Ejecuta el script importador indicando tu archivo CSV:
   ```bash
   node migration/importador.js migration/plantilla_carga_masiva.csv
   ```
4. El script procesará cada reserva, creará automáticamente las cabañas y canales de venta si no existen en la base de datos, y te mostrará un reporte detallado al terminar.

## Repositorio

- **GitHub:** [https://github.com/Petazin/Rancho-Carmelitas-Web](https://github.com/Petazin/Rancho-Carmelitas-Web)

