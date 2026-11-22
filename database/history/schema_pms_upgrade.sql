-- ====================================================================
-- Script SQL: Actualización PMS - Pagos Múltiples y Aseo de Cabañas
-- Proyecto: Rancho Carmelitas
-- Objetivo: Crear tabla booking_payments, habilitar RLS, triggers y housekeeping
-- ====================================================================

-- 1. Crear tabla booking_payments para soportar abonos parciales y múltiples transacciones
CREATE TABLE IF NOT EXISTS booking_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- CLP
    payment_method VARCHAR(50) NOT NULL, -- 'Transferencia', 'Efectivo', 'Tarjeta', 'Otro'
    reference VARCHAR(255), -- Código de transferencia, transbank, etc.
    receipt_url TEXT, -- Imagen del comprobante subida a Storage
    created_at TIMESTAMPTZ DEFAULT now(),
    notes TEXT
);

-- 2. Crear índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_payments_booking ON booking_payments (booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON booking_payments (created_at DESC);

-- 3. Habilitar RLS (Row Level Security) en la tabla de pagos
ALTER TABLE booking_payments ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas de acceso RLS
-- A. Permitir gestión total (lectura, inserción, edición, borrado) únicamente a personal autenticado
DROP POLICY IF EXISTS "Permitir gestión de pagos a personal autenticado" ON booking_payments;
CREATE POLICY "Permitir gestión de pagos a personal autenticado" 
ON booking_payments FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- B. Permitir lectura pública de pagos (opcional, por si el cliente necesita ver sus abonos por token)
DROP POLICY IF EXISTS "Permitir lectura pública de pagos" ON booking_payments;
CREATE POLICY "Permitir lectura pública de pagos" 
ON booking_payments FOR SELECT 
USING (true);

-- 5. Asociar trigger de bitácora de auditoría histórica automática
DROP TRIGGER IF EXISTS audit_payments_trigger ON booking_payments;
CREATE TRIGGER audit_payments_trigger
AFTER INSERT OR UPDATE OR DELETE ON booking_payments
FOR EACH ROW EXECUTE FUNCTION process_audit_logging();

-- 6. Agregar columna housekeeping_status a cabins
ALTER TABLE cabins ADD COLUMN IF NOT EXISTS housekeeping_status VARCHAR(50) DEFAULT 'Disponible';

-- 7. Asegurar que las cabañas actuales tengan el estado por defecto
UPDATE cabins SET housekeeping_status = 'Disponible' WHERE housekeeping_status IS NULL;
