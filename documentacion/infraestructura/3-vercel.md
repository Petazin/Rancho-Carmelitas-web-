# 🚀 Runbook de Vercel — Hosting de Next.js y Despliegues

Este runbook detalla los procedimientos técnicos para transferir, operar y actualizar las variables de entorno de la aplicación y la landing page de **Rancho Carmelitas** en la plataforma de hosting en la nube de **Vercel**.

---

## 1. Ficha Técnica del Proveedor

- **Proveedor:** Vercel Inc. (Plataforma oficial optimizada para desplegar aplicaciones Next.js y React).
- **Plan Sugerido:** Plan Gratuito (Hobby Tier) es suficiente para la escala actual (permite SSL de renovación automática gratuita, despliegues automáticos conectados a GitHub y analíticas básicas).
- **Consola de Control:** [https://vercel.com](https://vercel.com)
- **Credenciales Maestras:** Registrado bajo la cuenta unificada `rancho.carmelitas.6@gmail.com`.

---

## 🔄 2. Procedimiento de Transferencia de Propiedad Paso a Paso

Para realizar el traspaso definitivo del proyecto de la cuenta personal del desarrollador original a la cuenta del Rancho, siga estas instrucciones:

```
[Vercel Desarrollador] ──► Invitar Correo rancho.carmelitas.6@gmail.com como Admin
                                                                │
                                                                ▼
[Vercel Corporativo] ◄──────── Transferir Proyecto (Settings -> Advanced)
                               (Handover Completado de forma limpia)
```

### Paso A: Invitación al Equipo
1. El desarrollador ingresará a su consola personal de Vercel, irá al proyecto de la aplicación web de Rancho Carmelitas y en la barra lateral ingresará a la pestaña **Settings -> Members**.
2. Presionará **"Invite Member"** e ingresará el correo unificado del Rancho: **`rancho.carmelitas.6@gmail.com`**, asignándole el rol de **Owner** (Propietario / Administrador).
3. Acepte la invitación haciendo clic en el enlace enviado al correo del Rancho.

### Paso B: Transferencia de Propiedad del Proyecto
1. Una vez aceptada la invitación, el desarrollador ingresará a la pestaña **Settings -> Advanced** del proyecto.
2. Desplácese hasta la sección **Transfer Project** y presione el botón **"Transfer"**.
3. Seleccione el nuevo equipo/cuenta asociada a `rancho.carmelitas.6@gmail.com` como el nuevo propietario del proyecto.
4. Una vez culminado el proceso, ingrese a los miembros del proyecto y remueva el acceso de la cuenta personal del programador original para consolidar la independencia total de la infraestructura.

### Paso C: Actualización e Inyección de Variables en Producción
1. Ingrese a la consola de Vercel con la cuenta del Rancho.
2. Seleccione el proyecto de Rancho Carmelitas y vaya a **Settings -> Environment Variables**.
3. Edite o agregue las siguientes 4 variables de entorno críticas con los valores corporativos generados en la Fase 1:
   - `NEXT_PUBLIC_SUPABASE_URL` -> URL de la nueva base de datos Supabase corporativa.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` -> Anon Key del nuevo Supabase.
   - `SUPABASE_SERVICE_ROLE_KEY` -> Service Role Key del nuevo Supabase (restringida a servidor).
   - `RESEND_API_KEY` -> API Key corporativa generada en Resend.
   - `ENCRYPTION_SECRET` -> Clave de encriptación simétrica maestra generada para el llavero seguro.
4. Para aplicar los cambios en caliente en producción, vaya a la pestaña **Deployments**, seleccione el último despliegue, presione el botón de los 3 puntos (`...`) y elija **"Redeploy"** presionando la casilla de limpiar caché. Vercel compilará y levantará la aplicación usando las nuevas credenciales de infraestructura corporativas de inmediato.

---

## 📈 3. Monitorización de Despliegues y Errores

### Cómo Revisar los Logs del Servidor
Si la aplicación presenta algún comportamiento anómalo o problemas con las conexiones del backend:
1. Ingrese a la consola de Vercel con la cuenta del Rancho.
2. Vaya al proyecto y presione la pestaña **Logs**.
3. El sistema le desplegará una consola interactiva en tiempo real con todas las peticiones HTTP y errores de consola (`console.error`) emitidos por los Server Actions y API Routes de Next.js, acelerando la auditoría de fallas técnicas.
