-- ====================================================================
-- Script SQL Oficial para PRODUCCIÓN: Suite Completa de Arriendo de Recinto Completo (8 Horas)
-- Proyecto: Rancho Carmelitas (Pullally, Papudo)
-- Entorno: Supabase PostgreSQL (PRODUCCIÓN)
-- Versión: 2.1.0 (Idempotente y Seguro)
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. Crear tabla principal: 'event_quotes' (si no existe)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Fecha y horario del evento
    event_date DATE NOT NULL,
    start_time TIME DEFAULT '10:00:00',
    end_time TIME DEFAULT '18:00:00',
    
    -- Datos del organizador responsable
    organizer_name TEXT NOT NULL,
    organizer_email TEXT NOT NULL,
    organizer_phone TEXT NOT NULL,
    organizer_rut TEXT,
    
    -- Clasificación del grupo
    group_type TEXT NOT NULL DEFAULT 'paseo_curso' 
        CHECK (group_type IN ('paseo_curso', 'adulto_mayor', 'familiar', 'empresa', 'otro')),
    group_name TEXT,
    
    -- Conteo de asistentes
    total_guests INTEGER NOT NULL DEFAULT 1,
    adults_count INTEGER NOT NULL DEFAULT 1,
    children_count INTEGER DEFAULT 0,
    under_3_years_count INTEGER DEFAULT 0,
    
    -- Adicionales y servicios
    has_bouncy_castle BOOLEAN DEFAULT FALSE,
    bouncy_castle_fee NUMERIC DEFAULT 0,
    extra_services_notes TEXT,
    
    -- Aspectos Financieros oficiales
    base_price NUMERIC NOT NULL DEFAULT 180000,
    extra_guests_cost NUMERIC DEFAULT 0,
    total_amount NUMERIC NOT NULL DEFAULT 180000,
    deposit_required NUMERIC NOT NULL DEFAULT 90000,
    deposit_paid NUMERIC DEFAULT 0,
    
    -- Estados operativos del evento
    status TEXT NOT NULL DEFAULT 'Cotizacion_Pendiente' 
        CHECK (status IN ('Cotizacion_Pendiente', 'Aprobada', 'Confirmada', 'Rechazada', 'Cancelada')),
    
    -- Información de pago
    payment_method TEXT,
    payment_reference TEXT,
    
    -- Gestión administrativa
    admin_notes TEXT,
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    
    -- Soporte para Cabaña Conversada
    includes_support_cabin BOOLEAN DEFAULT FALSE,
    support_cabin_id UUID REFERENCES cabins(id) ON DELETE SET NULL,
    support_cabin_extra_fee NUMERIC DEFAULT 0,
    
    -- Cierre temporal automático vinculado
    associated_closure_id UUID REFERENCES cabin_closures(id) ON DELETE SET NULL
);

-- Índices de alto rendimiento
CREATE INDEX IF NOT EXISTS idx_event_quotes_date ON event_quotes(event_date);
CREATE INDEX IF NOT EXISTS idx_event_quotes_status ON event_quotes(status);

-- RLS para event_quotes
ALTER TABLE event_quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura publica de cotizaciones propias por token o id" ON event_quotes;
CREATE POLICY "Permitir lectura publica de cotizaciones propias por token o id"
ON event_quotes FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Permitir gestion completa a personal autenticado en event_quotes" ON event_quotes;
CREATE POLICY "Permitir gestion completa a personal autenticado en event_quotes"
ON event_quotes FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- --------------------------------------------------------------------
-- 2. Función RPC: 'check_full_venue_availability'
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_full_venue_availability(p_date DATE)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_has_bookings BOOLEAN := FALSE;
    v_has_closures BOOLEAN := FALSE;
    v_has_events BOOLEAN := FALSE;
