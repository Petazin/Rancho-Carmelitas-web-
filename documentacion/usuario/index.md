# 📖 Manual de Usuario y Operaciones del PMS — Rancho Carmelitas

**Dirigido a:** Administradores, Recepcionistas y Personal Operativo de Rancho Carmelitas  
**Versión del Sistema:** v2.0.0 (Noviembre 2026)  
**Acceso al Sistema:** [`https://ranchocarmelitas.cl/admin`](https://ranchocarmelitas.cl/admin) (o entorno local en desarrollo)  

---

## 1. Propósito de este Manual

Este manual está diseñado para brindar una guía clara, práctica y sin tecnicismos para la operación diaria del complejo Rancho Carmelitas. Aquí aprenderás a gestionar reservas, recibir abonos, realizar ingresos y salidas de huéspedes, administrar el estado de limpieza de las cabañas y gestionar arriendos de recinto completo para eventos masivos.

---

## 2. Mapa de Módulos del Sistema

| Módulo | Ruta en el Sistema | ¿Quién lo usa? | Función Principal |
| :--- | :--- | :--- | :--- |
| **[01. Acceso y Seguridad](01-acceso-y-seguridad.md)** | `/login` | Todo el equipo | Inicio de sesión, recuperación de contraseña y cambio seguro de clave. |
| **[02. Dashboard y Calendario](02-dashboard-y-calendario.md)** | `/admin` | Todos | Resumen general, ingresos estimados, calendario con código de colores y llegadas del día. |
| **[03. Gestión de Cabañas y Tarifas](03-gestion-cabanas-y-tarifas.md)** | `/admin/cabanas` | Administradores | Ajuste de precios por noche, fotos de portada/galería, capacidad y narrativas locales. |
| **[04. Cierres y Bloqueos de Fechas](04-cierres-y-bloqueos.md)** | `/admin/cabanas` | Administradores | Declarar mantenciones de cabañas específicas o vacaciones totales del complejo. |
| **[05. Gestión de Reservas de Cabañas](05-reservas-cabanas.md)** | `/admin/reservas` | Administradores y Recepcionistas | Creación manual, registro de abonos, check-in restrictivo, check-out asistido y cancelaciones. |
| **[06. Arriendo de Recinto Completo (8h)](06-arriendo-recinto-completo.md)** | `/admin/reservas?tab=eventos` | Administradores | Cotizaciones de colegios y adultos mayores, aprobación, cobro de abonos y cabaña de apoyo. |
| **[07. Housekeeping y Limpieza](07-housekeeping-y-limpieza.md)** | `/admin/cabanas` | Personal de Aseo y Recepción | Control de cabañas que necesitan limpieza y liberación a estado disponible. |
| **[08. Contabilidad y Reportes SII](08-contabilidad-reportes-sii.md)** | `/admin/reservas?tab=contabilidad` | Administradores | Cálculo de IVA 19%, comisiones de plataformas y liquidación neta mensual para el dueño. |
| **[09. Canales de Venta Externos](09-canales-venta-externos.md)** | `/admin/configuracion` | Administradores | Gestión de plataformas (Booking.com, Airbnb, Directo) y sus comisiones pactadas. |
| **[10. Equipo de Trabajo y Roles](10-equipo-y-roles.md)** | `/admin/usuarios` | Administradores | Invitar a nuevos integrantes, asignar permisos y bloquear accesos si corresponde. |
| **[11. Bitácora de Auditoría](11-bitacora-auditoria.md)** | `/admin/auditoria` | Administradores | Historial transparente que explica en español quién modificó cada registro del sistema. |
| **[12. Gestión de la Landing Page](12-gestion-landing-page.md)** | `/admin/landing` | Administradores | Modificar títulos del inicio, foto panorámica, galería de fotos y logotipo oficial. |
| **[13. Desarrollo y Roadmap](13-desarrollo-y-roadmap.md)** | `/admin/desarrollo` | Administradores | Proponer mejoras, reportar fallos pegando capturas con `Ctrl+V` y ordenar prioridades. |

---

## 3. Reglas de Oro Operativas de Rancho Carmelitas

1. **Abono del 50% Obligatorio:** Ninguna reserva o evento queda confirmada hasta que el huésped haya pagado al menos el 50% de la tarifa acordada.
2. **Entrega de Cabaña con Saldo Cero ($0):** Está estrictamente prohibido realizar el Check-in y entregar las llaves de la cabaña si el pasajero mantiene saldo pendiente de pago.
3. **Cartelería y Normas de Convivencia:**
   - 🚫 **No se admiten mascotas** de ninguna especie en el complejo.
   - ⏰ **Check-out:** Máximo a las **12:00 horas**.
   - 🔇 **Horario de Silencio:** Desde las 23:00 hrs para garantizar el descanso familiar.
   - 👥 **Pasajeros Adicionales:** Se cobra un piso mínimo garantizado de **$10.000 CLP** por noche por persona no incluida en la capacidad base.
