# Rancho Carmelitas Web (Client & PMS)

Bienvenido al repositorio principal de la página web interactiva y el Sistema de Gestión de Propiedades (PMS) del Rancho Carmelitas.

## Descripción del Proyecto

Este proyecto es una plataforma integral desarrollada con las últimas tecnologías web para permitir que los usuarios exploren y reserven cabañas en Rancho Carmelitas con un diseño premium y responsive, y que al mismo tiempo, los administradores cuenten con un "Panel Mágico" (PMS) seguro para gestionar el check-in rápido, validación de reservas y reagendamientos.

El diseño se basa en un concepto _Premium_, con uso intensivo de modulares CSS (Vanilla) y animaciones fluidas (Tipografía: Inter, Acentos: #11d442).

## Características Principales

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
    *   **Ampliación de Auditoría Completa en Lenguaje Natural (v1.3.3) e Invitaciones (v1.3.7):** Extensión de la bitácora histórica de auditorías para registrar absolutamente cualquier cambio en el portal (logotipos, imágenes de la galería, textos del Hero banner, variables de configuración comercial y canales de venta externos). Registra además de forma relacional el reenvío de invitaciones de correo SMTP a colaboradores, interpretando y formateando reactivamente los eventos en descripciones fluidas y explicativas en lenguaje natural en español.
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

