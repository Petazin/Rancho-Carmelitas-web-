# ⚠️ Runbook de Emergencia — Planes de Contingencia e Incidentes

Este documento detalla los planes de acción rápidos y coordinados ante incidentes críticos de infraestructura, asegurando la continuidad operativa del Rancho.

---

## 🚨 Incidentes Críticos y Protocolos de Respuesta

Siga estas instrucciones paso a paso según el tipo de incidente detectado:

### 1. Claves Comprometidas o Filtración de Seguridad
*Si detecta un comportamiento anómalo o sospecha que un tercero tiene acceso no autorizado a las API Keys o base de datos:*
1. **Identificar la Clave Afectada:** Compruebe si la filtración proviene de Supabase o Resend.
2. **Generar Nuevas Llaves en el Proveedor:**
   - Ingrese a la consola corporativa correspondiente (Supabase o Resend).
   - Vaya a la sección de credenciales de API y presione **"Rotate Key"** o cree una nueva llave, deshabilitando de inmediato la clave anterior.
3. **Inyectar en el Llavero Seguro (Vault):**
   - Ingrese de inmediato al panel de gobernanza técnica de la aplicación (`/admin/infraestructura`).
   - Copie y pegue la nueva API key en la sección correspondiente.
   - Confirme el modal de seguridad con su contraseña.
4. **Sincronización:** La aplicación actualizará sus referencias y comenzará a operar con la nueva credencial de forma instantánea y en caliente, bloqueando el acceso de terceros a través de la clave antigua.

### 2. Caída del Servidor de Base de Datos (Supabase Offline)
*Si el PMS no carga datos y la consola de Supabase muestra problemas en el servidor de base de datos:*
1. **Verificar Estado del Proveedor:** Ingrese a [https://status.supabase.com/](https://status.supabase.com/) para comprobar si se trata de un incidente global del datacenter.
2. **Procedimiento de Contingencia Manual:**
   - Durante el periodo de inactividad, el staff de recepción deberá registrar las reservas entrantes en una planilla de cálculo local de contingencia (ej: Microsoft Excel) detallando los datos del huésped, cabaña y abonos.
3. **Sincronización:** Una vez que Supabase reestablezca el servicio de base de datos, el administrador ingresará manualmente las reservas recopiladas al PMS para asegurar la integridad de la bitácora y la consistencia financiera.

### 3. Falla de Mailing (Los Correos no llegan al Cliente)
*Si la aplicación funciona pero los clientes no reciben los correos de confirmación o pago:*
1. **Verificar logs en Resend:**
   - Ingrese a la consola corporativa en Resend.com.
   - Vaya a la pestaña **Errors** o **Logs** y audite si los despachos rebotan o si la API key está inactiva.
2. **Comprobar la Reputación DNS:**
   - Vaya a la pestaña **Domains** en Resend y verifique que el dominio siga figurando como `'Verified'`. 
   - Si los Name Servers de Vercel fueron alterados de forma accidental en DominiosChile, los registros DKIM y SPF perderán validez y los correos rebotarán. Restablezca los Name Servers a Vercel de inmediato en DominiosChile para solucionar la falla.
