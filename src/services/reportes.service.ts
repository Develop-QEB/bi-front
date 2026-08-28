import { API_URL } from '../lib/api';
import type { Embudo } from '../types/reportes';

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`El back respondió ${res.status} en ${path}`);
  return (await res.json()) as T;
}

/** Embudo de conversión Solicitud → Propuesta → Campaña. */
export function getEmbudo(): Promise<Embudo> {
  return getJSON<Embudo>('/reportes/embudo');
}
