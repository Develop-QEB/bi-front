import type { ConteoNombre, EventoHistorial } from './historial';

export interface EtapaEmbudo {
  nombre: string;
  valor: number;
  pct: number;
}

export interface Embudo {
  etapas: EtapaEmbudo[];
  solicitud: ConteoNombre[];
  propuesta: ConteoNombre[];
  campania: ConteoNombre[];
  totales: { solicitudes: number; propuestas: number; campanias: number };
}

export interface ConteoMonto {
  nombre: string;
  monto: number;
  caras: number;
  n: number;
}

export type Dimension = 'plaza' | 'digital' | 'asesor' | 'cliente' | 'mueble' | 'categoria' | 'marca' | 'producto';

export interface FiltrosReporte {
  anio: number;
  mes?: number | null;
  plaza?: string | null;
  formato?: string | null;
  mueble?: string | null;
  cliente?: string | null;
  asesor?: string | null;
  meses?: number[];
  catorcenas?: number[];
  semanas?: number[];
  bases?: string[];
  tipos?: string[];
  muebles?: string[]; // Formato: PARABUS/COLUMNA/MACRO (Gran Formato)
  digital?: string[]; // Tradicional/Digital
  plazas?: string[];   // multi-selección de plaza
  clientes?: string[]; // multi-selección de cliente
  asesores?: string[]; // multi-selección de asesor
}

/** Tendencia del ciclo de vida por mes (días promedio por etapa, del historial). */
export interface CicloTendenciaMes {
  mes: number;
  solProp: number | null;   // días creación → "Atendido"
  propAprob: number | null; // días "Atendido" → aprobación
  total: number | null;     // días creación → aprobación
  n: number;
  nAprob: number;
}

export interface OpcionesReporte {
  plaza: string[];
  formato: string[];
  mueble: string[];
  cliente: string[];
  asesor: string[];
}

export type Periodo = 'mes' | 'catorcena' | 'semana';

export interface ConteoPeriodo {
  periodo: number;
  monto: number;
  caras: number;
}

export interface Ciclo {
  etapas: { de: string; a: string; dias: number }[];
  cicloTotalDias: number;
  conversionGlobalPct: number;
  total: number;
}

export interface CampaniaDetalle {
  id: number;
  nombre: string;
  status: string | null;
  totalCaras: number;
  monto: number;
  fechaInicio: string | null;
  fechaFin: string | null;
  fechaCreacion: string | null;
  cliente: string | null;
  asesor: string | null;
}

export interface PuntoImpacto {
  monto: number;
  caras: number;
  campania: string | null;
  usuario: string | null;
  fecha: string;
}
export interface Impacto {
  total: number;
  promedio: number;
  count: number;
  mayor: EventoHistorial | null;
  puntos: PuntoImpacto[];
  ediciones: EventoHistorial[];
}
