import type { FiltrosResumen, ResumenVentas } from '../types/bi';

/**
 * Capa de datos del Resumen General de Ventas.
 *
 * Llama al backend (bi-back), que agrega desde la vista `V_APS_Globales` de QEB.
 * La URL base sale de `VITE_API_URL`; en local cae a http://localhost:3001.
 * El filtrado real (millones de renglones) es responsabilidad del back.
 */
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

function toQuery(filtros: FiltrosResumen): string {
  const p = new URLSearchParams();
  if (filtros.base) p.set('base', filtros.base);
  if (filtros.asesor) p.set('asesor', filtros.asesor);
  p.set('anio', String(filtros.anio));
  if (filtros.mes != null) p.set('mes', String(filtros.mes));
  return p.toString();
}

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`El back respondió ${res.status} en ${path}`);
  return (await res.json()) as T;
}

/** Resumen completo del dashboard, ya filtrado por el back. */
export function getResumenVentas(filtros: FiltrosResumen): Promise<ResumenVentas> {
  return getJSON<ResumenVentas>(`/resumen-ventas?${toQuery(filtros)}`);
}

/** Lista de asesores (columna `U_Asesor`) para el filtro del sidebar. */
export function getAsesores(): Promise<string[]> {
  return getJSON<string[]>('/asesores');
}
