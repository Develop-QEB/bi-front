import { resumenVentasMock } from '../mocks/resumenVentas';
import type { FiltrosResumen, ResumenVentas } from '../types/bi';

/**
 * Capa de datos del Resumen General de Ventas.
 *
 * ⚠️ HOY DEVUELVE MOCKS. Cuando exista `bi-back`, esta función se convierte en
 * un `GET /resumen-ventas` con los filtros como query params y NADA MÁS cambia:
 * los componentes ya consumen los tipos de `types/bi.ts`.
 *
 * El filtrado real es responsabilidad del backend (son millones de renglones en
 * CIMU / Trade / SAP). Lo que hace esta función es solo simular que los filtros
 * responden, aplicando un factor determinístico, para poder enseñar la pantalla
 * navegable. No tiene ningún significado de negocio.
 */

/** Peso simulado de cada base sobre el total. */
const FACTOR_BASE: Record<string, number> = {
  CIMU: 0.55,
  Trade: 0.3,
  SAP: 0.15,
};

/** Peso simulado por año, para que cambiar de año se note. */
const FACTOR_ANIO: Record<number, number> = {
  2025: 0.86,
  2026: 1,
  2027: 0.12,
};

function factorCliente(cliente: string | null, clientes: readonly string[]): number {
  if (!cliente) return 1;
  const i = clientes.indexOf(cliente);
  if (i < 0) return 1;
  // 0.28, 0.24, 0.20, … — determinístico, sin aleatoriedad.
  return 0.28 - i * 0.04;
}

function escalar<T extends object>(fila: T, claves: (keyof T)[], f: number): T {
  const copia = { ...fila };
  for (const clave of claves) {
    const valor = copia[clave];
    if (typeof valor === 'number') {
      copia[clave] = (valor * f) as T[keyof T];
    }
  }
  return copia;
}

export function getResumenVentas(
  filtros: FiltrosResumen,
  clientes: readonly string[]
): ResumenVentas {
  const f =
    (filtros.base ? FACTOR_BASE[filtros.base] ?? 1 : 1) *
    (FACTOR_ANIO[filtros.anio] ?? 1) *
    factorCliente(filtros.cliente, clientes);

  const base = resumenVentasMock;

  // NOTA: `filtros.mes` todavía no recorta nada. En el reporte real, elegir mes
  // acota las semanas y catorcenas a ese mes; con mocks no hay de dónde sacar
  // esas semanas, así que se resuelve del lado del back cuando exista.

  return {
    ...base,
    promedioVentaSemanal: base.promedioVentaSemanal * f,
    kpis: base.kpis.map((k) => ({
      ...k,
      valor: k.valor * f,
      objetivo: k.objetivo * f,
    })),
    ventasVsPpto: base.ventasVsPpto.map((d) => escalar(d, ['ppto', 'aps'], f)),
    ventasMensuales: base.ventasMensuales.map((d) => escalar(d, ['anioAnterior', 'aps'], f)),
    ventasPorSemana: base.ventasPorSemana.map((d) => escalar(d, ['monto'], f)),
    ventasPorCatorcena: base.ventasPorCatorcena.map((d) =>
      escalar(d, ['anioAnterior', 'aps'], f)
    ),
  };
}