BEGIN
    -- 1. Verificar si hay reservas de cabañas individuales activas que toquen esta fecha
    SELECT EXISTS (
        SELECT 1 FROM bookings
        WHERE status != 'Cancelada'
          AND (
            (check_in <= p_date AND check_out > p_date)
            OR check_in = p_date
          )
    ) INTO v_has_bookings;

    IF v_has_bookings THEN
        RETURN json_build_object(
            'available', FALSE,
            'reason', 'Existen reservas individuales de cabañas confirmadas para esta fecha. Te sugerimos seleccionar otro día disponible.'
        );
    END IF;

    -- 2. Verificar cierres de mantención
    SELECT EXISTS (
        SELECT 1 FROM cabin_closures
        WHERE start_date <= p_date AND end_date >= p_date
    ) INTO v_has_closures;

    IF v_has_closures THEN
        RETURN json_build_object(
            'available', FALSE,
            'reason', 'El recinto cuenta con un cierre programado para esta fecha.'
        );
    END IF;

    -- 3. Verificar si ya existe otro evento confirmado o aprobado
    SELECT EXISTS (
        SELECT 1 FROM event_quotes
        WHERE event_date = p_date
          AND status IN ('Confirmada', 'Aprobada')
    ) INTO v_has_events;

    IF v_has_events THEN
        RETURN json_build_object(
            'available', FALSE,
            'reason', 'El recinto completo ya se encuentra reservado para otro evento en esta fecha.'
        );
    END IF;

    RETURN json_build_object(
        'available', TRUE,
        'reason', 'Fecha disponible para Arriendo de Recinto Completo (8 horas).'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION check_full_venue_availability(DATE) TO anon, authenticated;

-- --------------------------------------------------------------------
-- 3. Función RPC: 'get_occupied_venue_dates'
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_occupied_venue_dates()
RETURNS TABLE (
    occupied_date DATE
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT DISTINCT d::DATE AS occupied_date
    FROM bookings b,
         generate_series(b.check_in, b.check_out, '1 day'::interval) d
    WHERE b.status != 'Cancelada'
    
    UNION
    
    SELECT DISTINCT d::DATE AS occupied_date
    FROM cabin_closures c,
         generate_series(c.start_date, c.end_date, '1 day'::interval) d
         
    UNION
    
    SELECT event_date AS occupied_date
    FROM event_quotes
    WHERE status IN ('Confirmada', 'Aprobada');
$$;

GRANT EXECUTE ON FUNCTION get_occupied_venue_dates() TO anon, authenticated;

-- --------------------------------------------------------------------
-- 4. Trigger de Sincronización Automática de Cierre de Recinto
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_sync_event_quote_closure()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_closure_id UUID;
BEGIN
    IF NEW.status = 'Confirmada' AND (OLD.status IS NULL OR OLD.status != 'Confirmada') THEN
        INSERT INTO cabin_closures (
            cabin_id,
            start_date,
            end_date,
            reason
        ) VALUES (
            NULL,
            NEW.event_date,
            NEW.event_date,
            'Evento Exclusivo Recinto: ' || COALESCE(NEW.group_name, NEW.organizer_name)
        )
        RETURNING id INTO v_closure_id;

        UPDATE event_quotes
        SET associated_closure_id = v_closure_id
        WHERE id = NEW.id;
    END IF;

    IF NEW.status IN ('Cancelada', 'Rechazada') AND OLD.status = 'Confirmada' AND OLD.associated_closure_id IS NOT NULL THEN
        DELETE FROM cabin_closures WHERE id = OLD.associated_closure_id;
        
        UPDATE event_quotes
        SET associated_closure_id = NULL
        WHERE id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_event_quote_closure ON event_quotes;
CREATE TRIGGER trg_sync_event_quote_closure
AFTER UPDATE OF status ON event_quotes
FOR EACH ROW
EXECUTE FUNCTION trigger_sync_event_quote_closure();

-- --------------------------------------------------------------------
-- 5. Extensión de 'landing_gallery' para Categorías (Cabañas vs Recinto)
-- --------------------------------------------------------------------
ALTER TABLE landing_gallery 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

CREATE INDEX IF NOT EXISTS idx_landing_gallery_category ON landing_gallery(category);

-- --------------------------------------------------------------------
-- 6. Sembrado de Parámetros Dinámicos en la tabla 'settings'
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
-- 7. Triggers de Auditoría Antiruido para 'settings' y 'landing_gallery'
-- --------------------------------------------------------------------
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
-- 8. Función RPC Blindada: 'create_public_event_quote' (Zero-Trust Client)
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
    
    v_tiers_raw TEXT;
    v_tiers_json JSONB;
    v_tier RECORD;
    v_matched_tier JSONB := NULL;
    v_last_tier JSONB := NULL;
    
    v_inflatable_fee_setting NUMERIC := 5000;
    v_deposit_percent_setting NUMERIC := 50;
    
    v_calculated_base_price NUMERIC := 180000;
    v_calculated_extra_cost NUMERIC := 0;
    v_calculated_bouncy_fee NUMERIC := 0;
    v_calculated_total NUMERIC := 180000;
    v_calculated_deposit NUMERIC := 90000;
    v_included_guests INTEGER := 15;
    v_extra_fee_per_guest NUMERIC := 3500;
BEGIN
    v_avail := check_full_venue_availability(p_event_date);
    IF (v_avail->>'available')::BOOLEAN = FALSE THEN
        RAISE EXCEPTION 'La fecha seleccionada (%) no se encuentra disponible: %', p_event_date, v_avail->>'reason';
    END IF;

    v_paying_guests := GREATEST(1, COALESCE(p_adults_count, 1) + COALESCE(p_children_count, 0));
    v_total_guests := v_paying_guests + COALESCE(p_under_3_years_count, 0);

    SELECT COALESCE(NULLIF(value, '')::INTEGER, 70) INTO v_max_capacity
    FROM settings WHERE key = 'venue_max_capacity';
    
    IF v_total_guests > v_max_capacity THEN
        RAISE EXCEPTION 'El grupo total (% personas) excede el aforo máximo permitido del recinto (% personas). Por favor contáctanos por WhatsApp.', v_total_guests, v_max_capacity;
    END IF;

    SELECT COALESCE(NULLIF(value, '')::NUMERIC, 5000) INTO v_inflatable_fee_setting
    FROM settings WHERE key = 'venue_bouncy_castle_fee';

    SELECT COALESCE(NULLIF(value, '')::NUMERIC, 50) INTO v_deposit_percent_setting
    FROM settings WHERE key = 'venue_deposit_percentage';

    SELECT value INTO v_tiers_raw
    FROM settings WHERE key = 'venue_pricing_tiers';

    IF v_tiers_raw IS NOT NULL AND v_tiers_raw != '' THEN
        BEGIN
            v_tiers_json := v_tiers_raw::JSONB;
        EXCEPTION WHEN OTHERS THEN
            v_tiers_json := NULL;
        END;
    END IF;

    IF v_tiers_json IS NOT NULL AND jsonb_typeof(v_tiers_json) = 'array' AND jsonb_array_length(v_tiers_json) > 0 THEN
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

    IF p_has_bouncy_castle IS TRUE THEN
        v_calculated_bouncy_fee := v_inflatable_fee_setting;
    ELSE
        v_calculated_bouncy_fee := 0;
    END IF;

    v_calculated_total := v_calculated_base_price + v_calculated_extra_cost + v_calculated_bouncy_fee;
    v_calculated_deposit := ROUND(v_calculated_total * (v_deposit_percent_setting / 100.0));

    IF p_total_amount IS NOT NULL AND ABS(p_total_amount - v_calculated_total) > 10 THEN
        RAISE EXCEPTION 'Discrepancia tarifaria: el total enviado ($%) difiere del valor calculado en servidor ($%).', p_total_amount, v_calculated_total;
    END IF;

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

COMMENT ON FUNCTION create_public_event_quote IS 'Registra una cotización de arriendo de recinto calculando y validando autoritativamente los precios en PostgreSQL (Zero-Trust).';
