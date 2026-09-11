import { API_URL } from '../lib/api';
import type { CampaniaDetalle, Ciclo, ConteoMonto, ConteoPeriodo, Dimension, Embudo, FiltrosReporte, OpcionesReporte, Periodo } from '../types/reportes';

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`El back respondió ${res.status} en ${path}`);
  return (await res.json()) as T;
}

/** Query string de la barra de filtros compartida (Embudo). */
function qsFiltros(f: Partial<FiltrosReporte>): string {
  const p = new URLSearchParams();
  if (f.anio) p.set('anio', String(f.anio));
  if (f.mes) p.set('mes', String(f.mes));
  if (f.plaza) p.set('plaza', f.plaza);
  if (f.formato) p.set('formato', f.formato);
  if (f.mueble) p.set('mueble', f.mueble);
  if (f.cliente) p.set('cliente', f.cliente);
  if (f.asesor) p.set('asesor', f.asesor);
  return p.toString();
}

const ANIO_DEF = 2026;

/** Embudo de conversión Solicitud → Propuesta → Campaña. */
export function getEmbudo(f: Partial<FiltrosReporte> = { anio: ANIO_DEF }): Promise<Embudo> {
  return getJSON<Embudo>(`/reportes/embudo?${qsFiltros(f)}`);
}

/** Distribución de monto/caras por dimensión (plaza, asesor, cliente, mueble…). */
export function getDistribucion(dim: Dimension, f: Partial<FiltrosReporte> = { anio: ANIO_DEF }): Promise<ConteoMonto[]> {
  return getJSON<ConteoMonto[]>(`/reportes/distribucion?dim=${dim}&${qsFiltros(f)}`);
}

/** Ventas reales por período (mes/catorcena/semana) con filtros. */
export function getVentasPeriodo(periodo: Periodo, f: Partial<FiltrosReporte> = { anio: ANIO_DEF }): Promise<ConteoPeriodo[]> {
  return getJSON<ConteoPeriodo[]>(`/reportes/ventas-periodo?periodo=${periodo}&${qsFiltros(f)}`);
}

export const getCiclo = (f: Partial<FiltrosReporte> = { anio: ANIO_DEF }) => getJSON<Ciclo>(`/reportes/ciclo?${qsFiltros(f)}`);
export const getCampanias = (limit = 120, f: Partial<FiltrosReporte> = { anio: ANIO_DEF }) =>
  getJSON<CampaniaDetalle[]>(`/reportes/campanias?limit=${limit}&${qsFiltros(f)}`);

/** Valores distintos para los dropdowns de la barra de filtros. */
export const getOpciones = (anio = ANIO_DEF) => getJSON<OpcionesReporte>(`/reportes/opciones?anio=${anio}`);
