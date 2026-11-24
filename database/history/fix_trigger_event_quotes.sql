-- ====================================================================
-- FIX: Corrección de Trigger de Sincronización de Cierres de Recinto
-- ====================================================================
-- Problema previo:
-- El trigger era AFTER UPDATE OF status y ejecutaba un UPDATE sobre la
-- misma fila de event_quotes (UPDATE event_quotes SET associated_closure_id...),
-- provocando el error en PostgreSQL:
-- "tuple to be updated was already modified by an operation triggered by the current command"
--
-- Solución:
-- Convertir el trigger a BEFORE UPDATE OF status. Al ser BEFORE, simplemente
-- mutamos NEW.associated_closure_id en memoria sin generar una subtransacción
-- recursiva sobre la misma tupla.
-- ====================================================================

CREATE OR REPLACE FUNCTION trigger_sync_event_quote_closure()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_closure_id UUID;
BEGIN
    -- 1. Si se CONFIRMA el evento y antes no lo estaba:
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

        -- En BEFORE UPDATE se asigna directamente al registro NEW
        NEW.associated_closure_id := v_closure_id;
    END IF;

    -- 2. Si se CANCELA o RECHAZA un evento previamente confirmado:
    IF NEW.status IN ('Cancelada', 'Rechazada') AND OLD.status = 'Confirmada' THEN
        -- Si tenía un closure asociado, eliminarlo de cabin_closures
        IF OLD.associated_closure_id IS NOT NULL THEN
            DELETE FROM cabin_closures WHERE id = OLD.associated_closure_id;
        END IF;

        -- Liberar la referencia en la tupla actual
        NEW.associated_closure_id := NULL;
    END IF;

    -- 3. Si el evento sigue 'Confirmada' pero se modifica la fecha del evento:
    IF NEW.status = 'Confirmada' AND OLD.status = 'Confirmada' AND NEW.event_date != OLD.event_date THEN
        IF OLD.associated_closure_id IS NOT NULL THEN
            UPDATE cabin_closures
            SET start_date = NEW.event_date,
                end_date = NEW.event_date,
                reason = 'Evento Exclusivo Recinto: ' || COALESCE(NEW.group_name, NEW.organizer_name)
            WHERE id = OLD.associated_closure_id;
        ELSE
            -- Si por alguna razón no tenía closure, crearlo ahora
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
            NEW.associated_closure_id := v_closure_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- Reemplazar el trigger anterior AFTER por el nuevo BEFORE
DROP TRIGGER IF EXISTS trg_sync_event_quote_closure ON event_quotes;

CREATE TRIGGER trg_sync_event_quote_closure
BEFORE UPDATE OF status, event_date ON event_quotes
FOR EACH ROW
EXECUTE FUNCTION trigger_sync_event_quote_closure();
