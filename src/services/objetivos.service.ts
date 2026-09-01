import { API_URL } from '../lib/api';

export interface ObjetivosData {
  anio: number;
  mensual: Record<number, number>;
  asesores: Record<string, number>;
}

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, opts);
  if (!res.ok) throw new Error(`El back respondió ${res.status} en ${path}`);
  return (await res.json()) as T;
}
const putJSON = (path: string, body: unknown) =>
  req(path, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

export const getObjetivos = (anio: number) => req<ObjetivosData>(`/objetivos?anio=${anio}`);
export const putMensual = (anio: number, mes: number, monto: number) => putJSON('/objetivos/mensual', { anio, mes, monto });
export const putMensualBulk = (anio: number, montos: number[]) => putJSON('/objetivos/mensual-bulk', { anio, montos });
export const putAsesor = (anio: number, asesor: string, monto: number) => putJSON('/objetivos/asesor', { anio, asesor, monto });
export const delMensual = (anio: number) => req(`/objetivos/mensual?anio=${anio}`, { method: 'DELETE' });
export const delAsesores = (anio: number) => req(`/objetivos/asesor?anio=${anio}`, { method: 'DELETE' });
