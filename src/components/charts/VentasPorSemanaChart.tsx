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

  // Más reciente arriba, como en el original.
  const ordenado = [...data].sort((a, b) => b.semana - a.semana);

  return (
    <ChartCard
      titulo="Ventas por Semana"
      className={className}
      tabla={{
        columnas: ['Semana', 'Monto'],
        filas: ordenado.map((d) => [d.etiqueta, formatMill(d.monto)]),
      }}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          layout="vertical"
          data={ordenado}
          margin={{ top: 8, right: 104, left: 8, bottom: 4 }}
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
            <LabelList
              dataKey="monto"
              position="right"
              formatter={(v: unknown) => formatMill(Number(v))}
              fill={ink.label}
              fontSize={11}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
