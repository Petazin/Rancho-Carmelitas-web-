-- ====================================================================
-- Script SQL: Fase 1 - Tramos Dinámicos, Galería de Recinto y Blindaje Financiero
-- Proyecto: Rancho Carmelitas (Pullally, Papudo)
-- Entorno: Supabase PostgreSQL (Test)
-- Versión: 3.0 (EGM Hardened)
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. Extensión de 'landing_gallery' para Categorías (Cabañas vs Recinto)
-- --------------------------------------------------------------------
ALTER TABLE landing_gallery 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- Índice para consultas filtradas por categoría de alta concurrencia
CREATE INDEX IF NOT EXISTS idx_landing_gallery_category ON landing_gallery(category);

COMMENT ON COLUMN landing_gallery.category IS 'Categoría de la imagen: general (portada/cabañas) o recinto (eventos diurnos de 8h)';

-- --------------------------------------------------------------------
-- 2. Sembrado de Parámetros Dinámicos en la tabla 'settings'
-- --------------------------------------------------------------------
INSERT INTO settings (key, value, description)
VALUES 
  (
    'venue_pricing_tiers', 
    '[{"id":"tier-1","name":"Paseo Estándar (hasta 15 personas)","min_guests":1,"max_guests":15,"base_price":180000,"included_guests":15,"extra_guest_fee":3500},{"id":"tier-2","name":"Paseo Mediano (16 a 29 personas)","min_guests":16,"max_guests":29,"base_price":180000,"included_guests":15,"extra_guest_fee":3500},{"id":"tier-3","name":"Paseo Grande (30 a 70 personas)","min_guests":30,"max_guests":70,"base_price":250000,"included_guests":30,"extra_guest_fee":3500}]', 
    'Tramos dinámicos de asistentes y precios para arriendo de recinto completo (8h) en formato JSON'
  ),
  (
    'venue_bouncy_castle_fee', 
    '5000', 
    'Tarifa en CLP por consumo eléctrico si el cliente trae juego inflable'
  ),
  (
    'venue_deposit_percentage', 
    '50', 
    'Porcentaje de abono requerido para confirmar la reserva de recinto completo'
  ),
  (
    'venue_max_capacity', 
    '70', 
    'Aforo máximo permitido de personas en el recinto para eventos diurnos'
  )
ON CONFLICT (key) DO UPDATE 
SET 
  description = EXCLUDED.description,
  value = CASE 
    WHEN settings.value IS NULL OR settings.value = '' THEN EXCLUDED.value 
    ELSE settings.value 
  END;

-- --------------------------------------------------------------------
-- 3. Triggers de Auditoría Antiruido para 'settings' y 'landing_gallery'
-- --------------------------------------------------------------------
-- A. Triggers para 'settings' (se separa UPDATE para filtrar cambios idénticos sin romper en INSERT)
DROP TRIGGER IF EXISTS audit_settings_trigger ON settings;
DROP TRIGGER IF EXISTS audit_settings_insert_delete_trigger ON settings;
DROP TRIGGER IF EXISTS audit_settings_update_trigger ON settings;

CREATE TRIGGER audit_settings_insert_delete_trigger
AFTER INSERT OR DELETE ON settings
FOR EACH ROW 
EXECUTE FUNCTION process_audit_logging();

CREATE TRIGGER audit_settings_update_trigger
AFTER UPDATE ON settings
FOR EACH ROW 
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION process_audit_logging();

-- B. Triggers para 'landing_gallery'
DROP TRIGGER IF EXISTS audit_landing_gallery_trigger ON landing_gallery;
DROP TRIGGER IF EXISTS audit_landing_gallery_insert_delete_trigger ON landing_gallery;
DROP TRIGGER IF EXISTS audit_landing_gallery_update_trigger ON landing_gallery;

CREATE TRIGGER audit_landing_gallery_insert_delete_trigger
AFTER INSERT OR DELETE ON landing_gallery
FOR EACH ROW 
EXECUTE FUNCTION process_audit_logging();

CREATE TRIGGER audit_landing_gallery_update_trigger
AFTER UPDATE ON landing_gallery
FOR EACH ROW 
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION process_audit_logging();

