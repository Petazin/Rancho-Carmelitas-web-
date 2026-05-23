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

Se ha completado la **Fase 1** (UI Base), la **Fase 2** (Integración de Supabase), la **Fase 3** (Correos), la **Fase 4** (PMS y Galería), la **Fase 4.5 (Gestión de Usuarios y Roles)**, la **Personalización de Contenido Real (Social Media Sync)**, la **Fase 4.75 (Evolución de Cobros y Comisiones Parametrizables)**, el **Saneamiento del Módulo de Reservas Manuales (Versión 0.8.1)** y el **Robustecimiento de Capacidad, Calendario Interactivo y Configuración de Canales (Versión 0.9.0)**. Actualmente se está completando la sincronización con el repositorio oficial en GitHub.

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
- **Control de Capacidad Excedida de Huéspedes:** Verificación en tiempo real de la capacidad base y adicionales máximos de la cabaña. Si se superan, se despliega un banner de advertencia rojo y se bloquea el guardado, a menos que el administrador autorice de forma explícita mediante la casilla de *"Autorizar sobrecapacidad (Reserva de Emergencia)"*.
- **Descuentos Unificados de Tipo/Valor en Modal:** Posibilidad de aplicar descuentos porcentuales (`%`) o fijos (`$`) en el modal de creación manual de reservas, con recalculación interactiva Stitch UI en tiempo real y almacenamiento en pesos.
- **Desacoplamiento Estricto de IVA:** Modificación de las fórmulas financieras para que el IVA (19%) dependa única y exclusivamente de la casilla de verificación *"Suma 19% de IVA para Cálculo de Bruto"*, permitiendo registrar reservas de canales o clientes sin IVA si la casilla está desmarcada.
- **Panel Autogestionable de Configuración de Canales:** Módulo administrativo premium integrado en la sección de Configuraciones del PMS para agregar y remover canales/plataformas con comisiones en Supabase, los cuales se propagan automáticamente al selector de reservas.

Próximos pasos: **Fase 5** (QA final, optimización de carga y despliegue en producción).

