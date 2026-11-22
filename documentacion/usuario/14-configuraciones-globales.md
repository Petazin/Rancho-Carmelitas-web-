# ⚙️ Manual de Usuario: 14. Configuraciones Globales y Tarifas de Recinto

**Pantalla:** `/admin/configuraciones`  
**Roles involucrados:** Administradores  

---

## 1. Propósito del Módulo

El panel de **Configuraciones Globales** permite a la administración del complejo gestionar de forma 100% autónoma los parámetros institucionales de Rancho Carmelitas y el motor tarifario dinámico para el **Arriendo de Recinto Completo (8 horas)** sin necesidad de modificar el código fuente de la aplicación.

---

## 2. Parámetros Generales de la Empresa

En la sección superior se configuran los datos de identidad corporativa y canales de contacto:

| Parámetro | Clave en Base de Datos | Descripción y Uso |
| :--- | :--- | :--- |
| **Número de WhatsApp** | `whatsapp_number` | Número oficial con código de país (ej: `56912345678`). Se utiliza para abrir conversaciones prellenadas desde el cotizador web y para coordinar eventos masivos. |
| **Nombre de la Empresa** | `company_name` | Razón social o nombre de fantasía visible en el encabezado de todos los correos automáticos. |
| **RUT de la Empresa** | `company_rut` | Identificador tributario oficial para comprobantes y plantillas de correo. |
| **Dirección Física** | `company_address` | Dirección del rancho para orientación de los clientes en correos y mapa. |
| **Teléfono de Contacto** | `company_phone` | Teléfono visible en los correos y pie de página institucional. |
| **Email de Contacto** | `company_email` | Correo electrónico informado a los clientes para consultas y envío de comprobantes de transferencia. |
| **Comisión Admin por Defecto (%)** | `default_admin_commission` | Porcentaje de comisión administrativa aplicado por defecto al crear reservas manuales en el PMS. |

---

## 3. Editor Dinámico de Tramos de Arriendo de Recinto (8 Horas)

El sistema comercializa el uso exclusivo del complejo para delegaciones diurnas a través de un tarifario por tramos fijos.

### Características del Editor de Tramos:
1. **Definición de Tramos:** Cada tramo cuenta con:
   - **Nombre del Plan:** Ej. *Paseo Estándar (hasta 20 personas)*.
   - **Rango de Asistentes:** Límites `Desde (pers.)` y `Hasta (pers.)`.
   - **Tarifa Fija del Tramo ($):** Monto total en pesos chilenos (CLP) por las 8 horas de exclusividad.
2. **Auto-Encadenamiento Matemático (`rechainTiers`):** Al modificar el valor `Hasta` de un tramo, el tramo siguiente actualiza de manera automática su límite inferior a `Hasta + 1`, erradicando de raíz vacíos o solapamientos de tarifas.
3. **Banner Reactivo de Sincronización de Aforo:**
   - Si el aforo máximo físico del complejo no coincide con el tope del último tramo tarifario, el sistema despliega una alerta visual interactiva.
   - Cuenta con un botón de 1 clic para **Alinear Aforo Automáticamente** y bloquea preventivamente el guardado si se detectan incoherencias numéricas.
4. **Adición y Eliminación de Tramos:**
   - Botón **"➕ Agregar Nuevo Tramo"** para incorporar nuevos rangos de aforo.
   - Botón **"✕"** para eliminar tramos no deseados.
   - Botón **"Restablecer Tramos Recomendados"** para restaurar la estructura estándar de 3 planes limpios.
5. **Parámetros Complementarios de Recinto:**
   - **Recargo por Inflable Propio ($):** Monto fijo para costear el consumo eléctrico del soplador.
   - **Porcentaje de Abono Requerido (%):** Monto exigido (por defecto 50%) para bloquear la fecha en el calendario.
   - **Aforo Máximo Físico (pers.):** Capacidad física total permitida para el recinto.

---

## 4. Procedimiento para Guardar Cambios

1. Modifica los valores deseados en los campos de texto o en la tabla de tramos.
2. Revisa que el banner de aforo no indique discrepancias pendientes.
3. Pulsa el botón verde **"Guardar Configuraciones"** al final de la pantalla.
4. El sistema persistirá los cambios de forma atómica en Supabase y los reflejará de inmediato en el cotizador público de `/recinto-completo#cotizador`.
