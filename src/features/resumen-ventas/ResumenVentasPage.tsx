import { useMemo, useState } from 'react';
import { FiltersSidebar } from '../../components/bi/FiltersSidebar';
import { KpiCard, StatTile } from '../../components/bi/KpiCard';
import { VentasVsPptoChart } from '../../components/charts/VentasVsPptoChart';
import { VentasPorSemanaChart } from '../../components/charts/VentasPorSemanaChart';
import { VentasPorCatorcenaChart } from '../../components/charts/VentasPorCatorcenaChart';
import { VentasMensualesChart } from '../../components/charts/VentasMensualesChart';
import { getResumenVentas } from '../../services/resumenVentas.service';
import { CLIENTES_MOCK } from '../../mocks/resumenVentas';
import { formatDate } from '../../lib/utils';
import type { FiltrosResumen } from '../../types/bi';

const FILTROS_INICIALES: FiltrosResumen = {
  base: null,
  cliente: null,
  anio: 2026,
  mes: null,
};

export function ResumenVentasPage() {
  const [filtros, setFiltros] = useState<FiltrosResumen>(FILTROS_INICIALES);

  const datos = useMemo(() => getResumenVentas(filtros, CLIENTES_MOCK), [filtros]);

  return (
    <div className="bg-main-pattern min-h-svh p-4 lg:p-6">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 lg:flex-row lg:gap-6">
        <FiltersSidebar filtros={filtros} onChange={setFiltros} clientes={CLIENTES_MOCK} />

        <main className="min-w-0 flex-1">
          <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
            Datos actualizados el {formatDate(datos.actualizadoEn)}
          </p>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Fila 1 — cumplimiento contra presupuesto + ritmo semanal */}
            <VentasVsPptoChart data={datos.ventasVsPpto} className="lg:col-span-7" />

            <div className="flex flex-col gap-4 lg:col-span-5">
              <StatTile titulo="Promedio Vta. Semanal" valor={datos.promedioVentaSemanal} />
              <VentasPorSemanaChart data={datos.ventasPorSemana} className="flex-1" />
            </div>

            {/* Fila 2 — los cuatro KPI */}
            {datos.kpis.map((kpi) => (
              <div key={kpi.id} className="lg:col-span-3">
                <KpiCard kpi={kpi} />
              </div>
            ))}

            {/* Fila 3 — comparativos contra el año anterior */}
            <VentasPorCatorcenaChart data={datos.ventasPorCatorcena} className="lg:col-span-6" />
            <VentasMensualesChart data={datos.ventasMensuales} className="lg:col-span-6" />
          </div>

          <p className="mt-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
            Cifras de demostración. Los datos reales se conectan cuando esté listo{' '}
            <code className="rounded bg-purple-500/10 px-1 py-0.5">bi-back</code>.
          </p>
        </main>
      </div>
    </div>
  );
}
