# 🚧 Manual de Usuario: 04. Cierres Temporales y Bloqueos de Fechas

**Pantalla:** `/admin/cabanas` (Sección inferior: "Cierres y Bloqueos Temporales")  
**Roles involucrados:** Administradores  

---

## 1. ¿Para qué sirven los Cierres Temporales?

Los cierres temporales permiten a la administración congelar o deshabilitar fechas en el calendario sin necesidad de crear reservas ficticias. Al declarar un cierre, los días seleccionados quedan bloqueados inmediatamente en:
* Los cotizadores públicos de los clientes (impidiendo que nadie reserve esas fechas en la web).
* El modal de creación manual de reservas del personal en el PMS.
* El calendario del Dashboard (destacando las fechas con indicadores de bloqueo).

---

## 2. Tipos de Cierres Disponibles

1. **Cierre Parcial (Cabaña Específica):**
   - Se utiliza para mantenciones programadas (reparación de calefón, pintura, cambio de muebles, sanitización profunda).
   - Bloquea únicamente la cabaña seleccionada; las demás cabañas del complejo continúan operativas y disponibles para el público.
2. **Cierre Total Global (Todo el Rancho):**
   - Se selecciona la opción `"Todas las Cabañas (Cierre Total)"`.
   - Se utiliza para vacaciones del personal, eventos privados de exclusividad completa, cortes generales de suministros o mantención mayor de la piscina familiar.
   - Bloquea todas las cabañas del complejo de forma simultánea.

---

## 3. Cómo Declarar un Bloqueo de Fechas

1. En `/admin/cabanas`, baja hasta la sección **"Cierres y Bloqueos Temporales"**.
2. Haz clic en el botón verde **"+ Declarar Nuevo Cierre Temporal"**.
3. Selecciona:
   - **Cabaña Afectada:** Elige una cabaña particular o selecciona *"Todas las Cabañas (Cierre Total del Rancho)"*.
   - **Fecha de Inicio:** Primer día en que la cabaña estará fuera de servicio.
   - **Fecha de Término:** Último día del bloqueo.
   - **Motivo del Cierre:** Escribe una justificación clara (ej: *Pintura de dormitorios*, *Mantención de filtros de piscina*, *Vacaciones anuales*).
4. Haz clic en **"Guardar Cierre"**.
5. Las fechas quedarán bloqueadas de inmediato.

---

## 4. Detección Preventiva de Colisiones con Reservas Existentes

El sistema cuenta con un motor defensivo de seguridad:
* Si intentas declarar un cierre temporal en un rango de fechas donde **ya existe una reserva confirmada o pendiente**, el sistema lo detectará al instante.
* Desplegará un **Banner Rojo de Alerta Crítica (`🚨 Colisión Detectada`)** advirtiendo que existen huéspedes con estadías comprometidas en ese periodo.
* **Resolución Asistida:** El banner te proporcionará enlaces directos para revisar la reserva afectada, reubicar al pasajero en otra cabaña de igual o superior categoría, o contactarlo antes de continuar.

---

## 5. Cómo Levantar o Eliminar un Cierre

Cuando los trabajos de mantención terminen o el rancho decida reabrir las fechas:
1. Dirígete a la tabla de **"Cierres Programados"**.
2. Ubica el registro que deseas anular y haz clic en el botón rojo **"Eliminar"** (ícono de papelera).
3. Confirma la acción en la ventana emergente.
4. Las fechas quedarán liberadas automáticamente en el sitio web y los calendarios volverán a mostrarse disponibles para reservas.
