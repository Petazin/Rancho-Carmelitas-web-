# 📊 Manual Funcional — Dashboard Operativo y KPIs

Esta sección detalla el funcionamiento del **Dashboard Principal (`/admin`)**, el significado de cada una de sus métricas operativas y las lógicas del calendario de ocupación en caliente.

---

## 1. Introducción y Propósito
El Dashboard es el centro neurálgico del PMS. Ofrece al administrador una visión rápida y en tiempo real del estado financiero, la ocupación del día y las llegadas/salidas inminentes, permitiendo tomar decisiones en segundos sin tener que navegar por tablas extensas.

---

## 2. Mapa de Elementos de la Interfaz

La pantalla se divide en tres secciones clave:

### Sección A: Tarjetas de Métricas Nucleares (KPIs)
- **Reservas Confirmadas:** Total de estancias vigentes confirmadas (con abono).
- **Ingresos Totales:** Suma neta acumulada en pesos chilenos ($ CLP) de todas las reservas vigentes.
- **Tasa de Ocupación:** Porcentaje de ocupación actual de las cabañas basado en la cantidad de cabañas disponibles y reservas activas del mes.
- **Cabañas Fuera de Servicio:** Contador de cabañas en estado inactivo o bloqueadas por mantención/cierres de fecha.

### Sección B: Próximas Llegadas Inminentes
Despliega una tabla interactiva con los huéspedes que ingresan hoy o mañana.
| Elemento UI | Tipo | Comportamiento / Acción | Reglas de Validación / Backend |
| :--- | :--- | :--- | :--- |
| **Badge de Estado** | Indicador Visual | Muestra el estado del ciclo de vida (`yellow` para Pendiente, `orange` para Confirmada, `green` para En Cabaña, `blue` para Completada). | Formateado dinámicamente en español para consistencia visual. |
| **Enlace de Fila** | Enlace de Navegación | Redirige al administrador a la sección de Reservas aplicando un filtro automático para ver únicamente esa reserva. | Envuelve el nombre en un tag `<Link href="/admin/reservas?bookingId=...">`. |

### Sección C: Calendario de Ocupación Stitch UI
Visualizador gráfico interactivo que distribuye las reservas sobre una cuadrícula mensual.
- **🟠 Naranja (Confirmada sin Abono Completo):** Reserva con abono inicial registrado (>=50%) pero con saldo por cobrar.
- **🟢 Verde (Abonada / En Cabaña):** Reserva con abono registrado o que se encuentra físicamente activa.
- **🔵 Azul (Totalmente Pagada / Completada):** Estadía saldada al 100% y finalizada.
- **🟡 Amarillo (Pendiente):** Pre-reserva a la espera del abono inicial.
- **Leyenda Interactiva:** Ubicada al pie del calendario para guiar al staff en los códigos de color de las cabañas.

---

## 🚨 Banners de Alerta Crítica (Interacción en Overbookings)
Cuando ocurren colisiones de fechas (cierres de cabañas que chocan con reservas, o reservas duplicadas por plataformas externas):
1. **Banner Rojo Superior:** El Dashboard despliega un banner de advertencia rojo parpadeante con el texto `⚠️ Overbooking detectado en cabaña X`.
2. **Deep Link Interactiva:** El banner cuenta con un enlace directo que filtra la tabla de Reservas para mostrar en el acto los dos registros en colisión, facilitando que el administrador reubique o cancele la reserva secundaria de inmediato.
3. **Persistencia del Conflicto:** Tras solucionar la colisión (editando fechas o cancelando), el banner se desvanece de inmediato en caliente.
