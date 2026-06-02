# 🏡 Manual Funcional del PMS — Índice y Flujos Operativos

Bienvenido al manual del usuario del PMS de **Rancho Carmelitas**. Este documento detalla la estructura lógica del sistema y el flujo de vida operativo de una reserva dentro del Rancho.

---

## 🗺️ Mapa del Sitio del Panel de Administración

El menú de navegación lateral del panel de administración está estructurado jerárquicamente de la siguiente forma:

1. **📊 Dashboard (`/admin`):** Resumen visual rápido, métricas de ocupación del día, próximas llegadas inminentes y banners parpadeantes de overbookings o conflictos.
2. **📅 Reservas (`/admin/reservas`):** Tabla centralizada de estancias, cotizador de reservas manuales, registro de abonos múltiples y Reporte Financiero & SII.
3. **🏡 Cabañas (`/admin/cabanas`):** Catálogo de alojamientos, precios por noche, carga de fotos de portada principal e integración de la Galería Narrativa de Pullally.
4. **👥 Usuarios (`/admin/usuarios`):** Registro del staff de colaboradores, invitaciones de acceso por correo y matriz interactiva de Roles & Permisos.
5. **📜 Bitácora de Auditoría (`/admin/auditoria`):** Línea de tiempo que narra en lenguaje natural los cambios realizados por cada miembro del equipo (Logs).
6. **🔌 Canales de Venta (`/admin/configuracion`):** Administrador de comisiones de plataformas de venta externas (Airbnb, Booking.com).
7. **🌌 Gestión de Landing (`/admin/landing`):** Panel para editar los textos y fotos del Hero de la página pública, carrusel de momentos y Logotipo Oficial del Rancho.
8. **⚙️ Configuraciones (`/admin/configuraciones`):** Contacto de WhatsApp, Dirección, RUT, Correo público y Comisión Administrativa por defecto.
9. **🛡️ Gobernanza y Servidores (`/admin/infraestructura`):** Llavero seguro de contraseñas (Vault) y rotación de claves del servidor.

---

## 🔄 Flujo de Vida Operativo de una Reserva

El ciclo de vida de una reserva en Rancho Carmelitas es un flujo financiero y operativo cerrado que se divide en los siguientes estados secuenciales:

```
[Cliente en Landing / Recepción]
       │
       ▼
 🟡 1. PENDIENTE (Espera de Abono 50%)
       │
       ├─► 🔴 Expirada y Cancelada (Si no abona en 24 horas - Se libera cabaña)
       │
       ▼ (Se registra Abono >= 50% de la tarifa cobrada)
 🟠 2. CONFIRMADA (Gatilla correo de confirmación de pago al cliente)
       │
       ▼ (Check-in: Huésped llega y salda deuda total + Ficha completa)
 🟢 3. EN CABAÑA (Registrado en el Rancho con Check-in)
       │
       ▼ (Check-out: Auditoría de llaves y cabaña + Registro de daños)
 🔵 4. COMPLETADA (Check-out registrado exitosamente)
       │
       └─► 🧼 Cabaña cambia a "Necesita Aseo" ──► Restablecida a "Disponible"
```

### 1. Estado Pendiente (`🟡`)
- Se genera automáticamente cuando un cliente cotiza y pre-reserva desde la Landing Page pública, o cuando el Administrador crea un registro manual.
- **Expiración de 24 Horas:** Las reservas pendientes que no ingresan el abono mínimo (50%) en 24 horas entran en estado crítico. El sistema despliega una alerta visual interactiva de reloj de arena `⏳ Expirar y Liberar` en la tabla para facilitar la cancelación masiva de reservas morosas y desocupar la cabaña.

### 2. Estado Confirmada (`🟠`)
- Ocurre automáticamente cuando los abonos registrados (individuales o acumulados) en el modal de la reserva igualan o superan el **50% del total**.
- Al confirmarse, el servidor despacha de forma desatendida y automática el correo definitivo de confirmación con el desglose del abono al huésped.

### 3. Estado En Cabaña (`🟢`)
- Ocurre cuando el huésped ingresa físicamente a las dependencias del Rancho.
- **Check-in Defensivo:** El sistema bloquea el registro de Check-in a menos que:
  1. Se completen los 5 campos obligatorios de la Ficha de Huésped (RUT, Patente, Nacionalidad, Cumpleaños, Preferencias).
  2. El saldo pendiente por pagar sea **cero**. El modal permite ingresar pagos de saldo en caliente para saldar de inmediato e iniciar la estadía.

### 4. Estado Completada (`🔵`)
- Ocurre al finalizar la estadía física del huésped.
- **Check-out Asistido:** Requiere que el staff confirme físicamente la recepción de llaves e inspección de daños en la cabaña.
- **Flujo de Limpieza (Housekeeping):** Al completarse, el sistema cambia dinámicamente el estado de la cabaña afectada a "Necesita Aseo", desplegando un aviso rojo en el panel de Cabañas para que el personal de aseo lo limpie y lo restablezca a "Disponible".
