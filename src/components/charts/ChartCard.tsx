import { useState, type ReactNode } from 'react';
import { Table2, BarChart3 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface TableView {
  columnas: string[];
  filas: (string | number)[][];
}

interface ChartCardProps {
  titulo: string;
  children: ReactNode;
  /** Leyenda; obligatoria cuando la gráfica tiene 2+ series. */
  leyenda?: ReactNode;
  /**
   * Vista de tabla equivalente. La identidad de las series nunca puede depender
   * solo del color, así que toda gráfica trae su tabla.
   */
  tabla?: TableView;
  className?: string;
}

export function ChartCard({ titulo, children, leyenda, tabla, className }: ChartCardProps) {
  const [verTabla, setVerTabla] = useState(false);

  return (
    <section
      className={cn(
        'relative flex flex-col overflow-hidden rounded-2xl border backdrop-blur-xl shadow-xl',
        'border-purple-200/50 bg-white/90 shadow-purple-100/20',
        'dark:border-purple-900/30 dark:bg-[#1a1025]/90 dark:shadow-purple-900/10',
        className
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 pt-4 pb-3">
        <h2 className="font-light leading-none tracking-wide text-purple-700 dark:text-purple-200">
          {titulo}
        </h2>
        <div className="flex items-center gap-3">
          {leyenda}
          {tabla && (
            <button
              type="button"
              onClick={() => setVerTabla((v) => !v)}
              title={verTabla ? 'Ver gráfica' : 'Ver tabla'}
              aria-label={verTabla ? 'Ver gráfica' : 'Ver tabla'}
              className="rounded-lg p-1.5 text-purple-600/70 transition-colors hover:bg-purple-500/10 hover:text-purple-700 dark:text-purple-300/70 dark:hover:text-purple-200"
            >
              {verTabla ? <BarChart3 className="h-4 w-4" /> : <Table2 className="h-4 w-4" />}
            </button>
          )}
        </div>
      </header>

      <div className="min-w-0 flex-1 px-2 pb-4">
        {verTabla && tabla ? <DataTable {...tabla} /> : children}
      </div>
    </section>
  );
}

function DataTable({ columnas, filas }: TableView) {
  return (
    <div className="scrollbar-thin max-h-[280px] overflow-auto px-3">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 bg-white/95 dark:bg-[#1a1025]/95">
          <tr>
            {columnas.map((c, i) => (
              <th
                key={c}
                scope="col"
                className={cn(
                  'border-b border-purple-200/60 py-2 pr-3 font-medium text-purple-700 dark:border-purple-900/40 dark:text-purple-200',
                  i === 0 ? 'text-left' : 'text-right'
                )}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, r) => (
            <tr key={r} className="odd:bg-purple-500/[0.03]">
              {fila.map((celda, i) => (
                <td
                  key={i}
                  className={cn(
                    'py-1.5 pr-3 text-zinc-700 dark:text-zinc-300',
                    i === 0 ? 'text-left' : 'text-right tabular-nums'
                  )}
                >
                  {celda}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Leyenda: punto de color + etiqueta en tinta de texto, nunca en el color de la serie. */
export function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white dark:ring-[#1a1025]"
            style={{ backgroundColor: it.color }}
          />
          <span className="text-xs text-zinc-600 dark:text-zinc-400">{it.label}</span>
        </li>
      ))}
    </ul>
  );
}
