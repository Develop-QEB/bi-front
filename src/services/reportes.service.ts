import { API_URL } from '../lib/api';
import type { ConteoMonto, Dimension, Embudo } from '../types/reportes';

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`El back respondió ${res.status} en ${path}`);
  return (await res.json()) as T;
}

/** Embudo de conversión Solicitud → Propuesta → Campaña. */
export function getEmbudo(): Promise<Embudo> {
  return getJSON<Embudo>('/reportes/embudo');
}

/** Distribución de monto/caras por dimensión (plaza, asesor, cliente, mueble…). */
export function getDistribucion(dim: Dimension, anio = 2026): Promise<ConteoMonto[]> {
  return getJSON<ConteoMonto[]>(`/reportes/distribucion?dim=${dim}&anio=${anio}`);
}
