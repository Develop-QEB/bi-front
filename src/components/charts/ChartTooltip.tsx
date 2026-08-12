import { useThemeStore } from '../../store/themeStore';
import { formatMillCurrency, formatPct } from '../../lib/format';

interface TooltipEntry {
  name?: string;
  value?: number;
  color?: string;
  dataKey?: string | number;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  /** Renglón extra opcional, p. ej. el % de cumplimiento. */
  extra?: (payload: TooltipEntry[]) => { etiqueta: string; valor: number } | null;
}

/**
 * Tooltip de las gráficas. Mismo lenguaje visual que el de front-qeb
 * (vidrio, borde morado, blur), adaptado a series múltiples.
 */
export function ChartTooltip({ active, payload, label, extra }: ChartTooltipProps) {
  const isDark = useThemeStore((s) => s.theme) === 'dark';

  if (!active || !payload || payload.length === 0) return null;

  const adicional = extra?.(payload) ?? null;

  return (
    <div
      className={`${
        isDark ? 'border-purple-500/20 bg-[#1a1025]/95' : 'border-purple-200 bg-white/95'
      } z-[9999] min-w-[180px] rounded-xl border p-3 shadow-2xl backdrop-blur-xl`}
    >
      <p
        className={`${
          isDark ? 'border-purple-500/20 text-purple-300' : 'border-purple-200 text-purple-700'
        } mb-2 border-b pb-1 text-sm font-medium`}
      >
        {label}
      </p>

      <ul className="flex flex-col gap-1.5">
        {payload.map((entry) => (
          <li key={String(entry.dataKey)} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span
                aria-hidden
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {entry.name}
              </span>
            </span>
            <span
              className={`text-sm font-semibold tabular-nums ${
                isDark ? 'text-white' : 'text-zinc-800'
              }`}
            >
              {formatMillCurrency(entry.value ?? 0)}
            </span>
          </li>
        ))}

        {adicional && (
          <li
            className={`mt-1 flex items-center justify-between gap-4 border-t pt-1.5 ${
              isDark ? 'border-purple-500/20' : 'border-purple-200'
            }`}
          >
            <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              {adicional.etiqueta}
            </span>
            <span
              className={`text-sm font-semibold tabular-nums ${
                isDark ? 'text-purple-300' : 'text-purple-700'
              }`}
            >
              {formatPct(adicional.valor)}
            </span>
          </li>
        )}
      </ul>
    </div>
  );
}
