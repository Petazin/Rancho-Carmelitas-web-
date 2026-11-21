# 🏡 Manual de Usuario: 03. Gestión de Cabañas y Tarifas

**Pantalla:** `/admin/cabanas`  
**Roles involucrados:** Administradores (Edición y Eliminación) / Recepcionistas y Mantenimiento (Visualización y Housekeeping)  

---

## 1. El Catálogo de Cabañas

En esta sección se gestiona la oferta de hospedaje de Rancho Carmelitas. Cada cabaña cuenta con una ficha visual que resume:
* **Foto de Portada Oficial:** La imagen principal visible en la web.
* **Precio por Noche:** Tarifa base en pesos chilenos (CLP).
* **Capacidad Estándar y Adicionales Permitidos:** Número base de personas incluidas y límite máximo de camas o cupos supletorios.
* **Estado de Housekeeping:** Badge interactivo que indica si la cabaña está `'Disponible'` o `'Necesita Aseo'`.
* **Estado de Actividad:** Interruptor para mostrar u ocultar la cabaña en la página pública sin borrarla.

---

## 2. Cómo Crear una Nueva Cabaña

1. En la parte superior de `/admin/cabanas`, haz clic en el botón verde **"+ Crear Nueva Cabaña"**.
2. Completa los datos requeridos:
   - **Nombre de la Cabaña:** Ej: *Cabaña Las Hortensias*.
   - **Precio por Noche (CLP):** Valor neto base por noche.
   - **Capacidad Estándar:** Cuántos huéspedes entran con la tarifa base (ej: 4 personas).
   - **Huéspedes Adicionales Máximos:** Cupos extra permitidos (ej: 2 adicionales).
   - **Número de Habitaciones:** Cantidad de dormitorios físicos.
   - **Descripción General:** Resumen de comodidades, camas y entorno.
   - **Servicios y Amenidades:** Marca las casillas correspondientes (Wi-Fi, Asador exterior, Smart TV, Terraza privada, etc.).
3. **Fotografías Iniciales:** Puedes subir la imagen de portada y fotos secundarias. El sistema las optimizará y comprimirá automáticamente antes de guardarlas.
4. Presiona **"Crear Cabaña"**. La nueva unidad aparecerá de inmediato en el catálogo y en el cotizador del sitio web.

---

## 3. Parámetros de Huéspedes Adicionales y Tarifa Mínima

El complejo Rancho Carmelitas tiene una política estricta respecto al cobro de pasajeros adicionales:
* El campo **"Recargo por Huésped Adicional"** permite definir el porcentaje sobre el valor persona base.
* **Piso Mínimo Garantizado:** El sistema cuenta con una salvaguarda programada que **nunca cobrará menos de $10.000 CLP por noche por persona adicional**, asegurando la rentabilidad y cubriendo los costos operativos de lavandería, agua caliente y consumo eléctrico.

---

## 4. Guía de Fotografías y Formatos Recomendados

Para garantizar que el sitio web mantenga su estética premium y que las fotos carguen velozmente en celulares:

| Tipo de Fotografía | Ubicación en el Sistema | Proporción Recomendada | Resolución Ideal | Propósito |
| :--- | :--- | :--- | :--- | :--- |
| **Foto de Portada Principal** | Campo `image_url` | **3:2** (Horizontal clásico) | `1200 x 800 px` | Es la tarjeta principal que ve el cliente al explorar el catálogo y en las redes sociales. |
| **Banner Hero (Foto 1 de Galería)** | Primer elemento del carrusel | **16:9** o **21:9** (Panorámica) | `1920 x 1080 px` | Cabecera gigante a pantalla completa en la página de detalle de la cabaña. |
| **Fotos de Galería (Fotos 2 en adelante)** | Carrusel interactivo | **3:2** o **4:3** | `1200 x 800 px` | Detalles del interior, dormitorios, cocina equipada, baños y vistas a los jardines. |

> [!TIP]
> **Compresión Automática Integrada:** No necesitas reducir el peso de tus fotos manualmente en programas externos. Cuando seleccionas una imagen desde tu computadora o celular, el navegador comprime la foto automáticamente a formato WebP optimizado antes de subirla a la nube.

---

## 5. Narrativas Culturales de Pullally

Cada cabaña de Rancho Carmelitas posee una identidad arraigada en la historia local de la zona de Pullally y Papudo:
* **Lema de la Cabaña (`slogan`):** Frase poética de cabecera (ej: *"Un rincón de paz entre eucaliptos centenarios"*).
* **Origen del Nombre (`origin_title` y `origin_description`):** Relato que explica por qué la cabaña lleva ese nombre.
* **Dato Curioso (`fun_fact`):** Anécdota local que sorprende al huésped al momento de explorar la cabaña en el sitio web.

Estos textos se editan directamente en la ventana de **"Editar Ajustes"** de cada cabaña y enriquecen la pestaña *"Historia y Entorno"* que ven los visitantes.

---

## 6. Protocolo de Eliminación Segura de Cabañas

Para evitar catástrofes operativas o pérdidas accidentales de información:
1. **Acceso Exclusivo de Administrador:** El botón rojo **"Eliminar"** solo es visible para usuarios con rol `admin`.
2. **Validación Preventiva de Reservas Futuras:**
   - Si intentas eliminar una cabaña que tiene reservas vigentes o futuras (con fecha de salida mayor o igual a hoy), el sistema **bloqueará rígidamente la acción**.
   - Aparecerá un cuadro de alerta detallando los nombres de los huéspedes y las fechas comprometidas que impiden el borrado.
3. **Auditoría Automática:** Si la cabaña no tiene reservas activas y se confirma el borrado, el trigger de la base de datos estampa la eliminación en la **Bitácora de Auditoría**, guardando una copia de seguridad en JSON de los datos que tenía la cabaña y registrando el nombre del administrador responsable.
