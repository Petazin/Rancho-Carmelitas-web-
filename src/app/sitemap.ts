import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://ranchocarmelitas.com";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/reglamento`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/reserva`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  try {
    const { data: cabins } = await supabase.from("cabins").select("id, updated_at");
    if (cabins && cabins.length > 0) {
      const cabinRoutes: MetadataRoute.Sitemap = cabins.map((cabin) => ({
        url: `${baseUrl}/cabins/${cabin.id}`,
        lastModified: cabin.updated_at ? new Date(cabin.updated_at) : now,
        changeFrequency: "weekly",
        priority: 0.9,
      }));
      return [...staticRoutes, ...cabinRoutes];
    }
  } catch (e) {
    console.warn("No se pudieron cargar cabañas dinámicas para el sitemap:", e);
  }

  return staticRoutes;
}
