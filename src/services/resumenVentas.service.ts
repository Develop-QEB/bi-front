import { authFetch } from '../lib/api';
import type { FiltrosResumen, ResumenVentas } from '../types/bi';

/**
 * Capa de datos del Resumen General de Ventas.
 * Llama al backend (bi-back), que agrega desde la vista `V_APS_Globales` de QEB.
 */

function toQuery(filtros: FiltrosResumen): string {
  const p = new URLSearchParams();
  if (filtros.bases?.length) p.set('bases', filtros.bases.join(','));
  else if (filtros.base) p.set('base', filtros.base);
  if (filtros.tipos?.length) p.set('tipos', filtros.tipos.join(','));
  if (filtros.muebles?.length) p.set('muebles', filtros.muebles.join(','));
  if (filtros.digital?.length) p.set('digital', filtros.digital.join(','));
  if (filtros.asesor) p.set('asesor', filtros.asesor);
  if (filtros.cliente) p.set('cliente', filtros.cliente);
  p.set('anio', String(filtros.anio));
  if (filtros.mes != null) p.set('mes', String(filtros.mes));
  return p.toString();
}

async function getJSON<T>(path: string): Promise<T> {
  const res = await authFetch(path);
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

/** Lista de clientes (columna `U_Cliente`) para el filtro del sidebar. */
export function getClientes(): Promise<string[]> {
  return getJSON<string[]>('/clientes');
}
