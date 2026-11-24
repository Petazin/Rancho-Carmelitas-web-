export const DEFAULT_MIN_BOOKING_NIGHTS = 1;
export const DEFAULT_MIN_ADVANCE_DAYS = 0;

export interface BookingRules {
  minBookingNights: number;
  minAdvanceBookingDays: number;
}

/**
 * Formatea una fecha local como YYYY-MM-DD sin desfase UTC.
 */
export function formatLocalDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Retorna la fecha mínima permitida (YYYY-MM-DD) sumando los días de anticipación a hoy (hora local).
 */
export function getMinAllowedDateStr(advanceDays: number): string {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() + Math.max(0, Math.floor(advanceDays || 0)));
  return formatLocalDateStr(base);
}

/**
 * Calcula las noches entre dos fechas YYYY-MM-DD en horario local.
 */
export function calculateNightsBetween(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const [y1, m1, d1] = checkIn.split('-').map(Number);
  const [y2, m2, d2] = checkOut.split('-').map(Number);
  if (!y1 || !m1 || !d1 || !y2 || !m2 || !d2) return 0;

  const start = new Date(y1, m1 - 1, d1);
  const end = new Date(y2, m2 - 1, d2);
  const diffMs = end.getTime() - start.getTime();
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Extrae las reglas de reserva desde filas de la tabla `settings` con fallbacks seguros.
 */
export function parseBookingRulesFromSettings(
  rows: Array<{ key: string; value: string }> | null | undefined
): BookingRules {
  let minBookingNights = DEFAULT_MIN_BOOKING_NIGHTS;
  let minAdvanceBookingDays = DEFAULT_MIN_ADVANCE_DAYS;

  if (rows && Array.isArray(rows)) {
    for (const row of rows) {
      if (row.key === 'min_booking_nights') {
        const parsed = parseInt(row.value, 10);
        if (!isNaN(parsed) && parsed >= 1) minBookingNights = parsed;
      } else if (row.key === 'min_advance_booking_days') {
        const parsed = parseInt(row.value, 10);
        if (!isNaN(parsed) && parsed >= 0) minAdvanceBookingDays = parsed;
      }
    }
  }

  return { minBookingNights, minAdvanceBookingDays };
}

/**
 * Valida si una estadía en cabaña cumple con el mínimo de noches y los días de anticipación.
 */
export function validateCabinBookingRules({
  checkIn,
  checkOut,
  minBookingNights,
  minAdvanceBookingDays,
}: {
  checkIn: string | null | undefined;
  checkOut: string | null | undefined;
  minBookingNights: number;
  minAdvanceBookingDays: number;
}) {
  const minAllowedDateStr = getMinAllowedDateStr(minAdvanceBookingDays);
  const nights = checkIn && checkOut ? calculateNightsBetween(checkIn, checkOut) : 0;

  const meetsMinAdvance = !checkIn || checkIn >= minAllowedDateStr;
  const meetsMinNights = !checkIn || !checkOut || nights >= minBookingNights;

  let errorMessage: string | null = null;
  if (checkIn && !meetsMinAdvance) {
    errorMessage = `Se requiere reservar con al menos ${minAdvanceBookingDays} ${
      minAdvanceBookingDays === 1 ? 'día' : 'días'
    } de anticipación.`;
  } else if (checkIn && checkOut && !meetsMinNights) {
    errorMessage = `La estadía mínima para arrendar es de ${minBookingNights} ${
      minBookingNights === 1 ? 'noche' : 'noches'
    } (seleccionaste ${nights}).`;
  }

  return {
    valid: meetsMinAdvance && meetsMinNights,
    nights,
    minAllowedDateStr,
    meetsMinNights,
    meetsMinAdvance,
    errorMessage,
  };
}
