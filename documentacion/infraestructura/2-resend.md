# 🔌 Runbook de Resend — Configuración de Mailing y Validación DNS

Este runbook detalla los procedimientos técnicos para registrar, autenticar y operar el servicio de **Resend** utilizando tu dominio oficial `ranchocarmelitas.com` para despachar correos corporativos 100% legítimos y seguros.

---

## 1. Ficha Técnica del Proveedor

- **Proveedor:** Resend Inc. (Servicio de API de correo transaccional de alta entregabilidad).
- **Plan Sugerido:** Plan Gratuito (Free Tier) es suficiente para la escala actual (permite enviar hasta 3,000 correos mensuales de forma gratuita, equivalente a más de 1,000 confirmaciones de reserva completas al mes).
- **Consola de Control:** [https://resend.com](https://resend.com)
- **Credenciales Maestras:** Registrado bajo la cuenta unificada `rancho.carmelitas.6@gmail.com`.

---

## 🔄 2. Procedimiento de Configuración y Cambio Paso a Paso

Para configurar y activar una cuenta de Resend corporativa desvinculada de cuentas de desarrolladores, siga estas instrucciones secuenciales:

```
[Resend Corporativo] ──► Agregar Dominio ranchocarmelitas.com ──► Generar Registros DNS
                                                                          │
                                                                          ▼
[Vercel DNS Control] ◄────────────── Inyectar Registros TXT y MX ◄────────┘
                                      (DKIM y SPF Autenticados)
```

### Paso A: Creación de la Cuenta y Alta del Dominio
1. Ingrese a [https://resend.com](https://resend.com) y presione **"Sign Up"**. Regístrese utilizando la cuenta maestra del Rancho: **`rancho.carmelitas.6@gmail.com`**.
2. Una vez dentro del panel, vaya a la sección **Domains** en la barra lateral y presione el botón **"Add Domain"**.
3. Ingrese tu dominio oficial: **`ranchocarmelitas.com`** y presione **"Add"**.

### Paso B: Autenticación DNS (DKIM y SPF) en Vercel
*Para que los correos enviados por la aplicación no sean rebotados por Gmail o caigan directamente en la carpeta de Spam de los clientes, es obligatorio autenticar la propiedad de tu dominio agregando los registros DNS que te entrega Resend.*
1. Resend te desplegará una lista de 4 registros DNS:
   - 3 registros de tipo **TXT** (Utilizados para la firma de seguridad criptográfica **DKIM**).
   - 1 registro de tipo **MX** (Utilizado para verificar la consistencia del dominio remitente).
2. Deje esa ventana abierta. Ingrese a la consola de administración de **Vercel** (donde están delegados tus Name Servers).
3. Vaya a *Domains -> ranchocarmelitas.com -> DNS Records*.
4. Añada cada uno de los 4 registros entregados por Resend ingresando el tipo (`TXT` o `MX`), el nombre del host (ej: `resend._domainkey`) y el valor entregado. Guarde los cambios.
5. Regrese a la consola de Resend y presione el botón **"Verify"**. El estado del dominio cambiará de `'Pending'` a **`'Verified'`** (con un ticket verde de verificación).

### Paso C: Generación de la Clave de API e Inyección in-app
1. Vaya a la pestaña **API Keys** en la barra lateral de Resend.
2. Presione **"Create API Key"**, asígnele el nombre `Rancho PMS Producción` y restrinja sus permisos al rol de **Sending** para mayor seguridad.
3. Copie la llave secreta generada (ej: `re_6yeqwc8V...`).
4. **Inyección en el Panel de Gobernanza:** Ingrese al panel administrativo del Rancho (`https://ranchocarmelitas.com/admin/infraestructura`), digite la nueva API key en la sección de Resend, ingrese el remitente oficial en el FROM (`Rancho Carmelitas <reservas@ranchocarmelitas.com>`) y presione **Guardar**.
5. El sistema re-autenticará su sesión y aplicará los cambios de mailing en caliente de forma inmediata.

---

## 📈 3. Control de Cuotas y Entregabilidad

### Cómo Monitorear los Correos Enviados
1. Ingrese mensualmente a la consola de Resend. El panel principal (Overview) le mostrará la cantidad de correos enviados en el periodo de facturación actual.
2. **Alertas de Spam:** Si algún cliente reporta un correo como no deseado, Resend lo registrará en la pestaña **Spam**. Si la tasa de quejas supera el 0.1%, se recomienda revisar el formato de las plantillas de correo.
3. **Escalar el Plan:** Si Rancho Carmelitas crece y supera los 3,000 envíos mensuales, puede escalar de forma directa al plan **Pro** de Resend por un bajo costo mensual para continuar enviando correos sin interrupciones.
