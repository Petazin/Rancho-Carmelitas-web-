# 🏡 Manual Funcional — Gestión de Cabañas y Narrativa de Pullally

Esta sección detalla el funcionamiento del panel de **Cabañas (`/admin/cabanas`)**, el control operativo de limpieza (Housekeeping) y cómo integrar de forma dinámica la narrativa histórica local en la landing page pública.

---

## 1. Introducción y Propósito
El panel de Cabañas permite definir la capacidad base de cada alojamiento, las tarifas por noche y, lo más importante, el arraigo cultural del Rancho mediante la integración de hitos históricos y leyendas de la zona de Pullally, Papudo. Adicionalmente, cuenta con el módulo interactivo de Housekeeping para coordinar al personal de limpieza.

---

## 2. Mapa de Elementos de la Interfaz

La pantalla cuenta con un cargador circular de archivos y campos de texto avanzados:

### Panel Superior: Monitor de Housekeeping (Aseo)
Módulo dinámico Stitch UI que muestra advertencias en rojo de las cabañas que terminaron estadía física (check-out).
| Elemento UI | Tipo | Comportamiento / Acción | Reglas de Validación / Backend |
| :--- | :--- | :--- | :--- |
| **Botón "🧼 Registrar Aseo Terminado"** | Botón de Acción | Restablece el estado de la cabaña a `'Disponible'`. | Al presionarse, cambia la columna `housekeeping_status` de la tabla `cabins` a `'clean'`. |

### Modal "Nueva Cabaña" o "Editar Cabaña"
| Elemento UI | Tipo | Comportamiento / Acción | Reglas de Validación / Backend |
| :--- | :--- | :--- | :--- |
| **Foto de Portada Principal** | Cargador de Archivo | Permite subir la foto de portada. | Recomendado aspect ratio 3:2, tamaño 1200x800 px. Se sube al Storage de Supabase. |
| **Galería de Fotos Momentos** | Grilla de Carga | Permite subir múltiples imágenes para el carrusel de la cabaña. | Clasifica de forma interactiva la 1ª foto cargada como `🌌 BANNER HERO` (16:9) y las siguientes como `🖼️ CARRUSEL` (3:2). |
| **Selector de Historia de Pullally** | Menú Desplegable | Vincula una leyenda o hito histórico local a la cabaña. | Lee los relatos pre-cargados (ej: "¿Por qué Carmelitas?", "El lema del Rancho", "Datos curiosos de la fauna"). |

---

## 🧼 3. Flujo Operativo de Housekeeping (Limpieza)

El ciclo de limpieza de las cabañas opera de forma desatendida y reactiva:

```
[Check-out Registrado en Reservas]
               │
               ▼ (La cabaña se marca como "Necesita Aseo" en rojo)
[El personal limpia físicamente la cabaña]
               │
               ▼ (El personal de limpieza ingresa al panel de Cabañas)
[Presiona 🧼 Registrar Aseo Terminado]
               │
               ▼
[La cabaña vuelve al estado "Disponible" en verde y permite nuevas reservas]
```

---

## 📜 4. Integración de la Narrativa Local de Pullally

Para potenciar la experiencia y conexión emocional de los huéspedes, el administrador puede vincular relatos locales a cabañas específicas:
1. Vaya a **Cabañas** y presione **"Editar Ajustes"** en la cabaña deseada.
2. Desplácese hasta la sección **"Historias y Leyendas de Pullally"**.
3. Seleccione uno de los relatos disponibles (como la historia del tren de Pullally, la vegetación nativa o leyendas de piratas en Papudo).
4. Guarde los cambios. De forma inmediata y reactiva, la landing page pública y el cotizador del cliente mostrarán una elegante pestaña con micro-animaciones Stitch UI llamada **"🔍 Conoce la historia de esta cabaña"**, detallando el relato completo.
