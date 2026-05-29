-- ====================================================================
-- Script SQL: Extensión de Registro de Auditoría para Todo el Sistema
-- Proyecto: Rancho Carmelitas
-- Objetivo: Vincular el trigger 'process_audit_logging()' a las tablas de
--           landing_settings, landing_gallery, settings y plataformas.
-- ====================================================================

-- 1. Eliminar de manera preventiva triggers antiguos para evitar duplicación
DROP TRIGGER IF EXISTS audit_landing_settings_trigger ON landing_settings;
DROP TRIGGER IF EXISTS audit_landing_gallery_trigger ON landing_gallery;
DROP TRIGGER IF EXISTS audit_settings_trigger ON settings;
DROP TRIGGER IF EXISTS audit_plataformas_trigger ON plataformas;

-- 2. Vincular el disparador de auditoría inteligente a la tabla 'landing_settings'
CREATE TRIGGER audit_landing_settings_trigger
AFTER INSERT OR UPDATE OR DELETE ON landing_settings
FOR EACH ROW EXECUTE FUNCTION process_audit_logging();

COMMENT ON TRIGGER audit_landing_settings_trigger ON landing_settings IS 'Registra cambios de logo y diseño hero del sitio en la bitácora histórica';

-- 3. Vincular el disparador de auditoría inteligente a la tabla 'landing_gallery'
CREATE TRIGGER audit_landing_gallery_trigger
AFTER INSERT OR UPDATE OR DELETE ON landing_gallery
FOR EACH ROW EXECUTE FUNCTION process_audit_logging();

COMMENT ON TRIGGER audit_landing_gallery_trigger ON landing_gallery IS 'Registra fotos de la galería cargadas o eliminadas';

-- 4. Vincular el disparador de auditoría inteligente a la tabla 'settings'
CREATE TRIGGER audit_settings_trigger
AFTER INSERT OR UPDATE OR DELETE ON settings
FOR EACH ROW EXECUTE FUNCTION process_audit_logging();

COMMENT ON TRIGGER audit_settings_trigger ON settings IS 'Registra cambios en configuraciones globales (WhatsApp, RUT, datos de empresa)';

-- 5. Vincular el disparador de auditoría inteligente a la tabla 'plataformas'
CREATE TRIGGER audit_plataformas_trigger
AFTER INSERT OR UPDATE OR DELETE ON plataformas
FOR EACH ROW EXECUTE FUNCTION process_audit_logging();

COMMENT ON TRIGGER audit_plataformas_trigger ON plataformas IS 'Registra adición, edición o eliminación de canales externos de venta';
