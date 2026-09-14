import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartCard } from './ChartCard';
import { ChartTooltip } from './ChartTooltip';
import { chartColors, chartInk } from '../../lib/chartTheme';
import { formatAxisMill, formatMill } from '../../lib/format';
import { useThemeStore } from '../../store/themeStore';
import type { VentaSemana } from '../../types/bi';

/**
 * Una sola serie: no lleva leyenda (el título ya la nombra) y sí lleva
 * etiquetas directas al final de cada barra.
 */
export function VentasPorSemanaChart({
  data,
  className,
}: {
  data: VentaSemana[];
  className?: string;
}) {
  const isDark = useThemeStore((s) => s.theme) === 'dark';
  const colores = chartColors(isDark);
  const ink = chartInk(isDark);

  // Variación vs la semana anterior (comparativa semanal de montos).
  const porSemana = new Map(data.map((d) => [`${d.anio}-${d.semana}`, d.monto]));
  const conDelta = data.map((d) => {
    const prev = porSemana.get(`${d.anio}-${d.semana - 1}`);
    const deltaAbs = prev != null ? d.monto - prev : null;
    const deltaPct = prev != null && prev !== 0 ? Math.round((deltaAbs! / prev) * 1000) / 10 : null;
    return { ...d, deltaAbs, deltaPct };
  });

  // Más reciente arriba, como en el original.
  const ordenado = [...conDelta].sort((a, b) => b.semana - a.semana);

  // Etiqueta a la derecha de cada barra: monto + variación vs semana previa.
  const LabelDelta = (p: { x?: number; y?: number; width?: number; height?: number; index?: number }) => {
    const row = ordenado[p.index ?? 0];
    if (!row || p.x == null || p.y == null) return null;
    const cx = p.x + (p.width ?? 0) + 6;
    const cy = p.y + (p.height ?? 0) / 2;
    const d = row.deltaPct;
    const col = d == null ? ink.label : d > 0 ? '#22c55e' : d < 0 ? '#f43f5e' : ink.axis;
    return (
      <text x={cx} y={cy} fill={ink.label} fontSize={11} dominantBaseline="middle">
        {formatMill(row.monto)}
        {d != null && <tspan fill={col}>{`  ${d > 0 ? '▲' : d < 0 ? '▼' : ''}${d > 0 ? '+' : ''}${d}%`}</tspan>}
      </text>
    );
  };

  return (
    <ChartCard
      titulo="Ventas por Semana"
      className={className}
      tabla={{
        columnas: ['Semana', 'Monto', 'Var. vs sem. previa'],
        filas: ordenado.map((d) => [d.etiqueta, formatMill(d.monto), d.deltaPct == null ? '—' : `${d.deltaPct > 0 ? '+' : ''}${d.deltaPct}%`]),
      }}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          layout="vertical"
          data={ordenado}
          margin={{ top: 8, right: 150, left: 8, bottom: 4 }}
        >
          <CartesianGrid stroke={ink.grid} horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={formatAxisMill}
            tick={{ fill: ink.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="etiqueta"
            tick={{ fill: ink.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={110}
          />
          <Tooltip cursor={{ fill: ink.cursor }} content={<ChartTooltip />} />
          <Bar
            dataKey="monto"
            name="Ventas"
            fill={colores.referencia}
            radius={[0, 4, 4, 0]}
            maxBarSize={22}
          >
            <LabelList dataKey="monto" position="right" content={LabelDelta} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
