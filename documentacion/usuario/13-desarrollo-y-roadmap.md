# 💡 Manual de Usuario: 13. Módulo de Desarrollo, Mejoras y Roadmap

**Pantalla:** `/admin/desarrollo`  
**Roles involucrados:** Administradores y Equipo de Ingeniería de Software  

---

## 1. El Canal de Comunicación Directa con Ingeniería

El módulo de **Desarrollo y Mejoras** es la herramienta in-app oficial para que los administradores de Rancho Carmelitas propongan nuevas funcionalidades, soliciten ajustes comerciales o reporten fallos técnicos (bugs) sin tener que recurrir a chats dispersos de WhatsApp o correos que puedan extraviarse.

---

## 2. Cómo Reportar un Bug o Solicitar una Mejora

1. Ingresa a `/admin/desarrollo`.
2. En el formulario superior, ingresa:
   - **Título de la Propuesta / Bug:** Breve y descriptivo (ej: *Ajustar tipografía en cotizador móvil*, *Error de cálculo al aplicar descuento de cortesía*).
   - **Descripción Detallada:** Explica qué esperas que haga el sistema o los pasos exactos para reproducir el fallo.
   - **Categoría:** Selecciona si es una *Mejora Comercial*, un *Bug / Error Técnico* o una *Nueva Idea*.
3. **Subida Rápida de Evidencias (Pegado directo con `Ctrl+V`):**
   - Puedes tomar una captura de pantalla en tu computadora (usando la tecla `Impr Pant` o `Windows + Shift + S`) y simplemente presionar **`Ctrl + V`** sobre la pantalla.
   - El sistema capturará la imagen directamente desde tu portapapeles, la optimizará y la adjuntará a la tarea en el Storage de Supabase.
   - También puedes arrastrar archivos de imagen al dropzone interactivo.
4. Presiona **"+ Agregar al Roadmap"**.

---

## 3. Priorización Interactiva con Arrastrar y Soltar (Drag & Drop)

* Todas las tareas pendientes aparecen ordenadas numéricamente por prioridad (Prioridad #1, #2, #3...).
* **Reordenar con el Mouse:** Haz clic sostenido sobre cualquier tarjeta y arrástrala hacia arriba o hacia abajo para cambiar su lugar en la fila.
* El sistema guardará el nuevo orden en la base de datos en tiempo real y actualizará la bitácora de auditoría.

---

## 4. Control de Tareas Completadas

Cuando el equipo de desarrollo finaliza una mejora o resuelve un reporte:
1. Marca la casilla de verificación **"✓ Completada"** en la tarjeta correspondiente.
2. La tarjeta se atenuará visualmente, el título aparecerá tachado y el sistema estampará la fecha y hora exacta de resolución.
3. El contador de **"Completadas"** en la cabecera del panel se incrementará de forma automática.
