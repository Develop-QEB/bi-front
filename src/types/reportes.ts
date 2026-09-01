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
  fechaInicio: string | null;
  fechaFin: string | null;
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
