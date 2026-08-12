import type {
  Kpi,
  ResumenVentas,
  VentaCatorcena,
  VentaMensualComparada,
  VentaSemana,
  VentaVsPpto,
} from '../types/bi';

/**
 * DATOS MOCK — aproximados a partir de la captura del Power BI de Grupo IMU
 * ("Resumen General de Ventas", datos al 10/08/2026).
 *
 * Las cifras se leyeron de una foto de pantalla, así que son PLAUSIBLES pero no
 * exactas. Sirven para armar y revisar el layout; los números reales llegan
 * cuando se conecte la base. No usar para nada que no sea maquetar.
 */

const MILL = 1_000_000;

/**
 * Ventas vs PPTO. El año va en curso (corte a agosto 2026), por eso el
 * presupuesto está cargado los 12 meses pero la venta real cae a partir de
 * septiembre — eso es lo que hace que el % de cumplimiento se desplome al final.
 */
export const ventasVsPpto: VentaVsPpto[] = [
  { mes: 1,  etiqueta: 'ENE', ppto: 54 * MILL,  aps: 49 * MILL },
  { mes: 2,  etiqueta: 'FEB', ppto: 72 * MILL,  aps: 69 * MILL },
  { mes: 3,  etiqueta: 'MAR', ppto: 82 * MILL,  aps: 65 * MILL },
  { mes: 4,  etiqueta: 'ABR', ppto: 89 * MILL,  aps: 75 * MILL },
  { mes: 5,  etiqueta: 'MAY', ppto: 168 * MILL, aps: 130 * MILL },
  { mes: 6,  etiqueta: 'JUN', ppto: 124 * MILL, aps: 85 * MILL },
  { mes: 7,  etiqueta: 'JUL', ppto: 112 * MILL, aps: 62 * MILL },
  { mes: 8,  etiqueta: 'AGO', ppto: 85 * MILL,  aps: 46 * MILL },
  { mes: 9,  etiqueta: 'SEP', ppto: 87 * MILL,  aps: 29 * MILL },
  { mes: 10, etiqueta: 'OCT', ppto: 106 * MILL, aps: 22 * MILL },
  { mes: 11, etiqueta: 'NOV', ppto: 87 * MILL,  aps: 18 * MILL },
  { mes: 12, etiqueta: 'DIC', ppto: 93 * MILL,  aps: 19 * MILL },
];

export const ventasPorSemana: VentaSemana[] = [
  { semana: 27, anio: 2026, etiqueta: 'Semana 27-2026', monto: 15 * MILL },
  { semana: 28, anio: 2026, etiqueta: 'Semana 28-2026', monto: 14 * MILL },
  { semana: 29, anio: 2026, etiqueta: 'Semana 29-2026', monto: 20 * MILL },
  { semana: 30, anio: 2026, etiqueta: 'Semana 30-2026', monto: 27 * MILL },
  { semana: 31, anio: 2026, etiqueta: 'Semana 31-2026', monto: 21 * MILL },
  // Semana en curso al corte: por eso va tan abajo.
  { semana: 32, anio: 2026, etiqueta: 'Semana 32-2026', monto: 5 * MILL },
];

export const ventasPorCatorcena: VentaCatorcena[] = [
  { catorcena: 1, etiqueta: 'CATORCENA 01', anioAnterior: 19.1 * MILL, aps: 23.7 * MILL },
  { catorcena: 2, etiqueta: 'CATORCENA 02', anioAnterior: 24.6 * MILL, aps: 20.6 * MILL },
  { catorcena: 3, etiqueta: 'CATORCENA 03', anioAnterior: 21.5 * MILL, aps: 31.7 * MILL },
  { catorcena: 4, etiqueta: 'CATORCENA 04', anioAnterior: 25.1 * MILL, aps: 32.9 * MILL },
  { catorcena: 5, etiqueta: 'CATORCENA 05', anioAnterior: 29.1 * MILL, aps: 34.0 * MILL },
  { catorcena: 6, etiqueta: 'CATORCENA 06', anioAnterior: 34.4 * MILL, aps: 37.9 * MILL },
  { catorcena: 7, etiqueta: 'CATORCENA 07', anioAnterior: 25.6 * MILL, aps: 33.9 * MILL },
  { catorcena: 8, etiqueta: 'CATORCENA 08', anioAnterior: 37.5 * MILL, aps: 40.1 * MILL },
];

export const ventasMensuales: VentaMensualComparada[] = [
  { mes: 1,  etiqueta: 'ENE', anioAnterior: 48 * MILL,  aps: 49 * MILL },
  { mes: 2,  etiqueta: 'FEB', anioAnterior: 50 * MILL,  aps: 69 * MILL },
  { mes: 3,  etiqueta: 'MAR', anioAnterior: 57 * MILL,  aps: 65 * MILL },
  { mes: 4,  etiqueta: 'ABR', anioAnterior: 66 * MILL,  aps: 75 * MILL },
  { mes: 5,  etiqueta: 'MAY', anioAnterior: 104 * MILL, aps: 130 * MILL },
  { mes: 6,  etiqueta: 'JUN', anioAnterior: 61 * MILL,  aps: 85 * MILL },
  { mes: 7,  etiqueta: 'JUL', anioAnterior: 65 * MILL,  aps: 62 * MILL },
  { mes: 8,  etiqueta: 'AGO', anioAnterior: 59 * MILL,  aps: 46 * MILL },
  { mes: 9,  etiqueta: 'SEP', anioAnterior: 49 * MILL,  aps: 29 * MILL },
  { mes: 10, etiqueta: 'OCT', anioAnterior: 87 * MILL,  aps: 22 * MILL },
  { mes: 11, etiqueta: 'NOV', anioAnterior: 76 * MILL,  aps: 18 * MILL },
  { mes: 12, etiqueta: 'DIC', anioAnterior: 80 * MILL,  aps: 19 * MILL },
];

const kpis: Kpi[] = [
  {
    id: 'acum-vs-ppto',
    titulo: 'Ventas Acum vs PPTO',
    valor: 740.2 * MILL,
    objetivo: 1187.3 * MILL,
    tendencia: [49, 69, 65, 75, 130, 85, 62, 46, 29, 22, 18, 19],
  },
  {
    id: 'mensual-vs-ppto',
    titulo: 'Ventas Mensual vs PPTO',
    valor: 18.2 * MILL,
    objetivo: 87.2 * MILL,
    tendencia: [15, 14, 20, 27, 21, 5],
  },
  {
    id: 'acum-vs-anio-ant',
    titulo: 'Ventas Acum vs Año Ant',
    valor: 740.2 * MILL,
    objetivo: 886.5 * MILL,
    tendencia: [48, 50, 57, 66, 104, 61, 65, 59, 49, 87, 76, 80],
  },
  {
    id: 'mensual-vs-anio-ant',
    titulo: 'Ventas Mensual vs Año Ant',
    valor: 18.2 * MILL,
    objetivo: 76.6 * MILL,
    tendencia: [12, 18, 15, 22, 19, 14, 18],
  },
];

export const CLIENTES_MOCK = [
  'Bepensa',
  'Coca-Cola FEMSA',
  'Grupo Bimbo',
  'Liverpool',
  'Telcel',
] as const;

export const resumenVentasMock: ResumenVentas = {
  actualizadoEn: '2026-08-10',
  promedioVentaSemanal: 19.3 * MILL,
  kpis,
  ventasVsPpto,
  ventasPorSemana,
  ventasPorCatorcena,
  ventasMensuales,
};
