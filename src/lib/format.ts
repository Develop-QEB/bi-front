/**
 * Formateo de cifras del BI. El Power BI original muestra todo en millones
 * ("168 mill.", "$19.3 mill.") — replicamos esa convención.
 */

/** 168_400_000 → "168 mill." */
export function formatMill(value: number, decimals = 0): string {
  const mill = value / 1_000_000;
  return `${mill.toLocaleString('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} mill.`;
}

/** 19_300_000 → "$19.3 mill." */
export function formatMillCurrency(value: number, decimals = 1): string {
  const mill = value / 1_000_000;
  return `$${mill.toLocaleString('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} mill.`;
}

/** Etiqueta corta para ejes: 50_000_000 → "50 mill." */
export function formatAxisMill(value: number): string {
  if (value === 0) return '0';
  return formatMill(value);
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
