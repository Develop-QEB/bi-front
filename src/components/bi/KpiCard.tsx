import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { cn } from '../../lib/utils';
import { cumplimiento, formatMillCurrency, formatPct } from '../../lib/format';
import { pctPillClasses } from '../../lib/chartTheme';
import type { Kpi } from '../../types/bi';

/**
 * Tarjeta de KPI: número héroe + meta + % de cumplimiento, con un sparkline de
 * área de fondo.
 *
 * El sparkline es decorativo (una sola serie, sin eje): da la forma de la
 * tendencia, no valores exactos. Por eso no lleva leyenda ni tooltip — el dato
 * duro son el número grande y el %.
 */
export function KpiCard({ kpi }: { kpi: Kpi }) {
  const pct = cumplimiento(kpi.valor, kpi.objetivo);
  const serie = kpi.tendencia.map((v, i) => ({ i, v }));
  const gradientId = `kpi-grad-${kpi.id}`;

  return (
    <article
      className={cn(
        'relative flex flex-col overflow-hidden rounded-2xl border p-4 backdrop-blur-xl shadow-xl',
        'border-purple-200/50 bg-white/90 shadow-purple-100/20',
        'dark:border-purple-900/30 dark:bg-[#1a1025]/90 dark:shadow-purple-900/10'
      )}
    >
      <h3 className="relative z-10 text-xs font-light tracking-wide text-purple-700 dark:text-purple-200">
        KPI {kpi.titulo}
      </h3>

      {/* Sparkline de fondo */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-20 opacity-70">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={serie} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#a855f7" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke="#a855f7"
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="relative z-10 mt-3 flex flex-1 flex-col justify-end">
        <p className="text-3xl font-semibold tabular-nums leading-none text-zinc-800 dark:text-white">
          {formatMillCurrency(kpi.valor)}
        </p>

        <div className="mt-3 flex items-end justify-between gap-3">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Objetivo: <span className="tabular-nums">{formatMillCurrency(kpi.objetivo)}</span>
          </p>
          <span
            className={cn(
              'shrink-0 rounded-lg px-2 py-1 text-sm font-semibold tabular-nums',
              pctPillClasses(pct)
            )}
          >
            {formatPct(pct)}
          </span>
        </div>
      </div>
    </article>
  );
}

/** Variante compacta: solo un número con su etiqueta (sin gráfica). */
export function StatTile({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <article
      className={cn(
        'flex flex-col justify-center rounded-2xl border px-4 py-3 backdrop-blur-xl shadow-xl',
        'border-purple-200/50 bg-white/90 shadow-purple-100/20',
        'dark:border-purple-900/30 dark:bg-[#1a1025]/90 dark:shadow-purple-900/10'
      )}
    >
      <h3 className="text-xs font-light tracking-wide text-purple-700 dark:text-purple-200">
        {titulo}
      </h3>
      <p className="mt-1 text-2xl font-semibold tabular-nums leading-none text-zinc-800 dark:text-white">
        {formatMillCurrency(valor)}
      </p>
    </article>
  );
}
