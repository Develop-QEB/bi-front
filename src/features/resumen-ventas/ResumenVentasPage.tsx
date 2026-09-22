import { useEffect, useState } from 'react';
import { Construction, AlertTriangle, Search } from 'lucide-react';
import { FiltersSidebar } from '../../components/bi/FiltersSidebar';
import { KpiCard, StatTile } from '../../components/bi/KpiCard';
import { VentasVsPptoChart } from '../../components/charts/VentasVsPptoChart';
import { VentasPorSemanaChart } from '../../components/charts/VentasPorSemanaChart';
import { VentasPorCatorcenaChart } from '../../components/charts/VentasPorCatorcenaChart';
import { VentasMensualesChart } from '../../components/charts/VentasMensualesChart';
import { Spinner } from '../../components/ui/spinner';
import { LiveBadge } from '../../components/ui/LiveBadge';
import { useLiveRefresh } from '../../hooks/useLiveRefresh';
import { getAsesores, getClientes, getResumenVentas } from '../../services/resumenVentas.service';
import { formatDate } from '../../lib/utils';
import { alternarMes, kpisDeSeleccion } from '../../lib/seleccion';
import type { FiltrosResumen, ResumenVentas } from '../../types/bi';

// Por default: CIMU + Trade, solo Parabús + Columna, Tradicional + Digital.
// (El usuario puede mover cualquiera desde el sidebar.)
const FILTROS_INICIALES: FiltrosResumen = {
  base: null,
  bases: ['CIMU', 'Trade'],
  tipos: [],
  muebles: ['PARABUS', 'COLUMNA'],
  digital: ['Tradicional', 'Digital'],
  asesor: null,
  cliente: null,
  anio: 2026,
  mes: null,
};
const MUEBLE_LBL: Record<string, string> = { PARABUS: 'Parabús', COLUMNA: 'Columna', MACRO: 'Gran Formato' };
const TIPO_LBL: Record<string, string> = { RT: 'Renta', BF: 'Bonificación', IN: 'Intercambio', IM: 'Impresión', CT: 'Cortesía' };

const MESES_AB = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

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
  const [tick, setTick] = useState(0);
  const estadoWS = useLiveRefresh(() => setTick((t) => t + 1));

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
  }, [filtros, tick]);

  return (
    <div className="bg-main-pattern min-h-svh overflow-x-clip p-3 sm:p-4 lg:p-6">
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
              <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-amber-400/50 bg-amber-400/10 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/40 dark:text-amber-200">
                <Construction className="h-4 w-4 shrink-0" />
                <span><b>Pestaña BI en desarrollo y validación.</b> La data presentada podría tener variaciones.</span>
              </div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Datos actualizados el {formatDate(datos.actualizadoEn)}
                  {cargando && <span className="ml-2 opacity-60">· actualizando…</span>}
                </p>
                <LiveBadge estado={estadoWS} />
              </div>

              {(() => {
                const partes = [
                  filtros.bases?.length ? filtros.bases.join(' + ') : 'Todas las bases',
                  filtros.tipos?.length ? filtros.tipos.map((t) => TIPO_LBL[t] ?? t).join(', ') : 'Todos los tipos',
                  filtros.muebles?.length ? filtros.muebles.map((m) => MUEBLE_LBL[m] ?? m).join(', ') : 'Todos los formatos',
                  filtros.digital?.length ? filtros.digital.join(' + ') : 'Trad. + Digital',
                  filtros.asesor ?? 'Todos los asesores',
                  filtros.cliente ?? 'Todos los clientes',
                  `Año ${filtros.anio}`,
                  mesesSel.length ? mesesSel.slice().sort((a, b) => a - b).map((m) => MESES_AB[m - 1]).join(', ') : 'Todos los meses',
                ];
                const personalizado = Boolean(filtros.asesor || filtros.cliente || mesesSel.length || filtros.tipos?.length || filtros.bases?.length || filtros.muebles?.length || filtros.digital?.length);
                return (
                  <div
                    className={
                      personalizado
                        ? 'mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-purple-300/50 bg-purple-500/5 p-3 text-xs text-zinc-600 dark:border-purple-800/40 dark:text-zinc-300'
                        : 'mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-amber-400/60 bg-amber-400/10 p-3 text-xs text-amber-800 dark:border-amber-500/40 dark:text-amber-200'
                    }
                  >
                    {personalizado ? <Search className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
                    <span className="font-semibold">
                      {personalizado ? 'Información filtrada.' : 'La información NO está personalizada/filtrada.'}
                    </span>
                    <span>Contiene:</span>
                    {partes.map((p) => (
                      <span key={p} className="rounded-full bg-black/5 px-2 py-0.5 dark:bg-white/10">{p}</span>
                    ))}
                  </div>
                );
              })()}

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
                Fuente: base de ventas QEB.
              </p>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
