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
