# 👥 Manual de Usuario: 10. Gestión de Equipo, Roles y Permisos

**Pantalla:** `/admin/usuarios`  
**Roles involucrados:** Administradores con control total  

---

## 1. Estructura del Equipo de Trabajo

En esta sección se administran las cuentas de usuario de todas las personas que trabajan en Rancho Carmelitas. Permite dar de alta a nuevos recepcionistas, supervisar al personal de mantenimiento y gestionar los privilegios de acceso.

---

## 2. Los Cuatro Roles Operativos del Rancho

El sistema cuenta con cuatro perfiles preestablecidos:

| Rol | Etiqueta Visual | Nivel de Acceso | Descripción Operativa |
| :--- | :--- | :--- | :--- |
| **Administrador** | 🟣 Púrpura (`admin`) | **Control Total** | Acceso irrestricto a todas las pantallas, finanzas, bitácoras, edición de usuarios y configuración de servidores. |
| **Personal (Staff)** | 🔵 Azul (`staff`) | **Operativo General** | Gestión diaria de reservas, cobro de abonos, check-in, check-out y visualización de cabañas. Sin acceso a finanzas críticas ni bitácora de auditoría. |
| **Recepcionista** | 🟢 Esmeralda (`recepcion`) | **Recepción** | Limitado al registro de entradas, salidas, fichas de huéspedes y consulta de disponibilidad en el calendario. |
| **Mantenimiento** | 🟡 Ámbar (`mantenimiento`) | **Housekeeping** | Acceso exclusivo al panel de cabañas para revisar estados de aseo y liberar unidades limpias. Sin acceso a datos de huéspedes ni precios. |

---

## 3. Cómo Invitar a un Nuevo Colaborador

1. En `/admin/usuarios`, haz clic en el botón verde **"+ Invitar Nuevo Colaborador"**.
2. Completa los datos:
   - **Nombre Completo:** Ej: *Carla Valenzuela*.
   - **Correo Electrónico:** Casilla personal o corporativa del trabajador.
   - **Teléfono de Contacto:** Celular para coordinaciones operativas.
   - **Rol Asignado:** Selecciona uno de los 4 roles descritos arriba.
3. Presiona **"Enviar Invitación"**.
4. El sistema creará la cuenta en la base de datos y despachará automáticamente un correo electrónico oficial de invitación para que el nuevo integrante defina su contraseña de acceso.

---

## 4. Edición de Datos y Cambio de Rol

Para modificar la información de un integrante:
1. En la tabla de usuarios, ubica al colaborador y haz clic en el botón con ícono de lápiz **"Editar"**.
2. Puedes actualizar su nombre, número de celular o promover/degradar su rol operativo.
3. Presiona **"Guardar Cambios"**. La actualización surte efecto de inmediato.

---

## 5. Suspensión Temporal y Bloqueo de Acceso (Baneo con Motivo)

Si un colaborador deja de pertenecer al equipo o requiere ser suspendido por seguridad:
1. En la fila del usuario, haz clic en el botón **"Bloquear Acceso"** (ícono de candado `🔒`).
2. **Ingreso Obligatorio del Motivo:** Escribe una justificación clara (ej: *Término de contrato de temporada*, *Investigación interna*).
3. Confirma la suspensión.
4. **Efecto Inmediato:** El sistema bloqueará de forma nativa la sesión en Supabase Auth (bloqueo por 10 años). El usuario no podrá volver a iniciar sesión y aparecerá destacado en la tabla con un badge rojo pulsante: **`BANEADO`**.
5. **Reactivación:** Si la suspensión concluye, el administrador puede presionar **"Desbloquear"** (ícono `🔓`) para restablecer el acceso en cualquier momento.

---

## 6. Eliminación Definitiva de un Colaborador

Para dar de baja una cuenta de forma permanente:
1. Haz clic en el botón rojo **"Eliminar"** de la fila del colaborador.
2. Confirma la advertencia de seguridad.
3. La cuenta será removida tanto de la autenticación de Supabase como de la tabla pública de perfiles, registrando la acción en la bitácora de auditoría.
