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
  /** Caras antes/después, agregadas sobre todas las caras editadas. null si no aplica. */
  carasAntes: number | null;
  carasDespues: number | null;
  /** Inversión (costo) antes/después, agregada. null si no aplica. */
  invAntes: number | null;
  invDespues: number | null;
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
  /** id de campaña (solo en topCampanias); permite filtrar por servidor. */
  id?: number;
  nombre: string;
  valor: number;
  eventos: number;
}

/** Detalle de una propuesta/campaña + su línea de tiempo completa. */
export interface ContextoHistorial {
  refId: number;
  campania: string | null;
  cliente: string | null;
  asesor: string | null;
  marca: string | null;
  status: string | null;
  descripcion: string | null;
  inversion: number | null;
  eventos: EventoHistorial[];
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
  variacionPorUsuario: VariacionUsuario[];
}

export interface VariacionUsuario {
  nombre: string;
  alzas: number;
  bajas: number;
  neto: number;
}
