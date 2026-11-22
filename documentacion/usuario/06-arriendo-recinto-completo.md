# 🎪 Manual de Usuario: 06. Arriendo de Recinto Completo (Eventos Diurnos de 8 Horas)

**Pantalla:** `/admin/reservas?tab=eventos` (o acceso directo desde los eventos del Dashboard)  
**Roles involucrados:** Administradores y Recepcionistas  

---

## 1. Concepto y Alcance del Arriendo de Recinto

El servicio de Arriendo de Recinto Completo está diseñado exclusivamente para **eventos diurnos de 8 horas continuas (horario estándar de 10:00 a 18:00 hrs)**, orientados a:
* Paseos de fin de año de colegios y cursos escolares.
* Agrupaciones de adultos mayores y clubes sociales.
* Encuentros familiares masivos (cumpleaños, aniversarios).
* Jornadas de esparcimiento para empresas e instituciones.

### ¿Qué instalaciones incluye el uso exclusivo del recinto?
* **Quincho Techado Equipado:** Parrilla para asados, refrigerador, microondas, hervidor, mesas largas y bancas de madera.
* **Piscina Familiar:** Acceso exclusivo para el grupo respetando las normas de higiene y seguridad.
* **Baños y Camarines Exteriores.**
* **Áreas Verdes, Canchas y Jardines.**
* **Estacionamiento Privado** dentro del complejo.

> [!IMPORTANT]
> **No Incluye Cabañas por Defecto:** Este servicio es diurno y no contempla el uso interior de cabañas para hospedaje, salvo que se pacte explícitamente una **Cabaña de Apoyo** con la administración.

---

## 2. Tarifario Oficial y Parámetros Comerciales (v2.4.x)

El cotizador público y el sistema administrativo aplican las siguientes reglas oficiales autogestionables desde `/admin/configuraciones`:

| Concepto | Regla y Valor Oficial | Notas de Operación |
| :--- | :--- | :--- |
| **Tarifas Fijas por Tramo** | Configurables en `/admin/configuraciones` | Rangos sin gaps (ej: 1 a 20 pers: $190.000, 21 a 40 pers: $250.000, 41 a 70 pers: $350.000). |
| **Asistentes Adicionales** | **Coordinar con administración** | Se suprime el cobro unitario por adicional en recinto. El cliente especifica extras en observaciones. |
| **Menores de 3 Años** | **$0 CLP (Liberados de cobro)** | No pagan entrada. Se registran en el aforo total por seguridad y control de acceso. |
| **Juego Inflable Propio** | **Configurable (Defecto $5.000 CLP)** | Recargo fijo para cubrir el consumo del motor eléctrico del inflable. |
| **Abono Obligatorio** | **Configurable (Defecto 50%)** | Monto requerido para congelar y confirmar la fecha en el calendario. |
| **Aforo Máximo Físico** | **Configurable (Defecto 70 personas)** | Al sobrepasarse, el cotizador desvía la consulta a WhatsApp para cotización corporativa. |

---

## 3. Flujo Paso a Paso de una Solicitud de Evento

```mermaid
flowchart TD
    Paso1["1. Solicitud Pública: El organizador cotiza en /recinto-completo"]
    Paso2["2. Notificación Inmediata: Llega correo a cliente y alerta al administrador"]
    Paso3["3. Revisión en PMS: El admin entra a /admin/reservas?tab=eventos"]
    Paso4["4. Aprobación: El admin pulsa '✓ Aprobar Cotización'"]
    Paso5["5. Enlace de Pago: El cliente recibe correo con botón de abono online (50%)"]
    Paso6["6. Pago Acreditado: El evento pasa a 'Confirmada'"]
    Paso7["7. Blindaje Automático: El sistema genera un Cierre Total en cabin_closures"]

    Paso1 --> Paso2 --> Paso3 --> Paso4 --> Paso5 --> Paso6 --> Paso7
```

---

## 4. Gestión del Evento en el Panel Administrativo

En la pestaña **"🎪 Arriendos de Recinto (8h)"** encontrarás la tabla de cotizaciones con las siguientes herramientas:

### A) Filtro de Estados
Puedes filtrar por: *Todos*, *Pendientes de Aprobación*, *Aprobadas (esperando pago)* o *Confirmadas*.

### B) Botón "✓ Aprobar Cotización"
* Cuando revisas los datos de un colegio o institución y confirmas que la fecha es viable, presiona **"✓ Aprobar"**.
* El sistema actualizará el estado a `'Aprobada'` y despachará automáticamente un correo formal al organizador con el botón de pago oficial del 50% de abono.

### C) Botón "💳 Registrar Abono Manual"
* Si el organizador realiza una transferencia bancaria directa a la cuenta del Rancho o paga en efectivo:
  1. Haz clic en **"💳 Registrar Abono"**.
  2. Ingresa el monto transferido, el medio de pago y el número de operación.
  3. Presiona **"Guardar Abono"**.
  4. El sistema promoverá el evento al estado **`'Confirmada'`** y activará el cierre total de cabañas para ese día.

### D) Asignación de Cabaña de Apoyo (Excepción Conversada)
* Si el grupo necesita un espacio techado adicional para mudar lactantes o descanso de personas mayores:
  1. Haz clic en el botón morado **"🏡 Cabaña de Apoyo"**.
  2. Selecciona la cabaña disponible que se asignará al grupo.
  3. Ingresa el suplemento pactado (o `$0` si se otorga como cortesía comercial).
  4. Presiona **"Vincular Cabaña"**.

---

## 5. Portal de Seguimiento del Organizador (`/recinto-completo/pago`)

El organizador del evento cuenta con una página exclusiva para su grupo:
* Puede ingresar su folio de cotización en cualquier momento para ver el estado de su solicitud.
* Si la cotización fue aprobada, la pantalla despliega el botón oficial de **Mercado Pago** para abonar con tarjeta de débito, crédito o Webpay con acreditación instantánea.
* Una vez acreditado el abono, la página muta a una ficha de confirmación con el sello oficial del Rancho, las políticas del quincho y las indicaciones de llegada para el chofer del bus escolar o los vehículos del grupo.
