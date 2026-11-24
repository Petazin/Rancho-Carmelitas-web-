-- ====================================================================
-- Script SQL: Operaciones de Recinto Completo e Historial de Pagos
-- Proyecto: Rancho Carmelitas
-- Objetivo:
--   1. Crear tabla event_payments para registrar abonos/pagos separados
--   2. Sincronizar automáticamente event_quotes.deposit_paid
--   3. Migrar abonos existentes hacia event_payments sin pérdida de datos
--   4. Agregar columnas operativas de Check-in y Finalizado en event_quotes
-- ====================================================================

-- 1. Crear tabla event_payments
CREATE TABLE IF NOT EXISTS event_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_quote_id UUID NOT NULL REFERENCES event_quotes(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL, -- 'Transferencia', 'Efectivo', 'POS Mercado Pago', 'Mercado Pago (Link)', 'Otro'
    reference TEXT,
    notes TEXT,
    recorded_by TEXT DEFAULT 'Administración',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_event_payments_quote_id ON event_payments (event_quote_id);
CREATE INDEX IF NOT EXISTS idx_event_payments_created_at ON event_payments (created_at DESC);

-- 2. Habilitar RLS en event_payments
ALTER TABLE event_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir gestión de pagos de eventos a personal autenticado" ON event_payments;
CREATE POLICY "Permitir gestión de pagos de eventos a personal autenticado"
ON event_payments FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura de pagos de eventos" ON event_payments;
CREATE POLICY "Permitir lectura de pagos de eventos"
ON event_payments FOR SELECT
USING (true);

-- 3. Trigger de Auditoría Histórica (reutilizando process_audit_logging)
DROP TRIGGER IF EXISTS audit_event_payments_trigger ON event_payments;
CREATE TRIGGER audit_event_payments_trigger
AFTER INSERT OR UPDATE OR DELETE ON event_payments
FOR EACH ROW EXECUTE FUNCTION process_audit_logging();

-- 4. Trigger para mantener sincronizado event_quotes.deposit_paid
CREATE OR REPLACE FUNCTION trigger_sync_event_quote_deposit_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_quote_id UUID;
    v_total_paid NUMERIC;
BEGIN
    v_quote_id := COALESCE(NEW.event_quote_id, OLD.event_quote_id);

    SELECT COALESCE(SUM(amount), 0)
    INTO v_total_paid
    FROM event_payments
    WHERE event_quote_id = v_quote_id;

    UPDATE event_quotes
    SET deposit_paid = v_total_paid,
        updated_at = now()
    WHERE id = v_quote_id;

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_event_payments_total ON event_payments;
CREATE TRIGGER trg_sync_event_payments_total
AFTER INSERT OR UPDATE OR DELETE ON event_payments
FOR EACH ROW
EXECUTE FUNCTION trigger_sync_event_quote_deposit_paid();

-- 5. Migración segura de abonos históricos ya registrados en event_quotes
INSERT INTO event_payments (event_quote_id, amount, payment_method, reference, notes, recorded_by, created_at)
SELECT
    eq.id,
    eq.deposit_paid,
    COALESCE(eq.payment_method, 'Transferencia'),
    eq.payment_reference,
    'Abono histórico migrado automáticamente',
    'Sistema (Migración)',
    COALESCE(eq.approved_at, eq.created_at, now())
FROM event_quotes eq
WHERE COALESCE(eq.deposit_paid, 0) > 0
  AND NOT EXISTS (
      SELECT 1 FROM event_payments ep WHERE ep.event_quote_id = eq.id
  );

-- 6. Agregar columnas operativas de Check-in y Finalizado a event_quotes
ALTER TABLE event_quotes
ADD COLUMN IF NOT EXISTS operational_status TEXT DEFAULT 'Pendiente_Ingreso',
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS checked_in_by TEXT,
ADD COLUMN IF NOT EXISTS checked_out_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS checked_out_by TEXT,
ADD COLUMN IF NOT EXISTS checkout_notes TEXT;

-- Asegurar constraint CHECK en operational_status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'event_quotes_operational_status_check'
    ) THEN
        ALTER TABLE event_quotes
        ADD CONSTRAINT event_quotes_operational_status_check
        CHECK (operational_status IN ('Pendiente_Ingreso', 'En_Curso', 'Finalizado'));
    END IF;
END $$;

-- Inicializar filas existentes que tengan operational_status NULL
UPDATE event_quotes
SET operational_status = 'Pendiente_Ingreso'
WHERE operational_status IS NULL;
