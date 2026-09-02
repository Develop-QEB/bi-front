import { useState } from 'react';
import { BarChart3, Filter, Target, TrendingUp } from 'lucide-react';
import { ResumenVentasPage } from './features/resumen-ventas/ResumenVentasPage';
import { EmbudoPage, ObjetivosPage, VariacionesPage } from './features/reportes/ReportesPage';
import { ThemeToggle } from './components/ui/ThemeToggle';
import { cn } from './lib/utils';

type Vista = 'bi' | 'variaciones' | 'embudo' | 'objetivos';

const TABS = [
  { v: 'bi', label: 'BI', Icon: BarChart3 },
  { v: 'variaciones', label: 'Variaciones e impacto', Icon: TrendingUp },
  { v: 'embudo', label: 'Embudo', Icon: Filter },
  { v: 'objetivos', label: 'Objetivos', Icon: Target },
] as const;

function App() {
  const [vista, setVista] = useState<Vista>('bi');

  return (
    <div className="bg-main-pattern min-h-svh">
      <header className="sticky top-0 z-30 border-b border-purple-200/40 bg-white/70 backdrop-blur-xl dark:border-purple-900/30 dark:bg-[#140c1f]/70">
        <div className="mx-auto max-w-[1600px] px-4 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img src="/imagotipo.png" alt="QEB" className="h-9 w-9 rounded-lg object-contain" />
              <div>
                <h1 className="text-base font-semibold leading-tight text-zinc-800 dark:text-white">Reportes de Ventas</h1>
                <p className="hidden text-[11px] text-zinc-500 dark:text-zinc-400 sm:block">
                  Cambios de estatus y variaciones del historial · Solicitud → Propuesta → Campaña
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Datos en vivo · QEB
              </span>
              <ThemeToggle />
            </div>
          </div>

          <nav className="mt-2.5 flex flex-wrap items-center gap-2">
            {TABS.map((t) => (
              <button
                key={t.v}
                onClick={() => setVista(t.v)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                  vista === t.v
                    ? 'bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white shadow'
                    : 'text-purple-700 hover:bg-purple-500/10 dark:text-purple-200'
                )}
              >
                <t.Icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {vista === 'bi' ? (
        <ResumenVentasPage />
      ) : (
        <div className="p-4 lg:p-6">
          <div className="mx-auto max-w-[1600px]">
            {vista === 'variaciones' && <VariacionesPage />}
            {vista === 'embudo' && <EmbudoPage />}
            {vista === 'objetivos' && <ObjetivosPage />}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