-- --------------------------------------------------------------------
-- 4. Función RPC Blindada: 'create_public_event_quote' (Zero-Trust Client)
-- El backend calcula y valida los precios oficiales en PostgreSQL.
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_public_event_quote(
    p_event_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_organizer_name TEXT,
    p_organizer_email TEXT,
    p_organizer_phone TEXT,
    p_organizer_rut TEXT,
    p_group_type TEXT,
    p_group_name TEXT,
    p_adults_count INTEGER,
    p_children_count INTEGER,
    p_under_3_years_count INTEGER,
    p_has_bouncy_castle BOOLEAN,
    p_extra_services_notes TEXT,
    p_base_price NUMERIC DEFAULT NULL,
    p_extra_guests_cost NUMERIC DEFAULT NULL,
    p_bouncy_castle_fee NUMERIC DEFAULT NULL,
    p_total_amount NUMERIC DEFAULT NULL,
    p_deposit_required NUMERIC DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_quote_id UUID;
    v_avail JSON;
    v_paying_guests INTEGER;
    v_total_guests INTEGER;
    v_max_capacity INTEGER := 70;
    
    -- Tarifas y parámetros leídos de 'settings'
    v_tiers_raw TEXT;
    v_tiers_json JSONB;
    v_tier RECORD;
    v_matched_tier JSONB := NULL;
    v_last_tier JSONB := NULL;
    
    v_inflatable_fee_setting NUMERIC := 5000;
    v_deposit_percent_setting NUMERIC := 50;
    
    -- Cálculos oficiales autoritativos del servidor
    v_calculated_base_price NUMERIC := 180000;
    v_calculated_extra_cost NUMERIC := 0;
    v_calculated_bouncy_fee NUMERIC := 0;
    v_calculated_total NUMERIC := 180000;
    v_calculated_deposit NUMERIC := 90000;
    v_included_guests INTEGER := 15;
    v_extra_fee_per_guest NUMERIC := 3500;
BEGIN
    -- 1. Validar disponibilidad atómica de fecha
    v_avail := check_full_venue_availability(p_event_date);
    IF (v_avail->>'available')::BOOLEAN = FALSE THEN
        RAISE EXCEPTION 'La fecha seleccionada (%) no se encuentra disponible: %', p_event_date, v_avail->>'reason';
    END IF;

    -- 2. Conteo de asistentes
    v_paying_guests := GREATEST(1, COALESCE(p_adults_count, 1) + COALESCE(p_children_count, 0));
    v_total_guests := v_paying_guests + COALESCE(p_under_3_years_count, 0);

    -- 3. Obtener configuración de aforo máximo
    SELECT COALESCE(NULLIF(value, '')::INTEGER, 70) INTO v_max_capacity
    FROM settings WHERE key = 'venue_max_capacity';
    
    IF v_total_guests > v_max_capacity THEN
        RAISE EXCEPTION 'El grupo total (% personas) excede el aforo máximo permitido del recinto (% personas). Por favor contáctanos por WhatsApp.', v_total_guests, v_max_capacity;
    END IF;

    -- 4. Obtener tarifas de recargo por inflable y % de abono
    SELECT COALESCE(NULLIF(value, '')::NUMERIC, 5000) INTO v_inflatable_fee_setting
    FROM settings WHERE key = 'venue_bouncy_castle_fee';

    SELECT COALESCE(NULLIF(value, '')::NUMERIC, 50) INTO v_deposit_percent_setting
    FROM settings WHERE key = 'venue_deposit_percentage';

    -- 5. Obtener tramos dinámicos de 'settings'
    SELECT value INTO v_tiers_raw
    FROM settings WHERE key = 'venue_pricing_tiers';

    IF v_tiers_raw IS NOT NULL AND v_tiers_raw != '' THEN
        BEGIN
            v_tiers_json := v_tiers_raw::JSONB;
        EXCEPTION WHEN OTHERS THEN
            v_tiers_json := NULL;
        END;
    END IF;

    -- 6. Algoritmo de cálculo de precio en base a tramos
    IF v_tiers_json IS NOT NULL AND jsonb_typeof(v_tiers_json) = 'array' AND jsonb_array_length(v_tiers_json) > 0 THEN
        -- Recorrer tramos buscando coincidencia
        FOR v_tier IN SELECT * FROM jsonb_to_recordset(v_tiers_json) AS x(
            id TEXT, name TEXT, min_guests INT, max_guests INT, base_price NUMERIC, included_guests INT, extra_guest_fee NUMERIC
        )
        LOOP
            v_last_tier := to_jsonb(v_tier);
            IF v_paying_guests >= v_tier.min_guests AND v_paying_guests <= v_tier.max_guests THEN
                v_matched_tier := to_jsonb(v_tier);
                EXIT;
            END IF;
        END LOOP;

        -- Si no hubo coincidencia pero es mayor al último tramo, usar el último tramo
        IF v_matched_tier IS NULL AND v_last_tier IS NOT NULL THEN
            v_matched_tier := v_last_tier;
        END IF;

        IF v_matched_tier IS NOT NULL THEN
            v_calculated_base_price := (v_matched_tier->>'base_price')::NUMERIC;
            v_included_guests := (v_matched_tier->>'included_guests')::INTEGER;
            v_extra_fee_per_guest := (v_matched_tier->>'extra_guest_fee')::NUMERIC;
            v_calculated_extra_cost := GREATEST(0, v_paying_guests - v_included_guests) * v_extra_fee_per_guest;
        END IF;
    ELSE
        -- Fallback resiliente oficial si no hay JSON
        IF v_paying_guests <= 15 THEN
            v_calculated_base_price := 180000;
            v_calculated_extra_cost := 0;
        ELSIF v_paying_guests < 30 THEN
            v_calculated_base_price := 180000;
            v_calculated_extra_cost := (v_paying_guests - 15) * 3500;
        ELSE
            v_calculated_base_price := 250000;
            v_calculated_extra_cost := (v_paying_guests - 30) * 3500;
        END IF;
    END IF;

    -- 7. Calcular recargo de inflable
    IF p_has_bouncy_castle IS TRUE THEN
        v_calculated_bouncy_fee := v_inflatable_fee_setting;
    ELSE
        v_calculated_bouncy_fee := 0;
    END IF;

    -- 8. Totales autoritativos
    v_calculated_total := v_calculated_base_price + v_calculated_extra_cost + v_calculated_bouncy_fee;
    v_calculated_deposit := ROUND(v_calculated_total * (v_deposit_percent_setting / 100.0));

    -- 9. Detección de discrepancia client-side (Zero-Trust Validation)
    IF p_total_amount IS NOT NULL AND ABS(p_total_amount - v_calculated_total) > 10 THEN
        RAISE EXCEPTION 'Discrepancia tarifaria: el total enviado ($%) difiere del valor calculado en servidor ($%). Cotización rechazada.', p_total_amount, v_calculated_total;
    END IF;

    -- 10. Inserción segura con montos validados por el servidor
    INSERT INTO event_quotes (
        event_date,
        start_time,
        end_time,
        organizer_name,
        organizer_email,
        organizer_phone,
        organizer_rut,
        group_type,
        group_name,
        total_guests,
        adults_count,
        children_count,
        under_3_years_count,
        has_bouncy_castle,
        bouncy_castle_fee,
        extra_services_notes,
        base_price,
        extra_guests_cost,
        total_amount,
        deposit_required,
        deposit_paid,
        status
    ) VALUES (
        p_event_date,
        p_start_time,
        p_end_time,
        p_organizer_name,
        p_organizer_email,
        p_organizer_phone,
        p_organizer_rut,
        COALESCE(p_group_type, 'paseo_curso'),
        p_group_name,
        v_total_guests,
        COALESCE(p_adults_count, 1),
        COALESCE(p_children_count, 0),
        COALESCE(p_under_3_years_count, 0),
        COALESCE(p_has_bouncy_castle, FALSE),
        v_calculated_bouncy_fee,
        p_extra_services_notes,
        v_calculated_base_price,
        v_calculated_extra_cost,
        v_calculated_total,
        v_calculated_deposit,
        0,
        'Cotizacion_Pendiente'
    )
    RETURNING id INTO v_quote_id;

    RETURN v_quote_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_public_event_quote(
    DATE, TIME, TIME, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER, BOOLEAN, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC
) TO anon, authenticated;

COMMENT ON FUNCTION create_public_event_quote IS 'Registra una cotización de arriendo de recinto completo calculando y validando autoritativamente los precios en PostgreSQL (Zero-Trust).';
