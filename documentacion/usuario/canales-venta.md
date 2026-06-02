# 🔌 Manual Funcional — Canales de Venta y Comisiones

Esta sección detalla el funcionamiento del panel de **Canales de Venta (`/admin/configuracion`)** y cómo las comisiones registradas se aplican al flujo de liquidación financiera del PMS de Rancho Carmelitas.

---

## 1. Introducción y Propósito
El PMS de Rancho Carmelitas permite recibir reservas generadas externamente a través de agencias de viaje online (OTAs) como Booking.com o Airbnb. El panel de Canales de Venta permite registrar estas plataformas y definir su porcentaje de comisión estándar, permitiendo que la Ficha de Liquidación Interna calcule de forma exacta las ganancias neta deducidas por la intermediación.

---

## 2. Mapa de Elementos de la Interfaz

La pantalla se divide en dos bloques lógicos interactivos:

### Bloque A: Canales de Venta Activos
Listado de los canales configurados en el Rancho.
| Elemento UI | Tipo | Comportamiento / Acción | Reglas de Validación / Backend |
| :--- | :--- | :--- | :--- |
| **Botón "Eliminar"** (Papelera) | Botón de Acción | Elimina y desactiva el canal de venta del sistema. | Las reservas históricas vigentes mantendrán su comisión estática original registrada para resguardar la consistencia contable del Rancho. |

### Bloque B: Agregar Nuevo Canal de Venta
Formulario interactivo para registrar un nuevo canal de venta en caliente.
| Elemento UI | Tipo | Comportamiento / Acción | Reglas de Validación / Backend |
| :--- | :--- | :--- | :--- |
| **Campo "Nombre del Canal"** | Entrada de Texto | Nombre de la plataforma (ej: `Airbnb`). | Obligatorio y único para evitar duplicados. |
| **Campo "Comisión del Canal (%)"** | Entrada Numérica | Porcentaje cobrado por la intermediaria (ej: `15.0`). | Debe ser un valor decimal o entero mayor o igual a cero. |
| **Botón "Guardar y Activar Canal"**| Botón de Acción | Guarda el canal en Supabase. | Inserta el registro en la tabla `plataformas` en Supabase y lo disponibiliza de inmediato. |

---

## 🔄 3. Impacto Operativo en el PMS

Una vez que se agrega y activa un Canal de Venta:
1. **Selector de Reservas Manuales:** El canal aparecerá de inmediato en el menú desplegable "Origen de Reserva" al crear o editar reservas manuales en el PMS.
2. **Liquidación Financiera Automática:** Si selecciona un origen externo (ej: `Booking.com`), el PMS aplicará automáticamente el porcentaje de comisión definido sobre la tarifa de la reserva, calculando el cargo financiero y deduciéndolo de forma transparente en el Reporte Financiero & SII.
3. **Reservas Directas:** Si no se selecciona ningún canal, el sistema clasificará la reserva como "Directa" con comisión de intermediación de `0%`.
