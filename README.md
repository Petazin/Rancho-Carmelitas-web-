# Rancho Carmelitas Web (Client & PMS)

Bienvenido al repositorio principal de la página web interactiva y el Sistema de Gestión de Propiedades (PMS) del Rancho Carmelitas.

## Descripción del Proyecto

Este proyecto es una plataforma integral desarrollada con las últimas tecnologías web para permitir que los usuarios exploren y reserven cabañas en Rancho Carmelitas con un diseño premium y responsive, y que al mismo tiempo, los administradores cuenten con un "Panel Mágico" (PMS) seguro para gestionar el check-in rápido, validación de reservas y reagendamientos.

El diseño se basa en un concepto _Premium_, con uso intensivo de modulares CSS (Vanilla) y animaciones fluidas (Tipografía: Inter, Acentos: #11d442).

## Características Principales

*   **Página de Inicio y Reservas (Cliente):** Experiencia de usuario inmersiva con vista detallada de cabañas y un formulario de reserva rápido.
*   **PMS / Panel de Administración:**
    *   Gestión centralizada de múltiples reservas en calendario.
    *   Módulo de Check-in Rápido y Prevención de conflictos.
    *   **Gestión Multi-Media (Supabase Storage):** Subida de galerías por bloque y amenidades interactivas.
    *   **Galería de Imágenes Premium:** Integración de recursos visuales personalizados basados en la identidad real del Rancho.
    *   Control de roles (Admin/Guest) y control de accesos RBAC para Staff.
    *   **Sistema de Comisiones Dinámicas:** Gestión y cálculo automático de comisiones de plataformas (externas) sobre el Precio Bruto e IVA de la reserva.
    *   **Ficha de Liquidación Interna Privada:** Desglose interactivo en tiempo real del pago neto estimado al dueño, excluido de los correos transaccionales por privacidad.
    *   **Creación Manual de Reservas:** Formulario premium de registro con previsualización financiera reactiva en tiempo real.

*   **Correos de Confirmación (Resend):** Envíos automatizados al huésped con el desglose del cobro de plataforma y el comprobante oficial de pago, protegiendo los datos confidenciales de administración.

## Stack Tecnológico

Este repositorio está construido sobre estas bases:

*   **Frontend:** [Next.js](https://nextjs.org/) (App Router), React, TypeScript.
*   **Estilos:** Tailwind CSS y CSS Nativo (Vanilla CSS) arquitecturado para micro-interacciones.
*   **Base de Datos / Backend / Auth:** [Supabase](https://supabase.com/).
*   **Emails:** [Resend](https://resend.com/) con @react-email.
*   **Despliegue:** [Vercel](https://vercel.com).

## Instrucciones para el Desarrollo Local

Sigue estos pasos para arrancar el entorno en tu computadora:

1.  Asegúrate de tener instalado [Node.js](https://nodejs.org/) (versión 18+).
2.  Instala las dependencias del proyecto:
    ```bash
    npm install
    ```
3.  Crea un archivo `.env.local` en la raíz del proyecto (Aquí irán tus claves de Supabase).
4.  Inicia el servidor local de desarrollo:
    ```bash
    npm run dev
    ```
5.  Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la página de inicio. El código maestro de la landing page se encuentra en `src/app/page.tsx`.

## Repositorio

- **GitHub:** [https://github.com/Petazin/Rancho-Carmelitas-Web](https://github.com/Petazin/Rancho-Carmelitas-Web)
