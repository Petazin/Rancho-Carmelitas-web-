# 📚 Centro de Documentación — Rancho Carmelitas

Bienvenido al centro de documentación técnica y funcional del PMS (Property Management System) y Landing Page de **Rancho Carmelitas**. Este espacio ha sido estructurado meticulosamente por el equipo de ingeniería para garantizar la autonomía operativa, la gobernanza de infraestructura y el correcto mantenimiento del software.

---

## 📂 Organización de la Documentación

La documentación está dividida en dos niveles de especialización:

```
/documentacion
│
├── 📂 usuario                          # NIVEL 1 - Manual Funcional para el Administrador del PMS
│   ├── index.md                        # Índice de la guía, mapa del sitio y flujos lógicos de negocio.
│   ├── login.md                        # Acceso y recuperación de contraseñas.
│   ├── dashboard.md                    # Panel de control de métricas, KPIs y ocupación inminente.
│   ├── reservas.md                     # Creación manual, flujo de abonos, cancelaciones y lógica matemática.
│   ├── cabanas.md                      # Control de tarifas por temporada y narrativas de Pullally.
│   ├── usuarios.md                     # Administración del equipo de trabajo, roles y permisos.
│   ├── auditoria.md                    # Bitácora de trazabilidad de cambios en lenguaje natural.
│   ├── configuraciones-globales.md     # Datos del Rancho, empresa y contacto (WhatsApp, RUT).
│   └── canales-venta.md                # Configuración de comisiones y canales externos (Airbnb, Booking).
│
└── 📂 infraestructura                  # NIVEL 2 - Runbook de Servidores y Sistemas Satélite
    ├── index.md                        # Resumen de arquitectura global y modelo Zero-Trust.
    ├── 1-supabase.md                   # Operación de base de datos relacional y autenticación Auth.
    ├── 2-resend.md                     # Configuración de mailing transaccional unidireccional (saliente).
    ├── 3-vercel.md                     # Hosting de Next.js, despliegues automáticos y variables de entorno.
    ├── 4-dominios.md                   # Gestión de dominios en DominiosChile, delegación DNS y SSL.
    ├── checklist-handover.md           # Guía secuencial para la entrega definitiva de contraseñas nucleares.
    └── procedimientos-emergencia.md    # Planes de acción ante caídas del servidor o rotación de claves.
```

---

## 📖 Glosario de Términos Técnicos

- **PMS (Property Management System):** Sistema informático de gestión de propiedades hoteleras y cabañas, utilizado para centralizar la ocupación, cobros y estado de limpieza del Rancho.
- **Sistemas Satélite:** Servicios externos en la nube en los que se apoya la aplicación para funcionar (Vercel, Supabase, Resend y DominiosChile).
- **RLS (Row Level Security):** Mecanismo de seguridad a nivel de base de datos en PostgreSQL (Supabase) que limita qué registros puede ver o editar un usuario en base a su rol administrativo, bloqueando accesos no autorizados.
- **Stitch UI:** Filosofía de diseño de interfaz de usuario de Rancho Carmelitas caracterizada por acabados tipo cristal (glassmorphism), bordes ultra redondeados (24px), micro-animaciones en botones y color verde Rancho (#11d442).
- **Zero-Trust (Confianza Cero):** Paradigma de seguridad informática que asume que ninguna solicitud es segura por defecto y requiere validación rigurosa (como la re-autenticación in-app al consultar contraseñas).
- **Abono Parcial (50%):** Monto mínimo obligatorio exigido por las políticas del Rancho para congelar las fechas de reserva de una cabaña.
- **Ficha de Liquidación Interna:** Panel de visualización privado del administrador que desglosa el costo bruto de la reserva, el IVA retenido (19%), la comisión cobrada por canales externos (ej. Booking.com) y la comisión neta del PMS.
- **Narrativas de Pullally:** Historias, lemas y datos curiosos locales integrados de forma dinámica en las cabañas del Rancho para potenciar la experiencia y el arraigo cultural del huésped.
- **Housekeeping (Aseo de Cabañas):** Ciclo operativo que cambia el estado de una cabaña a "Necesita Aseo" tras un Check-out y permite al personal de limpieza restablecerlo a "Disponible" una vez terminado el aseo.
