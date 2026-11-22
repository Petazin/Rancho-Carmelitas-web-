# 📚 Centro de Documentación Integral — Rancho Carmelitas

Bienvenido al centro oficial de documentación técnica, operacional y arquitectónica de la plataforma web y el Sistema de Gestión de Propiedades (PMS) de **Rancho Carmelitas**.

Este repositorio documental ha sido estructurado meticulosamente bajo la metodología **EGM (Executive Governance Model)** para garantizar la autonomía operativa del personal del rancho, la gobernanza de la infraestructura en la nube y el mantenimiento del software con estándares de calidad de producción.

---

## 📂 Organización de la Documentación

```
/documentacion
│
├── 📂 tecnica                             # NIVEL 1: DOCUMENTACIÓN TÉCNICA Y DE INGENIERÍA
│   ├── 01-arquitectura-general.md        # Stack tecnológico fidedigno, topología y flujo de datos
│   ├── 02-modelo-datos-y-base-de-datos.md# Esquema PostgreSQL completo: tablas, campos, triggers y RPCs
│   ├── 03-seguridad-rls-y-autenticacion.md# Modelo Zero-Trust, RLS, middleware, RBAC y funciones seguras
│   ├── 04-apis-y-servicios-backend.md     # Catálogo exhaustivo de API Routes (Next.js App Router)
│   ├── 05-pasarela-mercadopago.md         # Checkout Pro, preferencias, webhooks, sincronización e idempotencia
│   ├── 06-sistema-mailing-resend.md       # Plantillas React-Email, anti-trimming y disparadores automáticos
│   ├── 07-sistema-recinto-completo.md     # Eventos diurnos 8h: cotizador, RPCs y sincronización de cierres
│   └── 08-infraestructura-y-despliegue.md # Vercel, Supabase, dominios DNS, backups y variables de entorno
│
├── 📂 usuario                             # NIVEL 2: MANUAL FUNCIONAL Y OPERATIVO DEL PMS
│   ├── index.md                           # Índice general, roles y reglas de oro de operación
│   ├── 01-acceso-y-seguridad.md           # Inicio de sesión, auto-servicio y recuperación de contraseñas
│   ├── 02-dashboard-y-calendario.md       # Métricas, KPIs, código de colores homologado y llegadas del día
│   ├── 03-gestion-cabanas-y-tarifas.md    # Tarifas por noche, recargos de adicionales y narrativas locales
│   ├── 04-cierres-y-bloqueos.md           # Cierres temporales por mantención o vacaciones del complejo
│   ├── 05-reservas-cabanas.md             # Creación manual, pagos múltiples, check-in restrictivo y check-out
│   ├── 06-arriendo-recinto-completo.md    # Cotizaciones de eventos 8h, aprobación, pagos y cabaña de apoyo
│   ├── 07-housekeeping-y-limpieza.md      # Estado de aseo y liberación de cabañas limpias
│   ├── 08-contabilidad-reportes-sii.md    # Cálculo de IVA 19%, comisiones de canales y liquidación neta
│   ├── 09-canales-venta-externos.md       # Gestión de OTAs (Airbnb, Booking.com) y comisiones pactadas
│   ├── 10-equipo-y-roles.md               # Invitación de colaboradores, asignación de roles y suspensiones
│   ├── 11-bitacora-auditoria.md           # Trazabilidad en lenguaje natural y auditoría de cambios
│   ├── 12-gestion-landing-page.md         # Textos del Hero, imagen de fondo, galería y logotipo oficial
│   ├── 13-desarrollo-y-roadmap.md         # Requerimientos, reporte de bugs con Ctrl+V y Drag & Drop
│   └── 14-configuraciones-globales.md     # Parámetros institucionales, WhatsApp y editor dinámico de tramos
│
└── 📂 auditoria-egm                       # NIVEL 3: EVALUACIÓN DE INCONGRUENCIAS Y CÓDIGO FANTASMA
    ├── informe-incongruencias-codigo.md   # Diagnóstico exhaustivo de contradicciones, dead code y riesgos
    └── plan-mejoras-priorizadas.md        # Hoja de ruta para resolver las inconsistencias detectadas
```

---

## 📖 Glosario de Términos del Sistema

- **PMS (Property Management System):** Sistema informático de gestión de propiedades hoteleras y cabañas, utilizado para centralizar la ocupación, cobros y estado de limpieza del Rancho.
- **RLS (Row Level Security):** Mecanismo de seguridad a nivel de base de datos en PostgreSQL (Supabase) que limita qué registros puede ver o editar un usuario en base a su rol administrativo, bloqueando accesos no autorizados.
- **RPC (Remote Procedure Call):** Funciones almacenadas en el servidor PostgreSQL que ejecutan lógica atómica con privilegios elevados (`SECURITY DEFINER`) sin exponer las tablas completas a la web.
- **Idempotencia:** Propiedad de las operaciones de software que garantiza que procesar un mismo pago o evento múltiples veces produce exactamente el mismo resultado que procesarlo una sola vez, impidiendo cobros duplicados.
- **Stitch UI:** Filosofía de diseño de interfaz de usuario de Rancho Carmelitas caracterizada por acabados tipo cristal (glassmorphism), bordes redondeados (12px a 24px), micro-animaciones en botones y color verde Rancho (`#11d442`).
- **Abono Parcial (50%):** Monto mínimo obligatorio exigido por las políticas del Rancho para congelar las fechas de reserva de una cabaña o un evento diurno.
- **Ficha de Liquidación Interna:** Panel de visualización privado del administrador que desglosa el costo bruto de la reserva, el IVA retenido (19%), la comisión cobrada por canales externos (ej. Booking.com) y la comisión neta del PMS.
- **Housekeeping:** Ciclo operativo que cambia el estado de una cabaña a "Necesita Aseo" tras un Check-out y permite al personal de limpieza restablecerlo a "Disponible" una vez terminado el aseo.
