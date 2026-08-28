import type { ConteoNombre } from './historial';

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

export type Dimension = 'plaza' | 'digital' | 'asesor' | 'cliente' | 'mueble' | 'categoria';
