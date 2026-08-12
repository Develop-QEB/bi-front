/**
 * Periodos del BI: mes, semana y catorcena.
 *
 * `front-qeb` tiene su propio `lib/periodos.ts`; si al conectar el back resulta
 * que la lógica de catorcenas ya vive ahí, conviene unificar en vez de duplicar.
 */

export const MESES = [
  'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
  'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC',
] as const;

export type MesEtiqueta = (typeof MESES)[number];

/** 1 → "ENE". Fuera de rango devuelve cadena vacía. */
export function etiquetaMes(mes: number): string {
  return MESES[mes - 1] ?? '';
}

/** "Semana 27-2026" */
export function etiquetaSemana(semana: number, anio: number): string {
  return `Semana ${semana}-${anio}`;
}

/** "CATORCENA 01" — siempre a dos dígitos, como en el reporte original. */
export function etiquetaCatorcena(catorcena: number): string {
  return `CATORCENA ${String(catorcena).padStart(2, '0')}`;
}
