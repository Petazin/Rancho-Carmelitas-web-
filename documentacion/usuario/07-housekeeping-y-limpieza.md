# 🧼 Manual de Usuario: 07. Housekeeping y Control de Limpieza

**Pantalla:** `/admin/cabanas` (Badge y filtro de Housekeeping en tarjetas)  
**Roles involucrados:** Personal de Limpieza (Housekeeping), Recepcionistas y Administradores  

---

## 1. El Ciclo Operativo de Limpieza

Para garantizar los más altos estándares de higiene y confort para cada nueva familia que llega al Rancho, el sistema gestiona un ciclo cerrado de estados:

```
[ Cabaña Ocupada (Huésped en Estancia) ]
       │
       ▼ Al presionar "Registrar Check-Out" en Recepción
[ Cabaña en Estado: "Necesita Aseo" 🔴 ]
       │
       ▼ El personal de limpieza realiza aseo, sanitización y recambio de sábanas
       ▼ Presiona el botón "🧼 Registrar Aseo Terminado"
[ Cabaña en Estado: "Disponible" 🟢 ]
```

---

## 2. Cómo Detectar Cabañas Pendientes de Aseo

1. En el menú lateral, dirígete a **"Cabañas"** (`/admin/cabanas`).
2. En la parte superior de cada tarjeta de cabaña observarás un badge distintivo:
   - 🔴 **"Necesita Aseo":** La cabaña acaba de ser desocupada o se encuentra en proceso de sanitización. **No debe entregarse a nuevos pasajeros aún.**
   - 🟢 **"Disponible":** La cabaña se encuentra 100% limpia, equipada y lista para recibir a los nuevos huéspedes del día.

---

## 3. Cómo Liberar una Cabaña tras Finalizar la Limpieza

Cuando el equipo de mantenimiento o limpieza concluye los trabajos en una cabaña:

1. Ubica la cabaña en la pantalla de Cabañas.
2. Haz clic en el botón con ícono de jabón: **`"🧼 Registrar Aseo Terminado"`**.
3. El sistema cambiará el estado de forma asíncrona a **`'Disponible'`** en tiempo real.
4. En la recepción, los recepcionistas verán de inmediato que la cabaña está lista para proceder con el Check-in y entrega de llaves.

> [!TIP]
> **Coordinación Eficiente en Días de Alta Rotación:** En fines de semana largos donde una cabaña tiene salida a las 12:00 hrs y un nuevo ingreso a las 15:00 hrs, el módulo de Housekeeping permite priorizar el orden de aseo de las cabañas según las llegadas inminentes del Dashboard.
