import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Objetivos (metas $) mensuales, capturados a mano y guardados SOLO en el front
 * (localStorage). No tocan la base de datos: al recargar siguen ahí, y se pueden
 * editar libremente. Alimentan la barra de PPTO y el cálculo de % de cumplimiento.
 *
 * Clave: `${anio}-${mes}` (mes 1–12). Es una meta global del mes (no por base).
 */
interface ObjetivosState {
  objetivos: Record<string, number>;
  setObjetivo: (anio: number, mes: number, monto: number) => void;
  limpiarAnio: (anio: number) => void;
}

const clave = (anio: number, mes: number) => `${anio}-${mes}`;

export const useObjetivosStore = create<ObjetivosState>()(
  persist(
    (set) => ({
      objetivos: {},
      setObjetivo: (anio, mes, monto) =>
        set((s) => ({ objetivos: { ...s.objetivos, [clave(anio, mes)]: monto } })),
      limpiarAnio: (anio) =>
        set((s) => {
          const next = { ...s.objetivos };
          for (let m = 1; m <= 12; m++) delete next[clave(anio, m)];
          return { objetivos: next };
        }),
    }),
    { name: 'qeb-bi-objetivos' }
  )
);

/** Meta del mes (0 si no se ha capturado). */
export function objetivoDe(objetivos: Record<string, number>, anio: number, mes: number): number {
  return objetivos[clave(anio, mes)] ?? 0;
}
