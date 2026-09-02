import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

/**
 * Tarjeta de métrica con barra de gradiente superior — el "sello" visual del
 * dashboard: una fila de estas encabeza cada reporte (Embudo, Variaciones).
 *
 * `accent` elige el color de la barra; se rota a lo largo de la fila para dar el
 * mismo ritmo cromático del prototipo (morado · cyan · naranja · rosa · verde).
 */
export type Accent = 'purple' | 'cyan' | 'orange' | 'pink' | 'green' | 'violet';

const ACCENT_BAR: Record<Accent, string> = {
  purple: 'from-purple-500 to-fuchsia-500',
  cyan: 'from-cyan-400 to-blue-500',
  orange: 'from-amber-400 to-orange-500',
  pink: 'from-pink-500 to-rose-500',
  green: 'from-emerald-400 to-teal-500',
  violet: 'from-violet-500 to-purple-600',
};

/** Orden de rotación de acentos para una fila de tarjetas. */
export const ACCENTS: Accent[] = ['purple', 'violet', 'cyan', 'green', 'orange', 'pink'];

const TONO: Record<'neutral' | 'up' | 'down', string> = {
  neutral: 'text-zinc-800 dark:text-white',
  up: 'text-emerald-600 dark:text-emerald-400',
  down: 'text-rose-600 dark:text-rose-400',
};

export function MetricCard({
  titulo,
  valor,
  sub,
  accent = 'purple',
  tono = 'neutral',
  children,
}: {
  titulo: string;
  valor: ReactNode;
  sub?: ReactNode;
  accent?: Accent;
  tono?: 'neutral' | 'up' | 'down';
  children?: ReactNode;
}) {
  return (
    <article
      className={cn(
        'relative flex flex-col overflow-hidden rounded-2xl border p-4 pt-5 backdrop-blur-xl shadow-xl',
        'border-purple-200/50 bg-white/90 shadow-purple-100/20',
        'dark:border-purple-900/30 dark:bg-[#1a1025]/90 dark:shadow-purple-900/10'
      )}
    >
      {/* Barra de gradiente superior */}
      <span
        aria-hidden
        className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', ACCENT_BAR[accent])}
      />
      <h3 className="text-[11px] font-medium uppercase tracking-wide text-purple-700/80 dark:text-purple-200/80">
        {titulo}
      </h3>
      <p className={cn('mt-1.5 text-2xl font-semibold tabular-nums leading-none lg:text-[1.7rem]', TONO[tono])}>
        {valor}
      </p>
      {sub && <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">{sub}</p>}
      {children}
    </article>
  );
}
