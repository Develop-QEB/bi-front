/**
 * Formateo de cifras del BI. Se muestran las cantidades COMPLETAS en pesos con
 * separadores de miles ("$20,940,000"), no abreviadas a millones.
 */

/** 20_940_000 → "$20,940,000" (cantidad completa con símbolo). */
export function formatMill(value: number): string {
  return formatCurrency(value);
}

/** 20_940_000 → "$20,940,000" (idéntico a formatMill; se mantiene por compatibilidad). */
export function formatMillCurrency(value: number): string {
  return formatCurrency(value);
}

/**
 * Etiqueta para ejes: número completo con separadores, SIN símbolo, para no
 * ensanchar de más el eje. 50_000_000 → "50,000,000".
 */
export function formatAxisMill(value: number): string {
  if (value === 0) return '0';
  return value.toLocaleString('es-MX', { maximumFractionDigits: 0 });
}

export function formatPct(value: number, decimals = 2): string {
  return `${value.toLocaleString('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} %`;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value);
}

/** Porcentaje de cumplimiento, protegido contra división entre cero. */
export function cumplimiento(real: number, objetivo: number): number {
  if (!objetivo) return 0;
  return (real / objetivo) * 100;
}
