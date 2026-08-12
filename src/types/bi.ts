/**
 * Tipos del BI de ventas.
 *
 * Estas interfaces son el contrato entre la UI y la capa de datos. Hoy las
 * alimentan los mocks de `src/mocks/`; cuando exista `bi-back` solo cambia el
 * origen, no los componentes.
 */

/** Las tres fuentes de datos del filtro BASE. */
export type BaseDatos = 'CIMU' | 'Trade' | 'SAP';

export interface FiltrosResumen {
  /** `null` = "Todas" */
  base: BaseDatos | null;
  /** `null` = "Todos" */
  cliente: string | null;
  anio: number;
  /** 1–12; `null` = año completo */
  mes: number | null;
}

/** Un mes en la comparación contra presupuesto. */
export interface VentaVsPpto {
  /** 1–12 */
  mes: number;
  /** "ENE", "FEB", … */
  etiqueta: string;
  /** Presupuesto del mes */
  ppto: number;
  /** Venta real (Monto Total APS) */
  aps: number;
}

/** Una semana ISO dentro de un año. */
export interface VentaSemana {
  /** 27, 28, … */
  semana: number;
  anio: number;
  /** "Semana 27-2026" */
  etiqueta: string;
  monto: number;
}

/** Una catorcena (periodo de 14 días) comparada contra el año anterior. */
export interface VentaCatorcena {
  /** 1–26 */
  catorcena: number;
  /** "CATORCENA 01" */
  etiqueta: string;
  /** Venta real del año en curso */
  aps: number;
  /** Venta del mismo periodo del año anterior */
  anioAnterior: number;
}

/** Un mes comparado contra el mismo mes del año anterior. */
export interface VentaMensualComparada {
  mes: number;
  etiqueta: string;
  aps: number;
  anioAnterior: number;
}

/** Una de las cuatro tarjetas de KPI. */
export interface Kpi {
  id: string;
  titulo: string;
  /** Valor alcanzado */
  valor: number;
  /** Meta contra la que se compara */
  objetivo: number;
  /** Serie para el sparkline de fondo */
  tendencia: number[];
}

/** Todo lo que pinta la página de Resumen General de Ventas. */
export interface ResumenVentas {
  /** Fecha de último refresh de los datos */
  actualizadoEn: string;
  promedioVentaSemanal: number;
  kpis: Kpi[];
  ventasVsPpto: VentaVsPpto[];
  ventasPorSemana: VentaSemana[];
  ventasPorCatorcena: VentaCatorcena[];
  ventasMensuales: VentaMensualComparada[];
}
