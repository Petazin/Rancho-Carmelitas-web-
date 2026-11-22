-- ====================================================================
-- SCRIPT DE ACTUALIZACIÓN: TRAMOS PUROS Y TARIFAS FIJAS DE RECINTO COMPLETO
-- Rancho Carmelitas (Pullally, Papudo)
--
-- Propósito:
-- Actualizar la función RPC 'create_public_event_quote' para operar bajo el
-- modelo de tarifas fijas por tramo, eliminando de forma definitiva el
-- cálculo residual de adicionales para el Arriendo de Recinto Completo (8h).
-- Las cabañas y sus adicionales se mantienen 100% intactos.
-- ====================================================================

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
    p_extra_guests_cost NUMERIC DEFAULT 0,
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
    
    -- Parámetros leídos de 'settings'
    v_tiers_raw TEXT;
    v_tiers_json JSONB;
    v_tier RECORD;
    v_matched_tier JSONB := NULL;
    v_last_tier JSONB := NULL;
    
    v_inflatable_fee_setting NUMERIC := 5000;
    v_deposit_percent_setting NUMERIC := 50;
    
    -- Cálculos autoritativos del servidor (Tarifas fijas por tramo)
    v_calculated_base_price NUMERIC := 190000;
    v_calculated_extra_cost NUMERIC := 0; -- Siempre 0 para recinto completo
    v_calculated_bouncy_fee NUMERIC := 0;
    v_calculated_total NUMERIC := 190000;
    v_calculated_deposit NUMERIC := 95000;
BEGIN
    -- 1. Validar disponibilidad atómica de fecha
    v_avail := check_full_venue_availability(p_event_date);
    IF (v_avail->>'available')::BOOLEAN = FALSE THEN
        RAISE EXCEPTION 'La fecha seleccionada (%) no se encuentra disponible: %', p_event_date, v_avail->>'reason';
    END IF;

    -- 2. Conteo de asistentes (Adultos + Niños pagan tarifa; menores de 3 años exentos)
    v_paying_guests := GREATEST(1, COALESCE(p_adults_count, 1) + COALESCE(p_children_count, 0));
    v_total_guests := v_paying_guests + COALESCE(p_under_3_years_count, 0);

    -- 3. Obtener configuración de aforo máximo
    SELECT COALESCE(NULLIF(value, '')::INTEGER, 70) INTO v_max_capacity
    FROM settings WHERE key = 'venue_max_capacity';
    
    IF v_total_guests > v_max_capacity THEN
        RAISE EXCEPTION 'El grupo total (% personas) excede el aforo máximo permitido del recinto (% personas). Por favor contáctanos por WhatsApp para eventos especiales.', v_total_guests, v_max_capacity;
    END IF;

    -- 4. Obtener recargo de inflable y % de abono
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

    -- 6. Algoritmo de tarifa fija por tramo
    IF v_tiers_json IS NOT NULL AND jsonb_typeof(v_tiers_json) = 'array' AND jsonb_array_length(v_tiers_json) > 0 THEN
        FOR v_tier IN SELECT * FROM jsonb_to_recordset(v_tiers_json) AS x(
            id TEXT, name TEXT, min_guests INT, max_guests INT, base_price NUMERIC
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
        END IF;
    ELSE
        -- Fallback resiliente oficial si no hubiera configuración cargada
        IF v_paying_guests <= 20 THEN
            v_calculated_base_price := 190000;
        ELSIF v_paying_guests <= 40 THEN
            v_calculated_base_price := 250000;
        ELSE
            v_calculated_base_price := 350000;
        END IF;
    END IF;

    -- 7. Calcular recargo de inflable
    IF p_has_bouncy_castle IS TRUE THEN
        v_calculated_bouncy_fee := v_inflatable_fee_setting;
    ELSE
        v_calculated_bouncy_fee := 0;
    END IF;

    -- 8. Totales autoritativos (Tarifa fija de tramo + inflable si aplica)
    v_calculated_extra_cost := 0;
    v_calculated_total := v_calculated_base_price + v_calculated_bouncy_fee;
    v_calculated_deposit := ROUND(v_calculated_total * (v_deposit_percent_setting / 100.0));

    -- 9. Detección de discrepancia client-side (Zero-Trust Validation)
    IF p_total_amount IS NOT NULL AND ABS(p_total_amount - v_calculated_total) > 10 THEN
        RAISE EXCEPTION 'Discrepancia tarifaria: el total enviado ($%) difiere del valor calculado en servidor ($%). Cotización rechazada.', p_total_amount, v_calculated_total;
    END IF;

    -- 10. Inserción atómica en 'event_quotes'
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
        adults_count,
        children_count,
        under_3_years_count,
        has_bouncy_castle,
        extra_services_notes,
        base_price,
        extra_guests_cost,
        bouncy_castle_fee,
        total_amount,
        deposit_required,
        status
    ) VALUES (
        p_event_date,
        p_start_time,
        p_end_time,
        p_organizer_name,
        p_organizer_email,
        p_organizer_phone,
        p_organizer_rut,
        p_group_type,
        p_group_name,
        COALESCE(p_adults_count, 1),
        COALESCE(p_children_count, 0),
        COALESCE(p_under_3_years_count, 0),
        COALESCE(p_has_bouncy_castle, false),
        p_extra_services_notes,
        v_calculated_base_price,
        0, -- extra_guests_cost en 0
        v_calculated_bouncy_fee,
        v_calculated_total,
        v_calculated_deposit,
        'solicitada'
    )
    RETURNING id INTO v_quote_id;

    RETURN v_quote_id;
END;
$$;
