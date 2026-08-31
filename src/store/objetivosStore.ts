import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Objetivos (metas $) guardados SOLO en el front (localStorage). No tocan la BD.
 *
 * Dos partes:
 *  - `objetivos`: meta mensual del año (paso 1). Clave `${anio}-${mes}` (mes 1–12).
 *    El objetivo anual = suma de los 12 meses.
 *  - `asesores`: reparto del objetivo anual entre el equipo (paso 2). Clave
 *    `${anio}|${asesor}` → monto anual (MXN) de ese asesor.
 */
interface ObjetivosState {
  objetivos: Record<string, number>;
  asesores: Record<string, number>;
  setObjetivo: (anio: number, mes: number, monto: number) => void;
  setObjetivosBulk: (anio: number, montos: number[]) => void; // 12 meses
  setAsesor: (anio: number, asesor: string, monto: number) => void;
  limpiarAnio: (anio: number) => void;
  limpiarAsesores: (anio: number) => void;
}

const claveMes = (anio: number, mes: number) => `${anio}-${mes}`;
const claveAsesor = (anio: number, asesor: string) => `${anio}|${asesor}`;

export const useObjetivosStore = create<ObjetivosState>()(
  persist(
    (set) => ({
      objetivos: {},
      asesores: {},
      setObjetivo: (anio, mes, monto) =>
        set((s) => ({ objetivos: { ...s.objetivos, [claveMes(anio, mes)]: monto } })),
      setObjetivosBulk: (anio, montos) =>
        set((s) => {
          const next = { ...s.objetivos };
          montos.forEach((m, i) => (next[claveMes(anio, i + 1)] = m));
          return { objetivos: next };
        }),
      setAsesor: (anio, asesor, monto) =>
        set((s) => ({ asesores: { ...s.asesores, [claveAsesor(anio, asesor)]: monto } })),
      limpiarAnio: (anio) =>
        set((s) => {
          const objetivos = { ...s.objetivos };
          for (let m = 1; m <= 12; m++) delete objetivos[claveMes(anio, m)];
          return { objetivos };
        }),
      limpiarAsesores: (anio) =>
        set((s) => {
          const asesores = { ...s.asesores };
          for (const k of Object.keys(asesores)) if (k.startsWith(`${anio}|`)) delete asesores[k];
          return { asesores };
        }),
    }),
    { name: 'qeb-bi-objetivos' }
  )
);

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
