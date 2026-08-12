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
import { ChartCard, ChartLegend } from './ChartCard';
import { ChartTooltip } from './ChartTooltip';
import { makePctPillLabel } from './PctPillLabel';
import { chartColors, chartInk } from '../../lib/chartTheme';
import { cumplimiento, formatAxisMill, formatMill, formatPct } from '../../lib/format';
import { useThemeStore } from '../../store/themeStore';
import type { VentaVsPpto } from '../../types/bi';

export function VentasVsPptoChart({ data, className }: { data: VentaVsPpto[]; className?: string }) {
  const isDark = useThemeStore((s) => s.theme) === 'dark';
  const colores = chartColors(isDark);
  const ink = chartInk(isDark);

  const pcts = data.map((d) => cumplimiento(d.aps, d.ppto));

  return (
    <ChartCard
      titulo="Ventas vs PPTO"
      className={className}
      leyenda={
        <ChartLegend
          items={[
            { label: 'Total PPTO', color: colores.referencia },
            { label: 'Monto Total APS', color: colores.real },
          ]}
        />
      }
      tabla={{
        columnas: ['Mes', 'Total PPTO', 'Monto Total APS', '% Real vs PPTO'],
        filas: data.map((d, i) => [
          d.etiqueta,
          formatMill(d.ppto),
          formatMill(d.aps),
          formatPct(pcts[i]),
        ]),
      }}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 24, right: 12, left: 4, bottom: 4 }} barGap={2}>
          <CartesianGrid stroke={ink.grid} vertical={false} />
          <XAxis
            dataKey="etiqueta"
            tick={{ fill: ink.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: ink.grid }}
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
                  const ppto = payload.find((p) => p.dataKey === 'ppto')?.value ?? 0;
                  const aps = payload.find((p) => p.dataKey === 'aps')?.value ?? 0;
                  return { etiqueta: '% Real vs PPTO', valor: cumplimiento(aps, ppto) };
                }}
              />
            }
          />
          <Bar dataKey="ppto" name="Total PPTO" fill={colores.referencia} radius={[4, 4, 0, 0]} maxBarSize={22} />
          <Bar dataKey="aps" name="Monto Total APS" fill={colores.real} radius={[4, 4, 0, 0]} maxBarSize={22}>
            <LabelList
              dataKey="aps"
              content={makePctPillLabel({
                pcts,
                isDark,
                topes: data.map((d) => Math.max(d.ppto, d.aps)),
                barrasPorGrupo: 2,
              })}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
