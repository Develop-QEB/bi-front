import { create } from 'zustand';
import {
  delAsesores,
  delMensual,
  getObjetivos,
  putAsesor,
  putMensual,
  putMensualBulk,
} from '../services/objetivos.service';

/**
 * Objetivos/metas del equipo. Ahora se guardan en la BD propia (bi-back →
 * Hostinger), así son COMPARTIDOS y permanentes (antes eran localStorage por
 * navegador). Se cargan con `cargar(anio)`; cada setter actualiza local
 * (optimista) y lo manda al back.
 *
 * Claves internas (para no romper los componentes): `${anio}-${mes}` y `${anio}|${asesor}`.
 */
interface ObjetivosState {
  objetivos: Record<string, number>;
  asesores: Record<string, number>;
  cargar: (anio: number) => Promise<void>;
  setObjetivo: (anio: number, mes: number, monto: number) => void;
  setObjetivosBulk: (anio: number, montos: number[]) => void;
  setAsesor: (anio: number, asesor: string, monto: number) => void;
  limpiarAnio: (anio: number) => void;
  limpiarAsesores: (anio: number) => void;
}

const claveMes = (anio: number, mes: number) => `${anio}-${mes}`;
const claveAsesor = (anio: number, asesor: string) => `${anio}|${asesor}`;

export const useObjetivosStore = create<ObjetivosState>((set) => ({
  objetivos: {},
  asesores: {},
  cargar: async (anio) => {
    try {
      const d = await getObjetivos(anio);
      set((s) => {
        const objetivos = { ...s.objetivos };
        const asesores = { ...s.asesores };
        for (const k of Object.keys(objetivos)) if (k.startsWith(`${anio}-`)) delete objetivos[k];
        for (const k of Object.keys(asesores)) if (k.startsWith(`${anio}|`)) delete asesores[k];
        for (const [mes, monto] of Object.entries(d.mensual)) objetivos[claveMes(anio, Number(mes))] = Number(monto);
        for (const [asesor, monto] of Object.entries(d.asesores)) asesores[claveAsesor(anio, asesor)] = Number(monto);
        return { objetivos, asesores };
      });
    } catch {
      /* back no disponible: deja lo que haya en memoria */
    }
  },
  setObjetivo: (anio, mes, monto) => {
    set((s) => ({ objetivos: { ...s.objetivos, [claveMes(anio, mes)]: monto } }));
    putMensual(anio, mes, monto).catch(() => {});
  },
  setObjetivosBulk: (anio, montos) => {
    set((s) => {
      const next = { ...s.objetivos };
      montos.forEach((m, i) => (next[claveMes(anio, i + 1)] = m));
      return { objetivos: next };
    });
    putMensualBulk(anio, montos).catch(() => {});
  },
  setAsesor: (anio, asesor, monto) => {
    set((s) => ({ asesores: { ...s.asesores, [claveAsesor(anio, asesor)]: monto } }));
    putAsesor(anio, asesor, monto).catch(() => {});
  },
  limpiarAnio: (anio) => {
    set((s) => {
      const objetivos = { ...s.objetivos };
      for (let m = 1; m <= 12; m++) delete objetivos[claveMes(anio, m)];
      return { objetivos };
    });
    delMensual(anio).catch(() => {});
  },
  limpiarAsesores: (anio) => {
    set((s) => {
      const asesores = { ...s.asesores };
      for (const k of Object.keys(asesores)) if (k.startsWith(`${anio}|`)) delete asesores[k];
      return { asesores };
    });
    delAsesores(anio).catch(() => {});
  },
}));

/** Meta del mes (0 si no se ha capturado). */
export function objetivoDe(objetivos: Record<string, number>, anio: number, mes: number): number {
  return objetivos[claveMes(anio, mes)] ?? 0;
}

/** Objetivo anual = suma de los 12 meses. */
export function objetivoAnual(objetivos: Record<string, number>, anio: number): number {
  let t = 0;
  for (let m = 1; m <= 12; m++) t += objetivoDe(objetivos, anio, m);
  return t;
}

/** Objetivo anual asignado a un asesor (0 si no). */
export function asesorObjetivoDe(asesores: Record<string, number>, anio: number, asesor: string): number {
  return asesores[claveAsesor(anio, asesor)] ?? 0;
}
