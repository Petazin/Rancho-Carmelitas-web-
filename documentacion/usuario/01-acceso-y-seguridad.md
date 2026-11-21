# 🔐 Manual de Usuario: 01. Acceso y Seguridad al Sistema

**Pantalla:** `/login`  
**Roles involucrados:** Todos los colaboradores de Rancho Carmelitas  

---

## 1. Cómo Iniciar Sesión en el PMS

1. Abre tu navegador web e ingresa a [`https://ranchocarmelitas.cl/login`](https://ranchocarmelitas.cl/login) (o la dirección provista por el administrador).
2. Ingresa tu **Correo Electrónico** registrado y tu **Contraseña**.
3. Haz clic en el botón verde **"Iniciar Sesión"**.
4. Si los datos son correctos, el sistema te redirigirá automáticamente al **Dashboard** principal del Rancho.

> [!NOTE]
> Si intentas acceder directamente a cualquier pantalla administrativa (como `/admin/reservas` o `/admin/cabanas`) sin haber iniciado sesión, el sistema te redirigirá automáticamente a la pantalla de login para resguardar la seguridad de la información.

---

## 2. ¿Olvidaste tu Contraseña? (Auto-Servicio)

Si no recuerdas tu clave de acceso, puedes restablecerla de forma autónoma siguiendo estos pasos:

1. En la pantalla de login, haz clic en el enlace **"¿Olvidaste tu contraseña?"** ubicado debajo del formulario.
2. Ingresa tu correo electrónico corporativo.
3. Haz clic en **"Enviar Instrucciones de Recuperación"**.
4. Revisa tu bandeja de entrada (y la carpeta de spam si no lo ves de inmediato). Recibirás un correo oficial con un enlace seguro.
5. Al hacer clic en el enlace del correo, serás llevado de regreso a la pantalla de acceso donde se activará la vista **"Establecer Nueva Contraseña"**.
6. Escribe tu nueva contraseña, confírmala y presiona **"Guardar y Acceder"**. Tu contraseña quedará actualizada al instante.

> [!WARNING]
> Los enlaces de recuperación tienen una validez temporal y expiran tras su primer uso. Si el enlace ha vencido, el sistema te mostrará una alerta en rojo indicando que debes solicitar un nuevo enlace.

---

## 3. Asistencia del Administrador para Restablecimiento de Clave

Si un colaborador del equipo tiene problemas para recibir el correo o no puede acceder:
1. Un **Administrador** puede ingresar a la sección `/admin/usuarios`.
2. En la lista de integrantes, ubicar al colaborador y hacer clic en el botón **"Reenviar"**.
3. El sistema despachará automáticamente un correo oficial de recuperación a la casilla del colaborador, dejando registro de la acción en la **Bitácora de Auditoría** con el ícono `🔑`.

---

## 4. Cierre de Sesión Seguro

Al terminar tu turno de trabajo:
1. En la barra lateral izquierda (Sidebar), dirígete a la parte inferior.
2. Haz clic en el botón rojo con ícono de puerta **"Cerrar Sesión"**.
3. Tu sesión quedará cerrada de inmediato y las cookies de autenticación se eliminarán del navegador.
