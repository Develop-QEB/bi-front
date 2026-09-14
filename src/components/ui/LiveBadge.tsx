import { cn } from '../../lib/utils';
import type { EstadoWS } from '../../services/historial.service';

/** Indicador de conexión en vivo (WebSocket). Punto verde pulsante = conectado. */
export function LiveBadge({ estado, className }: { estado: EstadoWS; className?: string }) {
  const vivo = estado === 'conectado';
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium',
        vivo
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          : 'border-zinc-400/30 bg-zinc-400/10 text-zinc-500 dark:text-zinc-400',
        className
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {vivo && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />}
        <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', vivo ? 'bg-emerald-500' : 'bg-zinc-400')} />
      </span>
      {vivo ? 'En vivo' : 'Sin conexión'}
    </span>
  );
}
