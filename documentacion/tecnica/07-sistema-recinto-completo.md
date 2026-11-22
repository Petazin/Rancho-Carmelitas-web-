# 🎪 Documentación Técnica: Sistema de Arriendo de Recinto Completo (Eventos Diurnos de 8 Horas)

**Propósito:** Comercialización y gestión operativa del uso exclusivo del complejo para grupos masivos (paseos de curso, adultos mayores, familias e instituciones)  
**Horario Estándar:** Bloque diurno de 8 horas continuas (10:00 a 18:00 hrs)  
**Infraestructura Incluida:** Quincho techado equipado (parrilla, refrigerador, microondas, mesas), piscina familiar, baños exteriores, áreas verdes y estacionamiento privado  

---

## 1. Reglas de Negocio y Motor Tarifario Dinámico (v2.4.x)

El sistema opera bajo un motor de tarifación flexible y autoritativo en servidor PostgreSQL, sincronizado en tiempo real con la administración:

### A) Tarifas Fijas por Tramo Dinámico (Autogestionables)
* **Tramos Parametrizables en Base de Datos:** Los tramos tarifarios se almacenan en formato JSON en `settings.venue_pricing_tiers` y son configurables en tiempo real por los administradores desde `/admin/configuraciones`:
  - **Tramo Estándar (Grupos Pequeños):** Ej. 1 a 20 personas = Tarifa Fija (ej: $190.000 CLP).
  - **Tramo Mediano (Grupos Medianos):** Ej. 21 a 40 personas = Tarifa Fija (ej: $250.000 CLP).
  - **Tramo Grande (Grupos Mayores):** Ej. 41 a 70 personas = Tarifa Fija (ej: $350.000 CLP).
* **Auto-Encadenamiento Continuo (`rechainTiers`):** Al modificar el tope de personas de cualquier tramo, el siguiente tramo encadena automáticamente su límite inferior en `Hasta + 1`, garantizando continuidad matemática estricta sin solapamientos ni lagunas tarifarias.

### B) Supresión de Cobro por Adicional en Recinto (Coordinación Directa)
* **Alineación Comercial Oficial:** Se eliminó el concepto de cobro de adicionales por persona exclusivamente para el servicio de Arriendo de Recinto Completo (manteniéndose 100% inalterado para el arriendo de cabañas individuales).
* **Política de Capacidad y Asistentes:** El cotizador informa en cada tarjeta: `Adicionales: Coordinar con administración`. Si un grupo prevé asistentes adicionales sobre el límite estándar, se solicita detallarlo en las notas del cotizador para acordar los requerimientos con la administración.
* **Exención para Menores de 3 Años:** Los bebés y niños menores de 3 años están **liberados de cobro ($0)**. El cotizador desglosa la cantidad de menores de 3 años y los descuenta del aforo pagante.

### C) Servicios Extra y Políticas Operativas
* **Juegos Inflables:** Parámetro autogestionable en `settings.venue_bouncy_castle_fee` (por defecto $5.000 CLP o el valor configurado por la administración para cubrir el consumo eléctrico del motor soplador).
* **Abono Mínimo Obligatorio:** Parámetro autogestionable en `settings.venue_deposit_percentage` (por defecto 50% del total presupuestado) requerido para congelar y reservar la fecha de forma definitiva.
* **Aforo Físico Máximo:** Configurable en `settings.venue_max_capacity` (por defecto 70 personas). Si la cantidad de asistentes supera este límite, el cotizador activa el canal directo a WhatsApp para cotizar eventos masivos a medida.

---

## 2. Componentes de la Arquitectura de Software

```mermaid
flowchart LR
    A["Cotizador Público SSR (/recinto-completo#cotizador)"] -->|RPC autoritativa create_public_event_quote| B[("event_quotes (Estado: Cotizacion_Pendiente)")]
    B -->|API Segura /api/send-event-quote-email| C["Acuse al Cliente y Alerta al Administrador"]
    D["PMS Admin (/admin/reservas?tab=eventos)"] -->|Botón Aprobar (RBAC)| B
    B -->|Estado: Aprobada| E["Envío de Link de Pago de Abono 50% al Cliente"]
    E --> F["Portal de Pago (/recinto-completo/pago)"]
    F -->|Mercado Pago o Transferencia| G["Acreditación de Abono"]
    G -->|Estado: Confirmada| H[("Trigger sync_event_quote_closure")]
    H -->|Cierre Total Automático| I[("cabin_closures (Bloqueo de Todo el Rancho)")]
```

---

## 3. Especificación de Funciones y Triggers en PostgreSQL

### 3.1. `check_full_venue_availability(p_date DATE) -> JSON`
Valida de forma atómica si una fecha específica está disponible para Arriendo de Recinto Completo:
1. Verifica si existen reservas individuales de cabañas en `bookings` que solapen con esa fecha (`status != 'Cancelada'`).
2. Verifica si existen cierres temporales en `cabin_closures` (totales o parciales).
3. Verifica si ya existe otro evento confirmado o aprobado en `event_quotes` para ese día.
* Retorna `{ "available": boolean, "reason": string }`.

### 3.2. `get_occupied_venue_dates() -> TABLE (occupied_date DATE)`
Genera la unión de todas las fechas que no pueden ser seleccionadas en el calendario del cotizador:
```sql
SELECT DISTINCT d::DATE FROM bookings b, generate_series(b.check_in, b.check_out, '1 day'::interval) d WHERE b.status != 'Cancelada'
UNION
SELECT DISTINCT d::DATE FROM cabin_closures c, generate_series(c.start_date, c.end_date, '1 day'::interval) d
UNION
SELECT event_date FROM event_quotes WHERE status IN ('Confirmada', 'Aprobada');
```

### 3.3. Trigger de Sincronización Automática con `cabin_closures`
La función `sync_event_quote_closure()` se dispara ante cambios de estado en `event_quotes`:
* **Al confirmarse (`NEW.status = 'Confirmada'`):** Inserta un registro en `cabin_closures` con `cabin_id = NULL` (Cierre Total Global) para la fecha del evento con la glosa `"Evento Exclusivo Recinto: [Grupo]"` y guarda el `associated_closure_id`.
* **Al cancelarse o rechazarse:** Elimina automáticamente el cierre de `cabin_closures` liberando las cabañas para arriendos normales.

---

## 4. Visualización en el Dashboard del PMS

En [`src/app/admin/page.tsx`](file:///c:/Users/Petazo/Desktop/Pagina%20rancho%20Carmelitas/rancho-carmelitas-web/src/app/admin/page.tsx), los eventos de recinto completo se integran con el calendario general y la lista de llegadas:
* **Código Cromático Homologado:**
  - 🟡 **Amarillo (`Cotizacion_Pendiente`):** Solicitud recibida pendiente de revisión.
  - 🔵 **Azul (`Aprobada`):** Cotización aprobada esperando el pago del 50%.
  - 🟢 **Verde (`Confirmada`):** Abono acreditado y recinto bloqueado al 100%.
* **Navegación Asistida:** Al hacer clic en un evento desde el Dashboard, el sistema redirige automáticamente a `/admin/reservas?tab=eventos&id=${quote.id}`, abriendo la pestaña de eventos y aplicando un resalte visual animado sobre la cotización elegida.
