# 📜 Manual de Usuario: 11. Bitácora de Auditoría y Trazabilidad Histórica

**Pantalla:** `/admin/auditoria`  
**Roles involucrados:** Exclusivo para Administradores con control total  

---

## 1. ¿Qué es la Bitácora de Auditoría?

La Bitácora de Auditoría es el libro de registro digital e inmutable de Rancho Carmelitas. Cada vez que alguien crea, modifica o elimina una reserva, cambia el precio de una cabaña, bloquea fechas o suspende a un usuario, un disparador automático de la base de datos captura la acción y la guarda permanentemente.

---

## 2. Traducción Automática a Lenguaje Natural

A diferencia de los sistemas tradicionales que solo muestran códigos técnicos difíciles de entender, la Bitácora de Rancho Carmelitas interpreta las operaciones y las explica en **español claro y fluido**:

| Ícono | Tipo de Operación | Ejemplo de Explicación en Pantalla |
| :--- | :--- | :--- |
| 📋 | **Reserva de Cabaña** | *"El administrador Juan Pérez registró una nueva reserva para Carlos Soto en Cabaña Las Hortensias ($180.000)."* |
| 💳 | **Abono de Pago** | *"Se acreditó un abono de $90.000 (Transferencia bancaria) para la reserva de María Rojas."* |
| 🚗 | **Check-In** | *"Recepción completó el Check-in y entrega de cabaña a la patente AB-CD-12 tras liquidar el saldo."* |
| 🔑 | **Check-Out** | *"Se procesó el Check-out de la Cabaña 2. Las llaves fueron entregadas y la cabaña pasó a estado 'Necesita Aseo'."* |
| ❌ | **Cancelación** | *"Se canceló la reserva de Pedro Gómez. Motivo: Expiración de plazo de 24 horas sin abono."* |
| 🏡 | **Cabañas y Tarifas** | *"Se actualizó el precio por noche de la Cabaña El Nogal de $65.000 a $75.000 CLP."* |
| 🔒 | **Bloqueo de Usuario** | *"El administrador bloqueó la cuenta de Luis Muñoz. Motivo: Término de temporada."* |
| 🔓 | **Desbloqueo de Usuario**| *"Se levantó la suspensión de acceso para la cuenta de Luis Muñoz."* |
| 📩 | **Invitaciones de Correo**| *"Se reenvió el correo de invitación al colaborador para activar su cuenta."* |
| 🎪 | **Eventos de Recinto** | *"Se aprobó la cotización de Arriendo de Recinto para el Colegio San José (45 personas)."* |

---

## 3. Herramientas de Búsqueda y Filtros

En la cabecera de `/admin/auditoria` dispones de filtros interactivos para encontrar rápidamente cualquier evento:
* **Filtro por Módulo / Tabla:** Selecciona si buscas movimientos en *Reservas*, *Cabañas*, *Pagos*, *Cierres Temporales*, *Usuarios* o *Roadmap*.
* **Filtro por Tipo de Acción:** *Creaciones (INSERT)*, *Modificaciones (UPDATE)* o *Eliminaciones (DELETE)*.
* **Filtro por Operador:** Busca las acciones realizadas por un miembro específico del equipo.
* **Rango de Fechas:** Acota la búsqueda al día de hoy, esta semana o un mes en particular.

---

## 4. Inspección Comparativa de Diferencias (Visualizador Diff)

Si necesitas auditar con exactitud qué valor exacto cambió:
1. Haz clic en la fila de cualquier evento registrado.
2. Se desplegará la **Vista Comparativa de Auditoría**:
   - En **rojo** verás el dato anterior (`old_data`).
   - En **verde** verás el dato nuevo modificado (`new_data`).
3. Esto permite comprobar con total transparencia quién alteró un precio, quién aplicó un descuento manual o a qué hora exacta se confirmó un abono.
