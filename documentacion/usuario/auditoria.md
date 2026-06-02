# 📜 Manual Funcional — Bitácora de Auditoría y Trazabilidad

Esta sección detalla el funcionamiento de la **Bitácora de Auditoría (`/admin/auditoria`)** y cómo el sistema traduce logs técnicos de base de datos a explicaciones claras en lenguaje natural para los administradores.

---

## 1. Introducción y Propósito
Para cumplir con políticas estrictas de seguridad de accesos y evitar incidentes, el PMS de Rancho Carmelitas implementa un monitor de auditoría automática. Cada inserción, edición o borrado de reservas, cabañas, bloqueos o perfiles de usuarios se registra de forma inalterable para auditar qué miembro del staff realizó cada acción.

---

## 2. Elementos de la Interfaz

La pantalla se divide en tres secciones clave:

### Sección A: Timeline de Eventos (Bitácora)
- Presenta una lista cronológica descendente de las actividades del Rancho.
- Cada evento cuenta con un icono Stitch UI semántico (ej: `🟢` para check-in, `🔴` para cancelaciones, `📩` para invitaciones de equipo, `🧼` para aseos finalizados).
- Muestra el nombre y correo del operador administrativo ejecutor del cambio.

### Sección B: Traductor Inteligente a Lenguaje Natural
El sistema cuenta con un motor parser avanzado (`getNaturalLanguageExplanation`) que analiza los registros crudos de base de datos y los redacta de forma fluida en español.
- **Ejemplo en Bloqueos:** En lugar de mostrar `INSERT INTO cabin_closures values...`, el sistema redacta:
  `"🔓 Claudio Milanolo levantó y eliminó el bloqueo temporal de cabaña N° 2 que estaba programado para el 15/06/2026."`
- **Ejemplo en Reservas:** Redacta con precisión los abonos ingresados:
  `"💰 Claudio Milanolo registró un pago de $150,000 CLP para la reserva de Juan Pérez en Cabaña Bosque."`
- **Ejemplo en Perfiles:** Narra el baneo o edición de roles:
  `"🔒 Claudio Milanolo revocó el acceso (Baneó) a la cuenta del colaborador Carlos Recepción por motivo de 'Término de Contrato'."`

### Sección C: Visor de Diferencias (JSON Diff Block)
Al presionar el botón **"🔍 Ver Detalles del Cambio"** en cualquier evento del Timeline, se abrirá una ventana lateral premium con un visor de diferencias:
- Muestra en rojo los campos anteriores (`old_value`) y en verde los valores nuevos actualizados (`new_value`), permitiendo auditar con exactitud qué letra o número fue editado en las fichas financieras o de clientes.

---

## 🔄 3. Manual de Procedimientos (Exportación)

### Cómo Exportar la Bitácora de Auditoría
Si requiere entregar reportes de auditoría o respaldar los logs de actividad:
1. Ingrese a la sección **Bitácora de Auditoría** en el menú de navegación.
2. Utilice los filtros superiores para acotar la búsqueda por rango de fechas u operador.
3. Presione el botón premium **"📤 Exportar Bitácora en JSON"** en la parte superior derecha.
4. El sistema generará y descargará automáticamente un archivo de texto en formato JSON estructurado con el historial completo de eventos para su análisis externo o respaldo legal en frío.
