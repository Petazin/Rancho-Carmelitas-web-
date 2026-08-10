-- ====================================================================
-- Script SQL: Actualización de Landing Page - Datos de Contacto y Ubicación
-- Proyecto: Rancho Carmelitas
-- Objetivo: Agregar columnas de contacto y ubicación a la tabla landing_settings
-- ====================================================================

-- 1. Agregar columnas de contacto y ubicación a la tabla landing_settings
ALTER TABLE landing_settings ADD COLUMN IF NOT EXISTS contact_address VARCHAR(255) DEFAULT 'Avenida Las Salinas № 104 D-4, Pullally, Papudo, Región de Valparaíso, Chile';
ALTER TABLE landing_settings ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50) DEFAULT '+56 9 8401 2748';
ALTER TABLE landing_settings ADD COLUMN IF NOT EXISTS contact_email VARCHAR(150) DEFAULT 'contacto@ranchocarmelitas.cl';
ALTER TABLE landing_settings ADD COLUMN IF NOT EXISTS contact_maps_url TEXT DEFAULT 'https://maps.app.goo.gl/6W1fhgChaMWaQzbK8';
ALTER TABLE landing_settings ADD COLUMN IF NOT EXISTS contact_location_legend VARCHAR(255) DEFAULT '* Pullally está ubicado en la Región de Valparaíso, a sólo 2 horas de Santiago.';

-- 2. Actualizar la fila única existente (id = 1) con los valores por defecto si no existen
UPDATE landing_settings 
SET 
  contact_address = COALESCE(contact_address, 'Avenida Las Salinas № 104 D-4, Pullally, Papudo, Región de Valparaíso, Chile'),
  contact_phone = COALESCE(contact_phone, '+56 9 8401 2748'),
  contact_email = COALESCE(contact_email, 'contacto@ranchocarmelitas.cl'),
  contact_maps_url = COALESCE(contact_maps_url, 'https://maps.app.goo.gl/6W1fhgChaMWaQzbK8'),
  contact_location_legend = COALESCE(contact_location_legend, '* Pullally está ubicado en la Región de Valparaíso, a sólo 2 horas de Santiago.')
WHERE id = 1;

-- 3. Comentarios informativos para las nuevas columnas
COMMENT ON COLUMN landing_settings.contact_address IS 'Dirección física del Rancho desplegada en la sección de ubicación.';
COMMENT ON COLUMN landing_settings.contact_phone IS 'Teléfono de contacto / WhatsApp principal de llamadas.';
COMMENT ON COLUMN landing_settings.contact_email IS 'Correo electrónico oficial de consultas.';
COMMENT ON COLUMN landing_settings.contact_maps_url IS 'Enlace de la redirección del botón de Google Maps.';
COMMENT ON COLUMN landing_settings.contact_location_legend IS 'Leyenda informativa o aclaratoria de distancias ubicada al pie del mapa.';
