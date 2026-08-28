import { useThemeStore } from '../../store/themeStore';
import { cn } from '../../lib/utils';

interface Entry {
  name?: string | number;
  value?: number;
  color?: string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
}

/**
 * Tooltip legible para las gráficas: fondo tipo vidrio con contraste correcto en
 * claro y oscuro (el texto NO hereda el color de la serie, que se perdía sobre el
 * fondo morado). `format` da el texto del valor; `hideLabel` oculta el título.
 */
export function TooltipChart({
  active,
  payload,
  label,
  format,
  hideLabel,
}: {
  active?: boolean;
  payload?: Entry[];
  label?: string | number;
  format?: (value: number, name: string, payload: Record<string, unknown>) => string;
  hideLabel?: boolean;
}) {
  const isDark = useThemeStore((s) => s.theme) === 'dark';
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      className={cn(
        'z-[9999] min-w-[150px] rounded-xl border p-2.5 shadow-2xl backdrop-blur-xl',
        isDark ? 'border-purple-500/25 bg-[#1a1025]/95 text-zinc-100' : 'border-purple-200 bg-white/95 text-zinc-800'
      )}
    >
      {!hideLabel && label != null && label !== '' && (
        <p className={cn('mb-1.5 border-b pb-1 text-xs font-medium', isDark ? 'border-purple-500/20 text-purple-300' : 'border-purple-200 text-purple-700')}>
          {label}
        </p>
      )}
      <ul className="flex flex-col gap-1">
        {payload.map((e, i) => (
          <li key={i} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: e.color }} />
              <span className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>{e.name}</span>
            </span>
            <span className="font-semibold tabular-nums">
              {format ? format(Number(e.value ?? 0), String(e.name ?? ''), e.payload ?? {}) : String(e.value ?? '')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
