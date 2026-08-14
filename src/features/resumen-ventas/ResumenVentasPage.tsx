import { useEffect, useState } from 'react';
import { FiltersSidebar } from '../../components/bi/FiltersSidebar';
import { KpiCard, StatTile } from '../../components/bi/KpiCard';
import { VentasVsPptoChart } from '../../components/charts/VentasVsPptoChart';
import { VentasPorSemanaChart } from '../../components/charts/VentasPorSemanaChart';
import { VentasPorCatorcenaChart } from '../../components/charts/VentasPorCatorcenaChart';
import { VentasMensualesChart } from '../../components/charts/VentasMensualesChart';
import { Spinner } from '../../components/ui/spinner';
import { getAsesores, getClientes, getResumenVentas } from '../../services/resumenVentas.service';
import { formatDate } from '../../lib/utils';
import { alternarMes, kpisDeSeleccion } from '../../lib/seleccion';
import type { FiltrosResumen, ResumenVentas } from '../../types/bi';

const FILTROS_INICIALES: FiltrosResumen = {
  base: null,
  asesor: null,
  cliente: null,
  anio: 2026,
  mes: null,
};

export function ResumenVentasPage() {
  const [filtros, setFiltros] = useState<FiltrosResumen>(FILTROS_INICIALES);
  // Meses seleccionados (1–12). Vacío = todo el año. Es selección de cliente:
  // NO re-consulta al back (los datos ya vienen del año completo); solo recalcula
  // KPIs y resalta barras al instante.
  const [mesesSel, setMesesSel] = useState<number[]>([]);
  const [asesores, setAsesores] = useState<readonly string[]>([]);
  const [clientes, setClientes] = useState<readonly string[]>([]);
  const [datos, setDatos] = useState<ResumenVentas | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const toggleMes = (mes: number) => setMesesSel((prev) => alternarMes(prev, mes));
  const limpiarMeses = () => setMesesSel([]);

  // Listas de asesores y clientes para los filtros (una sola vez).
  useEffect(() => {
    getAsesores().then(setAsesores).catch(() => setAsesores([]));
    getClientes().then(setClientes).catch(() => setClientes([]));
  }, []);

  // Resumen: se recarga cada vez que cambian los filtros. Mantiene los datos
  // previos en pantalla mientras llega la nueva respuesta ("actualizando…").
  useEffect(() => {
    let vivo = true;
    setCargando(true);
    setError(null);
    getResumenVentas(filtros)
      .then((d) => vivo && setDatos(d))
      .catch((e: unknown) => vivo && setError(e instanceof Error ? e.message : 'Error al cargar'))
      .finally(() => {
        if (vivo) setCargando(false);
      });
    return () => {
      vivo = false;
    };
  }, [filtros]);

  return (
    <div className="bg-main-pattern min-h-svh p-4 lg:p-6">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 lg:flex-row lg:gap-6">
        <FiltersSidebar
          filtros={filtros}
          onChange={setFiltros}
          asesores={asesores}
          clientes={clientes}
          mesesSel={mesesSel}
          onToggleMes={toggleMes}
          onClearMeses={limpiarMeses}
        />

        <main className="min-w-0 flex-1">
          {error ? (
            <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              No se pudo cargar la información: {error}.
              <br />
              ¿Está corriendo el back (<code>bi-back</code>) en {import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}?
            </div>
          ) : !datos ? (
            <div className="flex h-64 items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
                Datos actualizados el {formatDate(datos.actualizadoEn)}
                {cargando && <span className="ml-2 opacity-60">· actualizando…</span>}
              </p>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                {/* Fila 1 — cumplimiento contra presupuesto + ritmo semanal */}
                <VentasVsPptoChart
                  data={datos.ventasVsPpto}
                  mesesSel={mesesSel}
                  onToggleMes={toggleMes}
                  className="lg:col-span-7"
                />

                <div className="flex flex-col gap-4 lg:col-span-5">
                  <StatTile titulo="Promedio Vta. Semanal" valor={datos.promedioVentaSemanal} />
                  <VentasPorSemanaChart data={datos.ventasPorSemana} className="flex-1" />
                </div>

                {/* Fila 2 — los cuatro KPI (reflejan los meses seleccionados) */}
                {kpisDeSeleccion(datos, mesesSel).map((kpi) => (
                  <div key={kpi.id} className="lg:col-span-3">
                    <KpiCard kpi={kpi} />
                  </div>
                ))}

                {/* Fila 3 — comparativos contra el año anterior */}
                <VentasPorCatorcenaChart
                  data={datos.ventasPorCatorcena}
                  mesesSel={mesesSel}
                  onToggleMes={toggleMes}
                  className="lg:col-span-6"
                />
                <VentasMensualesChart
                  data={datos.ventasMensuales}
                  mesesSel={mesesSel}
                  onToggleMes={toggleMes}
                  className="lg:col-span-6"
                />
              </div>

              <p className="mt-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
                Fuente: vista{' '}
                <code className="rounded bg-purple-500/10 px-1 py-0.5">V_APS_Globales</code> (QEB) vía bi-back.
              </p>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
