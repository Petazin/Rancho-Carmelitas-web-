# 🛡️ Runbook de Infraestructura — Arquitectura y Seguridad Zero-Trust

Esta sección detalla la arquitectura técnica de la aplicación de **Rancho Carmelitas** y el flujo de seguridad Zero-Trust aplicado para salvaguardar las credenciales e infraestructura contra accesos no autorizados.

---

## 🏗️ 1. Arquitectura de Ecosistema Técnico

La aplicación y su Landing Page operan bajo un esquema moderno desacoplado y serverless estructurado de la siguiente forma:

```
                  ┌──────────────────────────────┐
                  │   Cliente / Landing Pública   │
                  └──────────────┬───────────────┘
                                 │ (HTTP / React Query)
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              Apliación Web Next.js (Alojada en Vercel)          │
│                                                                 │
│  • Frontend: React 19 / TailwindCSS v4                          │
│  • Backend: Route Handlers / Server Actions (Next.js API)       │
└───────┬────────────────────────┬────────────────────────┬───────┘
        │                        │                        │
        │ (Supabase SDK Client)  │ (Resend SDK API)       │ (Deep Links)
        ▼                        ▼                        ▼
┌──────────────────────┐ ┌──────────────────────┐ ┌───────────────┐
│     Supabase BBDD    │ │     Resend Mail      │ │ DominiosChile │
│                      │ │                      │ │               │
│ • PostgreSQL con RLS │ │ • Mailing Saliente   │ │ • Dominio     │
│ • Storage de Recibos │ │   Unidireccional     │ │   y DNS       │
│ • Supabase Auth      │ │ • Firmas DKIM/SPF    │ │ • SSL Gratis  │
└──────────────────────┘ └──────────────────────┘ └───────────────┘
```

---

## 🔒 2. Modelo de Seguridad Zero-Trust Aplicado

Para evitar depender del desarrollador original y mitigar vulnerabilidades críticas por filtraciones de claves, el sistema implementa la filosofía **Zero-Trust (Confianza Cero)**:

### 2.1 Enmascaramiento y Cifrado Simétrico (AES-GCM-256)
- Las contraseñas del Llavero Seguro (Vault) y las API keys que actualices desde la interfaz web no se guardan en texto plano en la base de datos PostgreSQL de Supabase.
- Se encriptan utilizando el estándar militar de cifrado simétrico AES-GCM-256 utilizando una clave maestra de encriptación (`ENCRYPTION_SECRET`) inyectada en caliente del lado del servidor de Next.js en Vercel. De este modo, si alguien logra acceso de lectura no autorizado a la base de datos, solo verá strings ilegibles de caracteres encriptados.

### 2.2 Re-autenticación Obligatoria en Caliente
- El Panel de Gobernanza (`/admin/infraestructura`) implementa un muro de validación bancaria: el sistema enmascara por defecto todos los secretos mediante círculos de seguridad (`••••••`).
- Si un administrador presiona el botón **"👁️ Mostrar"** o **"📋 Copiar"**, se despliega de inmediato un modal de seguridad que exige ingresar la contraseña de su sesión actual de Supabase Auth.
- El sistema realiza un intento de re-autenticación en caliente contra los servidores de Supabase Auth. Solo si la clave es 100% correcta se concede el acceso al texto plano en el navegador de forma temporal, registrando la auditoría del operador que visualizó el secreto.
