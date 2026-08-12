import { Select } from '../ui/select';
import { ThemeToggle } from '../ui/ThemeToggle';
import { cn } from '../../lib/utils';
import { MESES } from '../../lib/periodos';
import type { BaseDatos, FiltrosResumen } from '../../types/bi';

const BASES: BaseDatos[] = ['CIMU', 'Trade', 'SAP'];
const ANIOS = [2027, 2026, 2025];

interface FiltersSidebarProps {
  filtros: FiltrosResumen;
  onChange: (filtros: FiltrosResumen) => void;
  clientes: readonly string[];
}

export function FiltersSidebar({ filtros, onChange, clientes }: FiltersSidebarProps) {
  const set = <K extends keyof FiltrosResumen>(key: K, valor: FiltrosResumen[K]) =>
    onChange({ ...filtros, [key]: valor });

  return (
    <aside className="flex w-full shrink-0 flex-col gap-5 rounded-2xl border border-purple-200/50 bg-white/90 p-5 shadow-xl shadow-purple-100/20 backdrop-blur-xl dark:border-purple-900/30 dark:bg-[#1a1025]/90 dark:shadow-purple-900/10 lg:w-64">
      <div className="flex items-start justify-between gap-2">
        <img
          src="/logo-grupo-imu.png"
          alt="Grupo IMU"
          className="h-12 w-auto object-contain dark:brightness-0 dark:invert"
        />
        <ThemeToggle />
      </div>

      <h1 className="text-lg font-light leading-tight tracking-wide text-purple-700 dark:text-purple-200">
        Resumen General
        <br />
        de Ventas
      </h1>

      <hr className="border-purple-200/60 dark:border-purple-900/40" />

      <Filtro etiqueta="BASE">
        <Select
          value={filtros.base ?? ''}
          onChange={(e) => set('base', (e.target.value || null) as BaseDatos | null)}
          options={[
            { value: '', label: 'Todas' },
            ...BASES.map((b) => ({ value: b, label: b })),
          ]}
        />
      </Filtro>

      <Filtro etiqueta="Cliente">
        <Select
          value={filtros.cliente ?? ''}
          onChange={(e) => set('cliente', e.target.value || null)}
          options={[
            { value: '', label: 'Todos' },
            ...clientes.map((c) => ({ value: c, label: c })),
          ]}
        />
      </Filtro>

      <Filtro etiqueta="Año">
        <div className="grid grid-cols-3 gap-2">
          {ANIOS.map((anio) => (
            <BotonFiltro
              key={anio}
              activo={filtros.anio === anio}
              onClick={() => set('anio', anio)}
            >
              {anio}
            </BotonFiltro>
          ))}
        </div>
      </Filtro>

      <Filtro etiqueta="Mes">
        <div className="grid grid-cols-3 gap-2">
          {MESES.map((mes, i) => {
            const numero = i + 1;
            const activo = filtros.mes === numero;
            return (
              <BotonFiltro
                key={mes}
                activo={activo}
                // Volver a picar el mes activo lo deselecciona → año completo.
                onClick={() => set('mes', activo ? null : numero)}
              >
                {mes}
              </BotonFiltro>
            );
          })}
        </div>
        {filtros.mes !== null && (
          <button
            type="button"
            onClick={() => set('mes', null)}
            className="mt-2 text-xs text-purple-600 underline-offset-2 hover:underline dark:text-purple-300"
          >
            Ver año completo
          </button>
        )}
      </Filtro>
    </aside>
  );
}

function Filtro({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {etiqueta}
      </span>
      {children}
    </div>
  );
}

function BotonFiltro({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={cn(
        'rounded-lg px-2 py-1.5 text-xs font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500',
        activo
          ? 'bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white shadow-md shadow-purple-500/20'
          : 'bg-purple-500/10 text-purple-700 hover:bg-purple-500/20 dark:text-purple-200'
      )}
    >
      {children}
    </button>
  );
}
