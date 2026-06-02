# 🌐 Runbook de DominiosChile — Gestión de Dominio, DNS y SSL

Este runbook detalla los procedimientos técnicos para renovar el dominio oficial **`ranchocarmelitas.com`**, verificar el estado de los Name Servers (DNS) y comprobar la renovación automática de los certificados de seguridad SSL.

---

## 1. Ficha Técnica del Proveedor

- **Proveedor:** DominiosChile (Registrador chileno autorizado de dominios `.com`, `.net`, `.cl`, etc.).
- **Sitio Web Oficial:** [https://www.dominioschile.com/](https://www.dominioschile.com/)
- **Frecuencia de Pago:** Renovación anual (mantenimiento del dominio).
- **Propietario Legal:** Asociado y unificado bajo la cuenta de correo **`rancho.carmelitas.6@gmail.com`**.

---

## 🔄 2. Procedimiento de Renovación y Mantenimiento del Dominio

Para evitar que la landing page y el PMS de Rancho Carmelitas queden inactivos por expiración del dominio, siga este procedimiento anual:

1. **Obtener las Contraseñas del Llavero Seguro:**
   - Ingrese al panel administrativo del Rancho (`/admin/infraestructura`), vaya a la sección del **Llavero Seguro (Vault)**.
   - Presione el botón **"👁️ Mostrar"** al costado de "Acceso DominiosChile".
   - Ingrese su contraseña de sesión del PMS en el modal de verificación. Copie la clave en texto plano.
2. **Iniciar Sesión en el Registrador:**
   - Ingrese a [https://www.dominioschile.com/](https://www.dominioschile.com/) e inicie sesión utilizando el correo **`rancho.carmelitas.6@gmail.com`** y la contraseña obtenida.
3. **Facturación y Pago:**
   - Vaya a la sección **"Mis Dominios"** o **"Facturación"**.
   - Identifique el dominio `ranchocarmelitas.com`, genere el cupón de pago y efectúe la transacción a través de Webpay (Débito/Crédito).
4. **Verificación de Name Servers (DNS):**
   - Para que la web funcione, los servidores de nombres del dominio deben apuntar obligatoriamente a los DNS de Vercel.
   - En el panel de DominiosChile del dominio, verifique que los registros **NS** (Name Servers) coincidan con:
     * `ns1.vercel-dns.com`
     * `ns2.vercel-dns.com`
   - *Nota Importante:* **No modifique estos registros.** Alterar estos valores dejará inactivo de inmediato el PMS y el cotizador en la landing page del Rancho.

---

## 🔒 3. Certificados de Seguridad SSL/TLS

El PMS y la Landing Page operan bajo el protocolo de seguridad obligatorio cifrado **HTTPS** (candado verde de seguridad en el navegador).
- **Emisor:** Certificados SSL de Let's Encrypt de 2048 bits de nivel bancario.
- **Renovación:** Vercel gestiona y renueva automáticamente estos certificados cada 90 días de forma desatendida y gratuita, sin requerir intervención técnica del Rancho.
- **Auditoría:** Puede verificar el estado del certificado SSL en cualquier momento ingresando a la consola de Vercel, en la sección *Settings -> Domains* del proyecto.
