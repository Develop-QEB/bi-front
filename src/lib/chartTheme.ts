/**
 * Paleta de gráficas del BI.
 *
 * Los pares light/dark están validados con el validador de paleta (seis checks:
 * banda de luminosidad, piso de croma, separación CVD, piso de visión normal y
 * contraste contra la superficie). No cambiar un hex sin volver a validar.
 *
 *   light  #8b5cf6 + #f59e0b  → ΔE 36.9 (protan) / 39.3 (normal)
 *   dark   #8b5cf6 + #d97706  → ΔE 32.9 (protan) / 34.1 (normal)
 *
 * El violeta es el mismo en ambos modos; el ámbar baja un paso en oscuro porque
 * amber-500 se sale de la banda de luminosidad contra la superficie #1a1025.
 *
 * Nota: el par morado/fucsia de front-qeb (#8b5cf6 + #d946ef) NO sirve aquí —
 * reprueba con ΔE 1.3 en protanopía. Ahí se usa de forma decorativa sobre una
 * sola serie; en este BI los dos colores cargan identidad (PPTO vs APS).
 */

export const CHART_COLORS = {
  light: {
    /** Serie de referencia: presupuesto / año anterior */
    referencia: '#8b5cf6',
    /** Serie principal: venta real (Monto Total APS) */
    real: '#f59e0b',
  },
  dark: {
    referencia: '#8b5cf6',
    real: '#d97706',
  },
} as const;

/** Superficies de las tarjetas, para calcular contraste de marcas. */
export const CHART_SURFACE = {
  light: '#ffffff',
  dark: '#1a1025',
} as const;

export type ChartMode = keyof typeof CHART_COLORS;

export function chartColors(isDark: boolean) {
  return isDark ? CHART_COLORS.dark : CHART_COLORS.light;
}

/** Ink de ejes y rejilla: recesivo, nunca compite con las marcas. */
export function chartInk(isDark: boolean) {
  return {
    axis: isDark ? '#a1a1aa' : '#71717a',
    grid: isDark ? 'rgba(139, 92, 246, 0.12)' : 'rgba(139, 92, 246, 0.10)',
    label: isDark ? '#e4e4e7' : '#3f3f46',
    cursor: isDark ? 'rgba(139, 92, 246, 0.10)' : 'rgba(139, 92, 246, 0.06)',
  };
}

/**
 * Color de la píldora de porcentaje. Es un color de estado (cumplimiento),
 * reservado — no se reutiliza como color de serie.
 */
export function pctPillClasses(pct: number): string {
  if (pct >= 90) return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30';
  if (pct >= 70) return 'bg-lime-500/15 text-lime-700 dark:text-lime-300 ring-1 ring-lime-500/30';
  if (pct >= 50) return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30';
  return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/30';
}
