import { useState } from 'react';
import { BarChart3, FileBarChart } from 'lucide-react';
import { ResumenVentasPage } from './features/resumen-ventas/ResumenVentasPage';
import { ReportesPage } from './features/reportes/ReportesPage';
import { cn } from './lib/utils';

type Vista = 'ventas' | 'reportes';

function App() {
  const [vista, setVista] = useState<Vista>('ventas');

  const Tab = ({ v, label, Icon }: { v: Vista; label: string; Icon: typeof BarChart3 }) => (
    <button
      onClick={() => setVista(v)}
      className={cn(
        'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
        vista === v
          ? 'bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white shadow'
          : 'text-purple-700 hover:bg-purple-500/10 dark:text-purple-200'
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );

  return (
    <div className="bg-main-pattern min-h-svh">
      <nav className="sticky top-0 z-30 flex items-center gap-2 border-b border-purple-200/40 bg-white/70 px-4 py-2 backdrop-blur-xl dark:border-purple-900/30 dark:bg-[#140c1f]/70">
        <Tab v="ventas" label="Resumen de Ventas" Icon={BarChart3} />
        <Tab v="reportes" label="Reportes" Icon={FileBarChart} />
      </nav>

      {vista === 'ventas' ? (
        <ResumenVentasPage />
      ) : (
        <div className="p-4 lg:p-6">
          <div className="mx-auto max-w-[1600px]">
            <ReportesPage />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
