# 🛢️ Runbook de Supabase — Backups, RLS y Migración de Cuentas

Este runbook detalla los procedimientos técnicos para operar, respaldar y migrar de manera exitosa el backend de base de datos relacional y autenticación de **Supabase** hacia la nueva cuenta corporativa del Rancho.

---

## 1. Ficha Técnica del Proveedor

- **Proveedor:** Supabase Inc. (Backend-as-a-Service basado en PostgreSQL y Go).
- **Plan Sugerido:** Plan Gratuito (Free Tier) es suficiente para la escala actual (500 MB de base de datos relacional, 1 GB de almacenamiento Storage y hasta 50,000 usuarios activos mensuales).
- **Consola de Control:** [https://supabase.com/dashboard](https://supabase.com/dashboard)
- **Credenciales Maestras:** Operado bajo la cuenta corporativa `rancho.carmelitas.6@gmail.com`.

---

## 🔄 2. Procedimiento de Migración de Cuentas Paso a Paso

Para migrar la base de datos relacional de la cuenta del desarrollador a la cuenta corporativa de Rancho Carmelitas sin pérdida de datos, siga de forma rigurosa este paso a paso:

```
[Supabase Personal Desarrollador] ────► Exportar Esquema DDL y Datos (Backup)
                                                              │
                                                              ▼
[Nuevo Supabase Corporativo] ◄──────── Importar Esquema y Datos en Caliente
                                                              │
                                                              ▼
[Script Node.js Admin API] ──────────► Migrar Usuarios Auth (Preserva UUIDs)
```

### Paso A: Creación del Proyecto Corporativo
1. Ingrese a [https://supabase.com](https://supabase.com) y presione **"Sign In"**. Inicie sesión o regístrese utilizando el correo institucional **`rancho.carmelitas.6@gmail.com`**.
2. Presione **"New Project"**, elija la organización e ingrese los datos del proyecto:
   - **Name:** `Rancho Carmelitas PMS`
   - **Database Password:** Genere una clave robusta y **guárdela de inmediato** en el Llavero Seguro (Vault) de la aplicación.
   - **Region:** Seleccione `sa-east-1` (São Paulo, Brasil) para garantizar la menor latencia posible desde Chile.
3. Presione **"Create new project"** y espere unos minutos a que el servidor de base de datos se configure.

### Paso B: Exportación e Importación de Estructura y Datos (PostgreSQL)
1. **Respaldar el Esquema Actual:**
   - Ingrese al panel del Supabase antiguo de pruebas, vaya a la sección **SQL Editor** y presione **"New Query"**.
   - Ejecute comandos de respaldo o descargue el dump SQL desde la pestaña *Database -> Backups*.
   - Alternativamente, en la raíz de tu proyecto web se encuentran los scripts DDL ordenados (`schema_landing_completo.sql`, `schema_pms_upgrade.sql`, `schema_security_saneamiento.sql` y `src/lib/setup_audit_logs.sql`). Estos archivos contienen la arquitectura exacta del sistema.
2. **Restaurar en la Nueva Base de Datos:**
   - Ingrese a la consola del nuevo Supabase corporativo, vaya a **SQL Editor** y presione **"New Query"**.
   - Copie y pegue secuencialmente los scripts SQL de base de datos en el editor y presione **"Run"** para levantar las tablas, índices, triggers y RLS en el acto.
   - Importe los datos estáticos de la tabla `settings` y `plataformas` mediante inserciones sencillas o importando el archivo CSV desde el panel de tablas.

### Paso C: Migración Delicada de Usuarios de Autenticación (Auth)
*Supabase Auth cifra las contraseñas y no permite exportarlas mediante la interfaz del navegador. Para no obligar a los colaboradores a registrarse nuevamente y conservar sus identificadores relacionales (`id`) en PostgreSQL, siga este método:*
1. Utilizaremos el script de migración en Node.js que aprovecha el **Admin Auth API** con la clave maestra de base de datos.
2. El script consultará todos los usuarios en caliente del Supabase anterior usando su `SERVICE_ROLE_KEY` e inyectará los registros cifrados en la nueva base de datos del Rancho utilizando su nueva `SERVICE_ROLE_KEY` mediante el método `createUser` con el parámetro de contraseña cifrada preexistente.
3. Esto garantiza que cuando el staff intente loguearse en el nuevo servidor, su contraseña anterior siga siendo 100% válida y mantenga su misma identidad histórica.

---

## 💾 3. Procedimientos de Respaldo Manual y Mantenimiento

### Respaldos de Base de Datos PostgreSQL
Aunque Supabase realiza backups diarios automáticos en caliente, se recomienda generar respaldos manuales antes de cambios mayores:
1. Ingrese a la consola de Supabase Corporativo, vaya a **Database -> Backups**.
2. Presione **"Create backup"** para forzar un respaldo instantáneo del sistema.
3. Si requiere exportar los datos físicos de reservas para auditoría legal, vaya a **Table Editor**, seleccione la tabla `bookings`, presione **"Export to CSV"** y descargue el archivo comprimido.
