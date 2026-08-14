"use client";

import { Analytics } from "@vercel/analytics/react";

export function VercelAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        try {
          // 1. Filtrar cualquier ruta que pertenezca al panel de administración (/admin y subrutas)
          const urlObj = new URL(event.url, typeof window !== "undefined" ? window.location.origin : "http://localhost");
          if (urlObj.pathname.startsWith("/admin")) {
            return null;
          }
        } catch {
          if (event.url.includes("/admin")) {
            return null;
          }
        }

        // 2. Filtrar visitas si el navegador tiene activada la marca de administrador
        if (typeof window !== "undefined") {
          const isAdmin = localStorage.getItem("rc_is_admin") === "true";
          if (isAdmin) {
            return null;
          }
        }

        return event;
      }}
    />
  );
}
