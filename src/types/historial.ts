/** Tipos del Historial de Acciones. DEBEN coincidir con bi-back/src/types.ts. */

export type CategoriaAccion =
  | 'eliminacion'
  | 'autorizacion'
  | 'rechazo'
  | 'cambio_estado'
  | 'asignacion'
  | 'creacion'
  | 'post_sap'
  | 'otro';

export interface EventoHistorial {
  id: number;
  fecha: string; // ISO
  tipo: string;
  accion: string;
  categoria: CategoriaAccion;
  usuario: string | null;
  refId: number | null;
  campania: string | null;
  /** Impacto en caras: negativo si quitó, positivo si agregó/aprobó, 0 si n/a. */
  caras: number;
  /** Delta en $ si el detalle lo trae; si no, null. */
  monto: number | null;
  estadoAntes: string | null;
  estadoDespues: string | null;
  descripcion: string;
}

export interface FiltrosHistorial {
  categoria: CategoriaAccion | null;
  campaniaId: number | null;
  usuario: string | null;
  soloImpacto: boolean;
  desde: string | null;
  hasta: string | null;
  limit: number;
}

export interface PuntoActividad {
  fecha: string; // YYYY-MM-DD
  eventos: number;
  carasAgregadas: number;
  carasQuitadas: number;
  neto: number;
}

export interface ConteoNombre {
  nombre: string;
  valor: number;
  eventos: number;
}

export interface ResumenHistorial {
  actualizadoEn: string;
  desde: string;
  hasta: string;
  totalEventos: number;
  carasAgregadas: number;
  carasQuitadas: number;
  netoCaras: number;
  autorizaciones: { total: number; dg: number; dcm: number; rechazos: number; carasAprobadas: number };
  porDia: PuntoActividad[];
  porCategoria: ConteoNombre[];
  topUsuarios: ConteoNombre[];
  topQuitadores: ConteoNombre[];
  topCampanias: ConteoNombre[];
}
