import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MouseHandlerDataParam } from 'recharts';
import { ChartCard, ChartLegend } from './ChartCard';
import { ChartTooltip } from './ChartTooltip';
import { makePctPillLabel } from './PctPillLabel';
import { chartColors, chartInk } from '../../lib/chartTheme';
import { cumplimiento, formatAxisMill, formatMill, formatPct } from '../../lib/format';
import { opacidadBarra } from '../../lib/seleccion';
import { useThemeStore } from '../../store/themeStore';
import type { VentaVsPpto } from '../../types/bi';

export function VentasVsPptoChart({
  data,
  className,
  mesesSel = [],
  onToggleMes,
}: {
  data: VentaVsPpto[];
  className?: string;
  mesesSel?: number[];
  onToggleMes?: (mes: number) => void;
}) {
  const isDark = useThemeStore((s) => s.theme) === 'dark';
  const colores = chartColors(isDark);
  const ink = chartInk(isDark);

  const pcts = data.map((d) => cumplimiento(d.aps, d.ppto));
  const alClic = (estado: MouseHandlerDataParam) => {
    const item = data.find((d) => d.etiqueta === estado.activeLabel);
    if (item) onToggleMes?.(item.mes);
  };

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
        <BarChart
          data={data}
          margin={{ top: 24, right: 12, left: 4, bottom: 4 }}
          barGap={2}
          onClick={alClic}
          style={onToggleMes ? { cursor: 'pointer' } : undefined}
        >
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
            width={88}
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
          <Bar dataKey="ppto" name="Total PPTO" fill={colores.referencia} radius={[4, 4, 0, 0]} maxBarSize={22}>
            {data.map((d) => (
              <Cell key={`ppto-${d.mes}`} fill={colores.referencia} fillOpacity={opacidadBarra(mesesSel, d.mes)} />
            ))}
          </Bar>
          <Bar dataKey="aps" name="Monto Total APS" fill={colores.real} radius={[4, 4, 0, 0]} maxBarSize={22}>
            {data.map((d) => (
              <Cell key={`aps-${d.mes}`} fill={colores.real} fillOpacity={opacidadBarra(mesesSel, d.mes)} />
            ))}
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
