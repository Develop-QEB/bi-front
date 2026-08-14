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
import type { VentaMensualComparada } from '../../types/bi';

export function VentasMensualesChart({
  data,
  className,
  mesesSel = [],
  onToggleMes,
}: {
  data: VentaMensualComparada[];
  className?: string;
  mesesSel?: number[];
  onToggleMes?: (mes: number) => void;
}) {
  const isDark = useThemeStore((s) => s.theme) === 'dark';
  const colores = chartColors(isDark);
  const ink = chartInk(isDark);

  const pcts = data.map((d) => cumplimiento(d.aps, d.anioAnterior));
  const topes = data.map((d) => Math.max(d.aps, d.anioAnterior));
  const alClic = (estado: MouseHandlerDataParam) => {
    const item = data.find((d) => d.etiqueta === estado.activeLabel);
    if (item) onToggleMes?.(item.mes);
  };

  return (
    <ChartCard
      titulo="Ventas Mensuales (Comparación Año Anterior)"
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
        columnas: ['Mes', 'Año Anterior', 'Monto Total APS', '% Dif Ventas Año Ant'],
        filas: data.map((d, i) => [
          d.etiqueta,
          formatMill(d.anioAnterior),
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
                  const ant = payload.find((p) => p.dataKey === 'anioAnterior')?.value ?? 0;
                  const aps = payload.find((p) => p.dataKey === 'aps')?.value ?? 0;
                  return { etiqueta: '% Dif Ventas Año Ant', valor: cumplimiento(aps, ant) };
                }}
              />
            }
          />
          <Bar
            dataKey="anioAnterior"
            name="Ventas Año Anterior"
            fill={colores.referencia}
            radius={[4, 4, 0, 0]}
            maxBarSize={22}
          >
            {data.map((d) => (
              <Cell key={`ant-${d.mes}`} fill={colores.referencia} fillOpacity={opacidadBarra(mesesSel, d.mes)} />
            ))}
          </Bar>
          <Bar
            dataKey="aps"
            name="Monto Total APS"
            fill={colores.real}
            radius={[4, 4, 0, 0]}
            maxBarSize={22}
          >
            {data.map((d) => (
              <Cell key={`aps-${d.mes}`} fill={colores.real} fillOpacity={opacidadBarra(mesesSel, d.mes)} />
            ))}
            <LabelList
              dataKey="aps"
              content={makePctPillLabel({ pcts, isDark, topes, barrasPorGrupo: 2 })}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
