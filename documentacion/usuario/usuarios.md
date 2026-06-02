# 👥 Manual Funcional — Gestión de Usuarios y Matriz de Roles

Esta sección detalla el funcionamiento del panel de **Usuarios (`/admin/usuarios`)**, el ciclo de vida de las invitaciones de acceso y la matriz de permisos basados en roles operativos.

---

## 1. Introducción y Propósito
El panel de Usuarios permite administrar los colaboradores del Rancho (limpieza, recepción, finanzas y administradores). Resguarda el control del sistema limitando qué acciones puede realizar cada colaborador en base a su nivel de confianza y responsabilidades de negocio.

---

## 2. Mapa de Elementos de la Interfaz

La pantalla cuenta con un diseño de pestañas interactivas de marca:

1. **👥 Lista de Miembros:** Tabla que detalla el nombre del colaborador, su rol, el correo de contacto, teléfono y badges interactivos de estado (`🔒 BANEADO` para accesos revocados).
2. **🛡️ Matriz de Permisos:** Cuadrícula informativa interactiva que detalla qué pestañas del PMS puede ver y qué acciones puede ejecutar cada rol.

---

## ⚙️ 3. Matriz de Roles y Niveles de Permiso

El sistema cuenta con 3 roles jerárquicos de seguridad:

| Módulo / Acción en el PMS | Recepcionista (`staff`) | Administrador (`admin`) |
| :--- | :---: | :---: |
| **Dashboard y Calendario** | ✓ Lectura | ✓ Lectura y Edición |
| **Crear y Modificar Reservas** | ✓ Sí (Manuales) | ✓ Control Total |
| **Check-in y Check-out** | ✓ Sí | ✓ Sí |
| **Configurar Cabañas y Tarifas** | ✗ No | ✓ Sí |
| **Añadir/Eliminar Canales de Venta** | ✗ No | ✓ Sí |
| **Administrar Miembros de Equipo** | ✗ No | ✓ Sí |
| **Ver Bitácora de Auditoría** | ✗ No | ✓ Sí |
| **Acceso a Llavero Seguro (Vault)** | ✗ No | ✓ Sí |

---

## 🔄 4. Manual de Procedimientos Paso a Paso

### 4.1 Invitar a un Nuevo Colaborador al PMS
1. Ingrese a **Usuarios** y presione el botón **"+ Invitar Miembro"**.
2. Rellene los campos obligatorios:
   - **Nombre Completo:** Identificador del colaborador.
   - **Correo Electrónico:** Dirección donde recibirá la invitación oficial (debe ser único).
   - **Teléfono de Contacto:** Celular con formato chileno (ej: `+56912345678`).
   - **Rol Asignado:** Seleccione entre `staff` (Recepcionista/Aseo) o `admin` (Administrador).
3. Presione **"Enviar Invitación"**.
4. **Sincronización Automática:** El backend de Next.js creará en caliente el perfil en la base de datos `public.profiles` y enviará un correo de invitación a través de Supabase Auth.
5. **Reenvío en Caliente:** Si el colaborador no recibe el correo, el administrador puede presionar el botón **"Reenviar"** (sobre de correo `📩`) en la fila de la tabla para despachar un reenvío instantáneo.

### 4.2 Suspender o Bloquear Accesos de Forma Novedosa (Baneo)
Si un colaborador es desvinculado o se detecta un comportamiento anómalo:
1. Identifique al colaborador en la tabla de miembros y presione **"Bloquear Acceso"**.
2. Ingrese obligatoriamente el **Motivo del Bloqueo** en la ventana emergente.
3. Presione **"Confirmar Bloqueo"**.
4. **Nativo en Auth:** El sistema invocará las herramientas administrativas de Supabase Auth para suspender la cuenta del colaborador en caliente e inyectar el motivo en sus metadatos de sesión, impidiéndole el acceso inmediato de forma desatendida.
5. **Badge de Estado:** El colaborador pasará a mostrar el badge interactivo `🔒 BANEADO` en rojo, mostrando el motivo de la suspensión al pasar el cursor (tooltip).
