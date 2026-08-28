/**
 * Selección de meses del dashboard.
 *
 * Toda la interacción de "iluminar lo relacionado" se reduce a un conjunto de
 * meses seleccionados (`mesesSel`). El mes es el enlace entre el filtro de meses,
 * las catorcenas (cada catorcena pertenece a un mes) y los KPIs:
 *
 *  - Seleccionar meses en el sidebar  → agrega/quita meses.
 *  - Clic en una catorcena            → agrega/quita el mes de esa catorcena
 *                                        (con lo que se iluminan sus catorcenas
 *                                        hermanas del mismo mes).
 *  - Los KPIs y el resaltado de barras se recalculan desde `mesesSel`.
 *
 * `mesesSel` vacío = todo el año (sin filtro ni resaltado).
 */
import type { Kpi, ResumenVentas } from '../types/bi';

const suma = (nums: number[]) => nums.reduce((a, b) => a + b, 0);

/**
 * Recalcula los cuatro KPIs a partir de `datos` (cuyo `ventasVsPpto.ppto` ya trae
 * los objetivos editados). Si hay meses seleccionados, usa solo esos; si no, usa
 * todo el año. Los "Acum" suman; los "Mensual" son el promedio por mes (un mes =
 * ese mes). El % de cumplimiento sale de valor/objetivo en cada KpiCard, así que
 * al editar un objetivo el % cambia solo. `tendencia` (sparkline) se conserva.
 */
export function kpisDeSeleccion(datos: ResumenVentas, mesesSel: number[]): Kpi[] {
  const meses = mesesSel.length ? mesesSel : datos.ventasMensuales.map((m) => m.mes);
  const sel = new Set(meses);
  const apsSel = suma(datos.ventasMensuales.filter((m) => sel.has(m.mes)).map((m) => m.aps));
  const antSel = suma(datos.ventasMensuales.filter((m) => sel.has(m.mes)).map((m) => m.anioAnterior));
  const pptoSel = suma(datos.ventasVsPpto.filter((m) => sel.has(m.mes)).map((m) => m.ppto));
  const n = meses.length || 1;

  const con = (id: string, valor: number, objetivo: number): Kpi => {
    const base = datos.kpis.find((k) => k.id === id);
    return { id, titulo: base?.titulo ?? id, valor, objetivo, tendencia: base?.tendencia ?? [] };
  };

  return [
    con('acum-vs-ppto', apsSel, pptoSel),
    con('mensual-vs-ppto', apsSel / n, pptoSel / n),
    con('acum-vs-anio-ant', apsSel, antSel),
    con('mensual-vs-anio-ant', apsSel / n, antSel / n),
  ];
}

/** Alterna un mes en la selección (lo agrega si falta, lo quita si está). */
export function alternarMes(mesesSel: number[], mes: number): number[] {
  return mesesSel.includes(mes) ? mesesSel.filter((m) => m !== mes) : [...mesesSel, mes];
}

/**
 * Opacidad de una barra según su mes: llena (1) si no hay selección o si su mes
 * está seleccionado; atenuada si hay selección y su mes no está. Así "se ilumina
 * lo relacionado" y lo demás se apaga.
 */
export function opacidadBarra(mesesSel: number[], mes: number): number {
  return mesesSel.length === 0 || mesesSel.includes(mes) ? 1 : 0.22;
}
