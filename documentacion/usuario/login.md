# 🔑 Manual Funcional — Acceso y Recuperación de Contraseña

Esta sección detalla el funcionamiento de la pantalla de **Acceso (Login)** del PMS de Rancho Carmelitas y el flujo de auto-servicio para colaboradores y administradores que necesiten restablecer sus claves.

---

## 1. Introducción y Propósito
La pantalla de Acceso (`/login`) es el único punto de entrada autorizado al sistema PMS. Resguarda los datos de reservas, finanzas y clientes de Rancho Carmelitas contra manipulaciones maliciosas a través de un muro de autenticación basado en Supabase Auth y políticas RLS activas en las tablas del servidor.

---

## 2. Mapa de Elementos de la Interfaz

La pantalla de acceso cuenta con 3 interfaces dinámicas que mutan en caliente en el navegador:

### Vista A: Inicio de Sesión
| Elemento UI | Tipo | Comportamiento / Acción | Reglas de Validación / Backend |
| :--- | :--- | :--- | :--- |
| **Campo "Correo electrónico"** | Entrada de Texto | Captura el correo del colaborador. | Debe tener formato de email válido. |
| **Campo "Contraseña"** | Entrada Oculta | Captura la clave secreta del usuario. | Sensible a mayúsculas y minúsculas. |
| **Botón "Iniciar Sesión"** | Botón de Acción | Ejecuta el inicio de sesión. | Invoca a `signInWithPassword`. Redirige a `/admin` si es exitoso. |
| **Enlace "¿Olvidaste tu contraseña?"** | Enlace Interactivo | Cambia la pantalla a la Vista B. | Modifica el estado reactivo local `view` a `'forgot'`. |

### Vista B: Solicitar Restablecimiento
| Elemento UI | Tipo | Comportamiento / Acción | Reglas de Validación / Backend |
| :--- | :--- | :--- | :--- |
| **Campo "Correo electrónico"** | Entrada de Texto | Captura el correo para restaurar la clave. | Debe estar previamente registrado como usuario del Rancho. |
| **Botón "Enviar Enlace de Restauración"** | Botón de Acción | Despacha el correo de restablecimiento. | Invoca a `resetPasswordForEmail` apuntando a `https://ranchocarmelitas.com/login`. |
| **Enlace "Volver a Iniciar Sesión"** | Enlace Interactivo | Regresa a la Vista A. | Cambia el estado reactivo local `view` a `'login'`. |

### Vista C: Nueva Contraseña (Recuperación Activa)
*Esta vista se gatilla automáticamente cuando el usuario hace clic en el enlace del correo de recuperación que le envía Supabase Auth.*
| Elemento UI | Tipo | Comportamiento / Acción | Reglas de Validación / Backend |
| :--- | :--- | :--- | :--- |
| **Campo "Nueva Contraseña"** | Entrada Oculta | Captura la nueva clave que desea usar. | Mínimo 6 caracteres de longitud obligatorios. |
| **Botón "Actualizar Contraseña"** | Botón de Acción | Guarda la nueva contraseña. | Invoca a `updateUser` en Supabase Auth. Redirige a `/admin` con sesión activa. |

---

## 🔄 3. Flujo de Acciones de Usuario

### 3.1 Cómo Restablecer la Contraseña de Forma Autónoma (Auto-Servicio)
1. Ingrese a `https://ranchocarmelitas.com/login`.
2. Haga clic en el enlace **"¿Olvidaste tu contraseña?"**.
3. Digite su correo electrónico de trabajo y presione **"Enviar Enlace de Restauración"**.
4. Revise su bandeja de entrada de correo electrónico. Recibirá un mensaje oficial del Rancho.
5. Haga clic en el botón de confirmación en el correo. Esto lo redirigirá a la pantalla de login del Rancho, visualizando automáticamente el formulario de **Nueva Contraseña**.
6. Ingrese su nueva clave y confirme. El sistema actualizará sus datos e iniciará sesión de inmediato en el Dashboard.

### 3.2 Soporte Administrativo para Colaboradores
Si un colaborador de limpieza o recepción no recibe el correo, un usuario con rol de **Administrador** puede ir a la pestaña **Usuarios**, identificar al colaborador y presionar el botón **📩 Reenviar**.
- Si la cuenta del colaborador ya estaba confirmada, el sistema identificará esto de forma automática y le enviará un correo de restablecimiento de contraseña en caliente a nombre del Rancho.
- La bitácora registrará esta acción en lenguaje natural (`🔑 Claudio Milanolo solicitó el restablecimiento de contraseña para...`).
