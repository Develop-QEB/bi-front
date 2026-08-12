import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartCard, ChartLegend } from './ChartCard';
import { ChartTooltip } from './ChartTooltip';
import { chartColors, chartInk } from '../../lib/chartTheme';
import { cumplimiento, formatAxisMill, formatMill, formatPct } from '../../lib/format';
import { useThemeStore } from '../../store/themeStore';
import type { VentaCatorcena } from '../../types/bi';

/** Ancho mínimo por catorcena para que las barras no se aplasten. */
const ANCHO_POR_CATORCENA = 92;

export function VentasPorCatorcenaChart({
  data,
  className,
}: {
  data: VentaCatorcena[];
  className?: string;
}) {
  const isDark = useThemeStore((s) => s.theme) === 'dark';
  const colores = chartColors(isDark);
  const ink = chartInk(isDark);

  return (
    <ChartCard
      titulo="Ventas por Catorcena (Comparación Año Anterior)"
      className={className}
      leyenda={
        <ChartLegend
          items={[
            { label: 'Ventas Año Anterior', color: colores.referencia },
            { label: 'Monto Total APS', color: colores.real },
          ]}
        />
      }
      tabla={{
        columnas: ['Catorcena', 'Año Anterior', 'Monto Total APS', '% Dif'],
        filas: data.map((d) => [
          d.etiqueta,
          formatMill(d.anioAnterior),
          formatMill(d.aps),
          formatPct(cumplimiento(d.aps, d.anioAnterior)),
        ]),
      }}
    >
      {/* El original tiene scroll horizontal; aquí igual, para no comprimir las barras. */}
      <div className="scrollbar-purple overflow-x-auto px-3">
        <div style={{ minWidth: data.length * ANCHO_POR_CATORCENA }}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ top: 12, right: 8, left: 4, bottom: 4 }} barGap={2}>
              <CartesianGrid stroke={ink.grid} vertical={false} />
              <XAxis
                dataKey="etiqueta"
                tick={{ fill: ink.axis, fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: ink.grid }}
                interval={0}
                angle={-35}
                textAnchor="end"
                height={72}
              />
              <YAxis
                tickFormatter={formatAxisMill}
                tick={{ fill: ink.axis, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={62}
              />
              <Tooltip
                cursor={{ fill: ink.cursor }}
                content={
                  <ChartTooltip
                    extra={(payload) => {
                      const ant = payload.find((p) => p.dataKey === 'anioAnterior')?.value ?? 0;
                      const aps = payload.find((p) => p.dataKey === 'aps')?.value ?? 0;
                      return { etiqueta: '% vs Año Ant', valor: cumplimiento(aps, ant) };
                    }}
                  />
                }
              />
              <Bar
                dataKey="anioAnterior"
                name="Ventas Año Anterior"
                fill={colores.referencia}
                radius={[4, 4, 0, 0]}
                maxBarSize={26}
              />
              <Bar
                dataKey="aps"
                name="Monto Total APS"
                fill={colores.real}
                radius={[4, 4, 0, 0]}
                maxBarSize={26}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </ChartCard>
  );
}
