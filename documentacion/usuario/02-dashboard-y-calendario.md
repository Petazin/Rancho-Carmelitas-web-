# 📊 Manual de Usuario: 02. Dashboard y Calendario Interactivo

**Pantalla:** `/admin`  
**Roles involucrados:** Todo el equipo operativo  

---

## 1. Tarjetas de Resumen y KPIs (Cabecera)

Al ingresar al panel de control, la parte superior despliega las métricas comerciales consolidadas:

* **Reservas Registradas:** Conteo total de reservas activas e históricas en el sistema.
* **Cabañas Activas:** Cantidad de alojamientos habilitados para arriendo en el complejo.
* **Ingresos Brutos Estimados:** Suma total de reservas no canceladas (formateado en pesos chilenos con separador de miles).

---

## 2. Modos de Visualización

Puedes alternar entre dos vistas usando los botones superiores:

### A) Modo Lista (Próximas Llegadas)
* Muestra de forma cronológica los huéspedes que llegarán próximamente a Rancho Carmelitas.
* Despliega claramente:
  - Nombre del huésped y cabaña reservada.
  - Fechas de entrada y salida (`check-in` a `check-out`).
  - Teléfono directo destacado con badge azul (`📞`) para contactar al pasajero vía WhatsApp si es necesario.
  - Estado operativo de la estancia con su etiqueta de color homologada.
* **Acceso Rápido:** Al hacer clic sobre cualquier reserva de la lista, el sistema te redirige de inmediato a la pantalla de gestión de reservas aplicando un filtro automático sobre ese pasajero.

### B) Modo Calendario Interactivo
* Visualiza la ocupación global del mes distribuida en una cuadrícula tipo calendario.
* Permite avanzar o retroceder de mes con los botones de navegación (`◀` y `▶`).
* Cada celda muestra las reservas y eventos programados para ese día con el formato `Huésped: Cabaña`.

---

## 3. Código Oficial de Colores y Estados

Para que el recepcionista identifique la situación financiera y operativa de un vistazo, el calendario utiliza una nomenclatura cromática estricta:

| Estado / Tipo | Color Visual | Significado Operativo |
| :--- | :--- | :--- |
| **Pendiente** | 🟡 Amarillo (`#fef9c3` / Texto Ámbar) | Reserva recién ingresada. El cliente aún no acredita el abono del 50%. Si pasan más de 24h, el sistema recomendará su expiración. |
| **Confirmada (Sin Abono)** | 🟠 Naranja (`#ffedd5` / Texto Naranja) | Confirmada manualmente por la administración como excepción de confianza sin registro de dinero aún. |
| **Abonada (50%+)** | 🟢 Verde Claro (`#dcfce7` / Texto Verde) | El huésped ha cancelado el 50% o más de la estadía. La cabaña está asegurada y el remanente se cobrará en el check-in. |
| **Totalmente Pagada** | 🔵 Azul (`#dbeafe` / Texto Azul) | La estadía se encuentra cancelada al 100% ($0 de saldo pendiente). Listo para check-in inmediato. |
| **En Conflicto / Overbooking** | 🔴 Rojo (`#fee2e2` / Texto Rojo Alerta) | Dos o más reservas solapan sus fechas para la misma cabaña, o chocan con un cierre temporal de mantención. Requiere acción urgente. |

### Código de Colores para Eventos de Recinto Completo (8 Horas):
Los eventos diurnos aparecen destacados en el calendario ocupando la franja completa del día:
* 🟡 **Amarillo:** Cotización de evento recibida y pendiente de revisión.
* 🔵 **Azul:** Cotización aprobada por el administrador, esperando que el organizador pague el 50% de abono.
* 🟢 **Verde:** Evento confirmado con abono cancelado. Todo el recinto (quincho y piscina) se encuentra bloqueado exclusivamente para este grupo.

---

## 4. Alertas Críticas de Colisión en Cabecera

Si el sistema detecta que se programó un cierre de mantención en fechas donde ya existía una reserva confirmada, aparecerá un **Banner Rojo Parpadeante de Alerta Crítica (`🚨`)** en la parte superior:
* Te indicará exactamente qué cabaña está afectada, las fechas en colisión y el nombre del huésped comprometido.
* Incluye un botón directo para ir a la reserva y reubicar al pasajero en otra cabaña disponible o coordinar una solución.
* Una vez resuelta la colisión, la alerta se desvanece de manera reactiva al instante.
