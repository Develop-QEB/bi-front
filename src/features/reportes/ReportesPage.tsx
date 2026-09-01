import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts';
import { ClipboardList, Filter, PieChart, Target, TrendingUp } from 'lucide-react';
import { Spinner } from '../../components/ui/spinner';
import { TooltipChart } from '../../components/charts/TooltipChart';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/format';
import { chartInk } from '../../lib/chartTheme';
import { useThemeStore } from '../../store/themeStore';
import { getAsesores, getResumenVentas } from '../../services/resumenVentas.service';
import { getImpacto, getResumenHistorial } from '../../services/historial.service';
import { getCampanias, getCiclo, getDistribucion, getEmbudo, getVentasPeriodo } from '../../services/reportes.service';
import { asesorObjetivoDe, objetivoAnual, objetivoDe, useObjetivosStore } from '../../store/objetivosStore';
import type { ResumenVentas } from '../../types/bi';
import type { ResumenHistorial } from '../../types/historial';
import type { CampaniaDetalle, Ciclo, ConteoMonto, Dimension, Embudo, Impacto, Periodo } from '../../types/reportes';

const ANIO = 2026;

const CARD = cn(
  'rounded-2xl border p-4 backdrop-blur-xl shadow-xl',
  'border-purple-200/50 bg-white/90 shadow-purple-100/20',
  'dark:border-purple-900/30 dark:bg-[#1a1025]/90 dark:shadow-purple-900/10'
);
const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const fmtM = (v: number) => (Math.abs(v) >= 1e6 ? `$${(v / 1e6).toFixed(0)}M` : `$${(v / 1e3).toFixed(0)}k`);
const nf = (n: number) => n.toLocaleString('es-MX');

function StatCard({ titulo, valor, sub, tono = 'neutral' }: { titulo: string; valor: string; sub?: string; tono?: 'neutral' | 'up' | 'down' }) {
  const c = { neutral: 'text-purple-700 dark:text-purple-200', up: 'text-emerald-600 dark:text-emerald-400', down: 'text-rose-600 dark:text-rose-400' }[tono];
  return (
    <article className={CARD}>
      <h3 className="text-xs font-light tracking-wide text-purple-700 dark:text-purple-200">{titulo}</h3>
      <p className={cn('mt-1 text-2xl font-semibold tabular-nums leading-none', c)}>{valor}</p>
      {sub && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{sub}</p>}
    </article>
  );
}

// ============ OBJETIVOS ============
function ObjetivosView() {
  const [modo, setModo] = useState<'definir' | 'avance'>('definir');
  const cargar = useObjetivosStore((s) => s.cargar);
  useEffect(() => {
    cargar(ANIO);
  }, [cargar]);
  return (
    <div className="space-y-4">
      <div className="flex w-fit gap-1 rounded-lg bg-purple-500/10 p-1">
        {(['definir', 'avance'] as const).map((m) => (
          <button key={m} onClick={() => setModo(m)} className={cn('rounded-md px-4 py-1 text-xs font-medium', modo === m ? 'bg-white text-purple-700 shadow dark:bg-[#241633] dark:text-purple-200' : 'text-zinc-500')}>
            {m === 'definir' ? 'Definir objetivos' : 'Avance'}
          </button>
        ))}
      </div>
      {modo === 'definir' ? <DefinirObjetivos /> : <AvanceObjetivos />}
    </div>
  );
}

// --- Definir: Paso 1 (global mensual) + Paso 2 (por asesor) ---
function DefinirObjetivos() {
  const objetivos = useObjetivosStore((s) => s.objetivos);
  const asesoresObj = useObjetivosStore((s) => s.asesores);
  const setObjetivo = useObjetivosStore((s) => s.setObjetivo);
  const setObjetivosBulk = useObjetivosStore((s) => s.setObjetivosBulk);
  const setAsesor = useObjetivosStore((s) => s.setAsesor);
  const limpiarAnio = useObjetivosStore((s) => s.limpiarAnio);
  const limpiarAsesores = useObjetivosStore((s) => s.limpiarAsesores);
  const isDark = useThemeStore((s) => s.theme) === 'dark';
  const ink = chartInk(isDark);

  const [ventas, setVentas] = useState<ResumenVentas | null>(null);
  const [asesores, setAsesores] = useState<readonly string[]>([]);
  const [sharesReal, setSharesReal] = useState<Record<string, number>>({});
  const [anualTarget, setAnualTarget] = useState('');
  const [captura, setCaptura] = useState<'pct' | 'monto'>('pct');

  useEffect(() => {
    getResumenVentas({ base: null, asesor: null, cliente: null, anio: ANIO, mes: null }).then(setVentas).catch(() => {});
    getAsesores().then(setAsesores).catch(() => {});
    getDistribucion('asesor').then((d) => {
      const tot = d.reduce((a, x) => a + x.monto, 0) || 1;
      const m: Record<string, number> = {};
      for (const x of d) m[x.nombre] = x.monto / tot;
      setSharesReal(m);
    }).catch(() => {});
  }, []);

  const realMes = useMemo(() => {
    const map = new Map((ventas?.ventasMensuales ?? []).map((m) => [m.mes, m.aps]));
    return MESES.map((_, i) => map.get(i + 1) ?? 0);
  }, [ventas]);

  const anual = objetivoAnual(objetivos, ANIO);

  const regenerar = () => {
    const total = (Number(anualTarget) || 0) * 1e6;
    if (total <= 0) return;
    const sum = realMes.reduce((a, b) => a + b, 0);
    const shape = sum > 0 ? realMes.map((v) => v / sum) : realMes.map(() => 1 / 12);
    setObjetivosBulk(ANIO, shape.map((s) => Math.round(total * s)));
  };

  const repartirPorVentas = () => {
    for (const a of asesores) setAsesor(ANIO, a, Math.round(anual * (sharesReal[a] ?? 0)));
  };

  const filas = MESES.map((etiqueta, i) => ({ mes: i + 1, etiqueta, objetivo: objetivoDe(objetivos, ANIO, i + 1), real: realMes[i] }));
  const sumAsesores = asesores.reduce((a, x) => a + asesorObjetivoDe(asesoresObj, ANIO, x), 0);

  return (
    <div className="space-y-4">
      {/* PASO 1 */}
      <div className={CARD}>
        <h3 className="mb-1 text-sm font-semibold text-purple-700 dark:text-purple-200">Paso 1 · Objetivo global (mensual)</h3>
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">Captura la meta de cada mes; el objetivo anual se suma solo. O escribe un anual y repártelo según la estacionalidad de las ventas reales.</p>
        <div className="mb-3 flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] text-zinc-400">Objetivo anual (MDP)</span>
            <input type="number" min="0" value={anualTarget} onChange={(e) => setAnualTarget(e.target.value)} placeholder="0" className="w-32 rounded-md border border-purple-200/60 bg-white/70 px-2 py-1 text-right tabular-nums outline-none focus:border-purple-400 dark:border-purple-900/40 dark:bg-[#1a1025]/70 dark:text-zinc-200" />
          </label>
          <button onClick={regenerar} className="rounded-md bg-purple-500/15 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-500/25 dark:text-purple-300">Regenerar según estacionalidad</button>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Anual actual: <b className="tabular-nums text-purple-700 dark:text-purple-200">{formatCurrency(anual)}</b></span>
          <button onClick={() => limpiarAnio(ANIO)} className="ml-auto rounded-md bg-purple-500/10 px-2 py-1 text-xs text-purple-700 hover:bg-purple-500/20 dark:text-purple-300">Limpiar</button>
        </div>
        <ResponsiveContainer width="100%" height={190}>
          <BarChart data={filas} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={ink.grid} vertical={false} />
            <XAxis dataKey="etiqueta" tick={{ fill: ink.axis, fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={fmtM} tick={{ fill: ink.axis, fontSize: 10 }} tickLine={false} axisLine={false} width={40} />
            <Tooltip cursor={{ fill: ink.cursor }} content={<TooltipChart format={(v) => formatCurrency(v)} />} />
            <Bar dataKey="objetivo" name="Objetivo" fill="#8b5cf6" opacity={0.35} radius={[4, 4, 0, 0]} maxBarSize={16} />
            <Bar dataKey="real" name="Real" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={16} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {filas.map((f) => (
            <label key={f.mes} className="flex flex-col gap-0.5">
              <span className="text-[11px] text-zinc-400">{f.etiqueta} (MDP)</span>
              <input type="number" min="0" step="0.1" value={f.objetivo ? f.objetivo / 1e6 : ''} placeholder="0" onChange={(e) => setObjetivo(ANIO, f.mes, Math.max(0, Number(e.target.value) || 0) * 1e6)} className="rounded-md border border-purple-200/60 bg-white/70 px-2 py-0.5 text-right tabular-nums outline-none focus:border-purple-400 dark:border-purple-900/40 dark:bg-[#1a1025]/70 dark:text-zinc-200" />
            </label>
          ))}
        </div>
      </div>

      {/* PASO 2 */}
      <div className={CARD}>
        <div className="mb-1 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-200">Paso 2 · Reparto por asesor</h3>
          <div className="flex gap-1 rounded-full bg-purple-500/10 p-0.5">
            {(['pct', 'monto'] as const).map((c) => (
              <button key={c} onClick={() => setCaptura(c)} className={cn('rounded-full px-3 py-0.5 text-xs font-medium', captura === c ? 'bg-white text-purple-700 shadow dark:bg-[#241633] dark:text-purple-200' : 'text-zinc-500')}>
                {c === 'pct' ? 'Por %' : 'Por monto'}
              </button>
            ))}
          </div>
        </div>
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">Distribuye el objetivo anual ({formatCurrency(anual)}) entre el equipo. La otra columna se calcula sola.</p>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <button onClick={repartirPorVentas} disabled={!anual} className="rounded-md bg-purple-500/15 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-500/25 disabled:opacity-40 dark:text-purple-300">Repartir según ventas</button>
          <button onClick={() => limpiarAsesores(ANIO)} className="rounded-md bg-purple-500/10 px-2 py-1 text-xs text-purple-700 hover:bg-purple-500/20 dark:text-purple-300">Limpiar reparto</button>
          <span className={cn('ml-auto text-xs', anual && Math.abs(sumAsesores - anual) < 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400')}>
            Repartido: {formatCurrency(sumAsesores)} / {formatCurrency(anual)}{anual ? ` · restante ${formatCurrency(anual - sumAsesores)}` : ''}
          </span>
        </div>
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white/90 dark:bg-[#1a1025]/90">
              <tr className="text-left text-xs text-zinc-400">
                <th className="py-1 pr-2">Asesor</th>
                <th className="py-1 pr-2">%</th>
                <th className="py-1 pr-2">Monto (MDP)</th>
              </tr>
            </thead>
            <tbody>
              {asesores.map((a) => {
                const monto = asesorObjetivoDe(asesoresObj, ANIO, a);
                const pct = anual ? (monto / anual) * 100 : 0;
                return (
                  <tr key={a} className="border-t border-purple-100/40 dark:border-purple-900/20">
                    <td className="py-1 pr-2 text-zinc-600 dark:text-zinc-300">{a}</td>
                    <td className="py-1 pr-2">
                      {captura === 'pct' ? (
                        <input type="number" min="0" step="0.1" value={pct ? Number(pct.toFixed(1)) : ''} placeholder="0" onChange={(e) => setAsesor(ANIO, a, Math.round(anual * (Math.max(0, Number(e.target.value) || 0) / 100)))} className="w-16 rounded-md border border-purple-200/60 bg-white/70 px-1.5 py-0.5 text-right tabular-nums outline-none dark:border-purple-900/40 dark:bg-[#1a1025]/70 dark:text-zinc-200" />
                      ) : (
                        <span className="tabular-nums text-zinc-500">{pct.toFixed(1)}%</span>
                      )}
                    </td>
                    <td className="py-1 pr-2">
                      {captura === 'monto' ? (
                        <input type="number" min="0" step="0.1" value={monto ? monto / 1e6 : ''} placeholder="0" onChange={(e) => setAsesor(ANIO, a, Math.max(0, Number(e.target.value) || 0) * 1e6)} className="w-24 rounded-md border border-purple-200/60 bg-white/70 px-1.5 py-0.5 text-right tabular-nums outline-none dark:border-purple-900/40 dark:bg-[#1a1025]/70 dark:text-zinc-200" />
                      ) : (
                        <span className="tabular-nums text-zinc-700 dark:text-zinc-200">{formatCurrency(monto)}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!asesores.length && <tr><td colSpan={3} className="py-4 text-center text-xs text-zinc-400">Cargando asesores…</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- Avance: real (cerrado) vs meta por período ---
function AvanceObjetivos() {
  const objetivos = useObjetivosStore((s) => s.objetivos);
  const asesoresObj = useObjetivosStore((s) => s.asesores);
  const isDark = useThemeStore((s) => s.theme) === 'dark';
  const ink = chartInk(isDark);

  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const [asesorSel, setAsesorSel] = useState('');
  const [asesores, setAsesores] = useState<readonly string[]>([]);
  const [real, setReal] = useState<Record<number, number> | null>(null);

  useEffect(() => { getAsesores().then(setAsesores).catch(() => {}); }, []);
  useEffect(() => {
    setReal(null);
    getVentasPeriodo(periodo, ANIO, asesorSel || null)
      .then((rows) => setReal(Object.fromEntries(rows.map((r) => [r.periodo, r.monto]))))
      .catch(() => setReal({}));
  }, [periodo, asesorSel]);

  const anual = objetivoAnual(objetivos, ANIO);
  const factor = asesorSel && anual ? asesorObjetivoDe(asesoresObj, ANIO, asesorSel) / anual : 1;
  const nPer = periodo === 'mes' ? 12 : periodo === 'catorcena' ? 26 : 52;
  const objetivoPeriodo = (p: number) => (periodo === 'mes' ? objetivoDe(objetivos, ANIO, p) * factor : (anual * factor) / nPer);

  const now = new Date();
  const mesActual = now.getMonth() + 1;
  const semActual = (() => {
    const t = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return Math.ceil(((t.getTime() - y0.getTime()) / 86400000 + 1) / 7);
  })();
  const esActual = (p: number) => (periodo === 'mes' ? p === mesActual : periodo === 'semana' ? p === semActual : false);

  const filas = useMemo(() => {
    if (!real) return [];
    const claves = new Set<number>(Object.keys(real).map(Number));
    if (periodo === 'mes') for (let m = 1; m <= 12; m++) claves.add(m);
    return [...claves].sort((a, b) => a - b).map((p) => {
      const objetivo = objetivoPeriodo(p);
      const r = real[p] ?? 0;
      return { p, etiqueta: periodo === 'mes' ? MESES[p - 1] : `${periodo === 'catorcena' ? 'C' : 'S'}${p}`, objetivo, real: r, falta: objetivo - r, cumpl: objetivo ? (r / objetivo) * 100 : 0, actual: esActual(p) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [real, objetivos, asesoresObj, periodo, asesorSel]);

  const totObj = filas.reduce((a, f) => a + f.objetivo, 0);
  const totReal = filas.reduce((a, f) => a + f.real, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-full bg-purple-500/10 p-0.5">
          {(['mes', 'catorcena', 'semana'] as const).map((p) => (
            <button key={p} onClick={() => setPeriodo(p)} className={cn('rounded-full px-3 py-0.5 text-xs font-medium', periodo === p ? 'bg-white text-purple-700 shadow dark:bg-[#241633] dark:text-purple-200' : 'text-zinc-500')}>
              {p === 'mes' ? 'Mensual' : p === 'catorcena' ? 'Catorcenal' : 'Semanal'}
            </button>
          ))}
        </div>
        <select value={asesorSel} onChange={(e) => setAsesorSel(e.target.value)} className="rounded-full border border-purple-200/60 bg-white/70 px-3 py-1 text-xs outline-none dark:border-purple-900/40 dark:bg-[#1a1025]/70 dark:text-zinc-200">
          <option value="">Todo el equipo</option>
          {asesores.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard titulo="Meta del período" valor={formatCurrency(totObj)} sub={asesorSel || 'todo el equipo'} />
        <StatCard titulo="Cerrado (real)" valor={formatCurrency(totReal)} tono="up" />
        <StatCard titulo="Falta para la meta" valor={formatCurrency(Math.max(0, totObj - totReal))} tono={totReal >= totObj ? 'up' : 'down'} sub={totObj && totReal >= totObj ? 'meta alcanzada' : ''} />
        <StatCard titulo="Cumplimiento" valor={totObj ? `${((totReal / totObj) * 100).toFixed(0)}%` : '—'} tono={totReal >= totObj ? 'up' : 'down'} />
      </div>

      {!real ? (
        <div className="flex h-48 items-center justify-center"><Spinner size="lg" /></div>
      ) : (
        <>
          <div className={CARD}>
            <h3 className="mb-2 text-xs font-light tracking-wide text-purple-700 dark:text-purple-200">Cerrado vs meta del período</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={filas} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={ink.grid} vertical={false} />
                <XAxis dataKey="etiqueta" tick={{ fill: ink.axis, fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={12} />
                <YAxis tickFormatter={fmtM} tick={{ fill: ink.axis, fontSize: 10 }} tickLine={false} axisLine={false} width={40} />
                <Tooltip cursor={{ fill: ink.cursor }} content={<TooltipChart format={(v) => formatCurrency(v)} />} />
                <Bar dataKey="objetivo" name="Meta" fill="#8b5cf6" opacity={0.3} radius={[4, 4, 0, 0]} maxBarSize={18} />
                <Bar dataKey="real" name="Cerrado" radius={[4, 4, 0, 0]} maxBarSize={18}>
                  {filas.map((f) => <Cell key={f.p} fill={f.objetivo > 0 && f.real >= f.objetivo ? '#10b981' : '#8b5cf6'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className={CARD}>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white/90 dark:bg-[#1a1025]/90">
                  <tr className="text-left text-xs text-zinc-400">
                    <th className="py-1 pr-2">Período</th>
                    <th className="py-1 pr-2">Meta</th>
                    <th className="py-1 pr-2">Cerrado</th>
                    <th className="py-1 pr-2">Falta</th>
                    <th className="py-1">Cumpl.</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f) => (
                    <tr key={f.p} className={cn('border-t border-purple-100/40 dark:border-purple-900/20', f.actual && 'bg-purple-500/5')}>
                      <td className="py-1.5 pr-2 font-medium text-zinc-600 dark:text-zinc-300">
                        {f.etiqueta}
                        {f.actual && <span className="ml-1 rounded bg-purple-500/20 px-1 text-[10px] text-purple-700 dark:text-purple-300">actual</span>}
                      </td>
                      <td className="py-1.5 pr-2 tabular-nums text-zinc-500">{f.objetivo ? formatCurrency(f.objetivo) : '—'}</td>
                      <td className="py-1.5 pr-2 tabular-nums text-zinc-700 dark:text-zinc-200">{formatCurrency(f.real)}</td>
                      <td className={cn('py-1.5 pr-2 tabular-nums', f.falta <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                        {f.objetivo ? (f.falta <= 0 ? `+${formatCurrency(-f.falta)}` : formatCurrency(f.falta)) : '—'}
                      </td>
                      <td className="py-1.5">
                        {f.objetivo ? (
                          <span className={cn('rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums', f.cumpl >= 100 ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/15 text-rose-700 dark:text-rose-300')}>{f.cumpl.toFixed(0)}%</span>
                        ) : (
                          <span className="text-xs text-zinc-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============ EMBUDO ============
function EmbudoView() {
  const [emb, setEmb] = useState<Embudo | null>(null);
  const [ciclo, setCiclo] = useState<Ciclo | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    getEmbudo().then(setEmb).catch(() => setError(true));
    getCiclo().then(setCiclo).catch(() => {});
  }, []);
  if (error) return <p className="text-sm text-rose-500">No se pudo cargar el embudo.</p>;
  if (!emb) return <div className="flex h-48 items-center justify-center"><Spinner size="lg" /></div>;

  const colStatus = (titulo: string, items: Embudo['solicitud']) => (
    <div className={CARD}>
      <h3 className="mb-2 text-xs font-light tracking-wide text-purple-700 dark:text-purple-200">{titulo}</h3>
      <div className="space-y-2">
        {items.map((s) => {
          const max = items[0]?.valor || 1;
          return (
            <div key={s.nombre}>
              <div className="flex justify-between text-xs">
                <span className="truncate text-zinc-600 dark:text-zinc-300">{s.nombre}</span>
                <span className="tabular-nums text-zinc-500">{s.valor}</span>
              </div>
              <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-purple-500/10">
                <div className="h-full rounded-full bg-purple-400/70" style={{ width: `${Math.max(3, (s.valor / max) * 100)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className={CARD}>
        <h3 className="mb-4 text-xs font-light tracking-wide text-purple-700 dark:text-purple-200">Embudo de conversión (Solicitud → Propuesta → Campaña)</h3>
        <div className="space-y-2">
          {emb.etapas.map((e, i) => (
            <div key={e.nombre} className="flex items-center gap-3">
              <span className="w-40 shrink-0 text-right text-xs text-zinc-500 dark:text-zinc-400">{e.nombre}</span>
              <div className="flex-1">
                <div
                  className="flex h-9 items-center justify-between rounded-lg bg-gradient-to-r from-purple-500 to-fuchsia-500 px-3 text-sm font-semibold text-white shadow"
                  style={{ width: `${Math.max(18, e.pct)}%`, opacity: 1 - i * 0.13 }}
                >
                  <span className="tabular-nums">{nf(e.valor)}</span>
                  <span className="text-xs opacity-90">{e.pct}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {ciclo && (
        <div className={CARD}>
          <h3 className="mb-3 text-xs font-light tracking-wide text-purple-700 dark:text-purple-200">Ciclo de venta (Solicitud → Campaña)</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <p className="text-2xl font-semibold tabular-nums text-purple-700 dark:text-purple-200">{ciclo.cicloTotalDias}<span className="text-sm font-normal"> días</span></p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Ciclo total promedio</p>
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{ciclo.conversionGlobalPct}%</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Conversión global</p>
            </div>
            {ciclo.etapas.map((e) => (
              <div key={e.de}>
                <p className="text-2xl font-semibold tabular-nums text-zinc-700 dark:text-zinc-200">{e.dias}<span className="text-sm font-normal"> d</span></p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{e.de} → {e.a}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-zinc-400">Tiempo promedio entre transiciones de estatus · {ciclo.total.toLocaleString('es-MX')} registros</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {colStatus('Solicitudes por estatus', emb.solicitud)}
        {colStatus('Propuestas por estatus', emb.propuesta)}
        {colStatus('Campañas por estatus', emb.campania)}
      </div>
    </div>
  );
}

// ============ VARIACIONES ============
function VariacionesView() {
  const [r, setR] = useState<ResumenHistorial | null>(null);
  const [imp, setImp] = useState<Impacto | null>(null);
  const [error, setError] = useState(false);
  const isDark = useThemeStore((s) => s.theme) === 'dark';
  const ink = chartInk(isDark);
  useEffect(() => {
    getResumenHistorial().then(setR).catch(() => setError(true));
    getImpacto().then(setImp).catch(() => {});
  }, []);
  if (error) return <p className="text-sm text-rose-500">No se pudo cargar variaciones.</p>;
  if (!r) return <div className="flex h-48 items-center justify-center"><Spinner size="lg" /></div>;

  const varData = [...r.variacionPorUsuario].sort((a, b) => a.neto - b.neto).map((v) => ({ ...v, corto: v.nombre.split(' ').slice(0, 2).join(' ') }));
  const mayorVar = r.variacionPorUsuario.reduce<(typeof r.variacionPorUsuario)[number] | null>((m, v) => (Math.abs(v.neto) > Math.abs(m?.neto ?? 0) ? v : m), null);
  const dia = r.porDia.map((d) => ({ etiqueta: d.fecha.slice(5), agregadas: d.carasAgregadas, quitadas: -d.carasQuitadas }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard titulo="Caras aprobadas ↑" valor={nf(r.carasAgregadas)} tono="up" sub="alzas (autorizaciones)" />
        <StatCard titulo="Caras quitadas ↓" valor={nf(r.carasQuitadas)} tono="down" sub="bajas (eliminaciones)" />
        <StatCard titulo="Neto" valor={nf(r.netoCaras)} tono={r.netoCaras >= 0 ? 'up' : 'down'} sub="alzas − bajas" />
        <StatCard titulo="Autorizaciones" valor={nf(r.autorizaciones.total)} sub={`${r.autorizaciones.dg} DG · ${r.autorizaciones.dcm} DCM`} />
      </div>

      <div className={CARD}>
        <h3 className="mb-2 text-xs font-light tracking-wide text-purple-700 dark:text-purple-200">Variación neta de caras por persona</h3>
        <ResponsiveContainer width="100%" height={Math.max(220, varData.length * 34)}>
          <BarChart data={varData} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 4 }}>
            <CartesianGrid stroke={ink.grid} horizontal={false} />
            <XAxis type="number" tick={{ fill: ink.axis, fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="corto" tick={{ fill: ink.axis, fontSize: 10 }} tickLine={false} axisLine={false} width={110} />
            <Tooltip cursor={{ fill: ink.cursor }} content={<TooltipChart format={(v) => `${nf(v)} caras`} />} />
            <Bar dataKey="neto" radius={[0, 4, 4, 0]} maxBarSize={20}>
              {varData.map((v) => (
                <Cell key={v.nombre} fill={v.neto >= 0 ? '#10b981' : '#f43f5e'} />
              ))}
              <LabelList dataKey="neto" position="right" formatter={(v: unknown) => nf(Number(v))} fill={ink.label} fontSize={10} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="mt-1 text-center text-[11px] text-zinc-400">
          Verde = aprobó caras (DG/DCM) · Rojo = quitó reservas (tráfico)
          {mayorVar ? ` · Mayor variación neta: ${mayorVar.nombre.split(' ').slice(0, 2).join(' ')} (${mayorVar.neto >= 0 ? '+' : ''}${nf(mayorVar.neto)})` : ''}
        </p>
      </div>

      <div className={CARD}>
        <h3 className="mb-2 text-xs font-light tracking-wide text-purple-700 dark:text-purple-200">Alzas y bajas por día</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dia} stackOffset="sign" margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={ink.grid} vertical={false} />
            <XAxis dataKey="etiqueta" tick={{ fill: ink.axis, fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={16} />
            <YAxis tick={{ fill: ink.axis, fontSize: 10 }} tickLine={false} axisLine={false} width={44} tickFormatter={(v) => nf(Number(v))} />
            <Tooltip cursor={{ fill: ink.cursor }} content={<TooltipChart format={(v) => `${nf(Math.abs(v))} caras`} />} />
            <Bar dataKey="agregadas" name="Alzas" stackId="s" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={22} />
            <Bar dataKey="quitadas" name="Bajas" stackId="s" fill="#f43f5e" radius={[0, 0, 3, 3]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {imp && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard titulo="Impacto total en inversión" valor={formatCurrency(imp.total)} tono={imp.total >= 0 ? 'up' : 'down'} sub={`${imp.count} ediciones con $`} />
            <StatCard titulo="Impacto promedio" valor={formatCurrency(imp.promedio)} tono={imp.promedio >= 0 ? 'up' : 'down'} />
            <StatCard titulo="Mayor impacto" valor={imp.mayor ? formatCurrency(imp.mayor.monto ?? 0) : '—'} tono={(imp.mayor?.monto ?? 0) >= 0 ? 'up' : 'down'} sub={imp.mayor?.campania ?? imp.mayor?.usuario ?? ''} />
            <StatCard titulo="Ediciones" valor={nf(imp.count)} sub="con cambio de $" />
          </div>

          <div className={CARD}>
            <h3 className="mb-2 text-xs font-light tracking-wide text-purple-700 dark:text-purple-200">Dónde se concentran los ajustes de inversión</h3>
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid stroke={ink.grid} />
                <XAxis type="number" dataKey="caras" name="Caras" tick={{ fill: ink.axis, fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis type="number" dataKey="monto" name="Monto" tickFormatter={fmtM} tick={{ fill: ink.axis, fontSize: 10 }} tickLine={false} axisLine={false} width={44} />
                <ZAxis range={[45, 45]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<TooltipChart hideLabel format={(v, n) => (n === 'Monto' ? formatCurrency(v) : `${nf(v)} caras`)} />} />
                <Scatter data={imp.puntos} fill="#8b5cf6" fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
            <p className="mt-1 text-center text-[11px] text-zinc-400">Cada punto = una edición · X: caras · Y: delta de $</p>
          </div>

          <div className={CARD}>
            <h3 className="mb-2 text-xs font-light tracking-wide text-purple-700 dark:text-purple-200">Historial de ediciones</h3>
            <div className="max-h-72 divide-y divide-purple-100/40 overflow-y-auto dark:divide-purple-900/20">
              {imp.ediciones.map((e) => (
                <div key={e.id} className="flex items-start justify-between gap-3 py-1.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate text-zinc-700 dark:text-zinc-200">{e.descripcion}</p>
                    <p className="text-[11px] text-zinc-400">{new Date(e.fecha).toLocaleDateString('es-MX')}{e.campania ? ` · ${e.campania}` : ''}</p>
                  </div>
                  <span className={cn('shrink-0 tabular-nums font-medium', (e.monto ?? 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                    {(e.monto ?? 0) >= 0 ? '+' : ''}{formatCurrency(e.monto ?? 0)}
                  </span>
                </div>
              ))}
              {!imp.ediciones.length && <p className="py-4 text-center text-xs text-zinc-400">Sin ediciones con cambio de monto en el periodo</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============ DISTRIBUCIÓN ============
const DIMS: { k: Dimension; label: string }[] = [
  { k: 'plaza', label: 'Plaza' },
  { k: 'digital', label: 'Digital / Tradicional' },
  { k: 'asesor', label: 'Asesor' },
  { k: 'cliente', label: 'Cliente' },
  { k: 'marca', label: 'Marca' },
  { k: 'producto', label: 'Producto' },
  { k: 'mueble', label: 'Tipo de mueble' },
  { k: 'categoria', label: 'Categoría' },
];

function DistribucionView() {
  const [dim, setDim] = useState<Dimension>('plaza');
  const [metric, setMetric] = useState<'monto' | 'caras'>('monto');
  const [data, setData] = useState<ConteoMonto[] | null>(null);
  const [error, setError] = useState(false);
  const isDark = useThemeStore((s) => s.theme) === 'dark';
  const ink = chartInk(isDark);
  const asesoresObj = useObjetivosStore((s) => s.asesores);
  const cargarObj = useObjetivosStore((s) => s.cargar);

  useEffect(() => {
    cargarObj(ANIO);
  }, [cargarObj]);

  useEffect(() => {
    setData(null);
    setError(false);
    getDistribucion(dim).then(setData).catch(() => setError(true));
  }, [dim]);

  const top = (data ?? []).slice(0, 12).map((d) => ({ ...d, valor: d[metric], corto: d.nombre.length > 26 ? d.nombre.slice(0, 25) + '…' : d.nombre }));
  const total = (data ?? []).reduce((a, d) => a + d[metric], 0);
  const fmt = (v: number) => (metric === 'monto' ? formatCurrency(v) : `${nf(v)} caras`);
  const ovr =
    dim === 'asesor'
      ? (data ?? [])
          .map((d) => ({ corto: d.nombre.length > 22 ? d.nombre.slice(0, 21) + '…' : d.nombre, real: d.monto, objetivo: asesorObjetivoDe(asesoresObj, ANIO, d.nombre) }))
          .filter((x) => x.objetivo > 0)
          .sort((a, b) => b.objetivo - a.objetivo)
          .slice(0, 12)
      : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {DIMS.map((d) => (
          <button key={d.k} onClick={() => setDim(d.k)} className={cn('rounded-full px-3 py-1 text-xs font-medium transition-colors', dim === d.k ? 'bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white shadow' : 'bg-purple-500/10 text-purple-700 hover:bg-purple-500/20 dark:text-purple-200')}>
            {d.label}
          </button>
        ))}
        <div className="ml-auto flex gap-1 rounded-full bg-purple-500/10 p-0.5">
          {(['monto', 'caras'] as const).map((m) => (
            <button key={m} onClick={() => setMetric(m)} className={cn('rounded-full px-3 py-0.5 text-xs font-medium', metric === m ? 'bg-white text-purple-700 shadow dark:bg-[#241633] dark:text-purple-200' : 'text-zinc-500')}>
              {m === 'monto' ? 'Monto' : 'Caras'}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="text-sm text-rose-500">No se pudo cargar.</p>
      ) : !data ? (
        <div className="flex h-48 items-center justify-center"><Spinner size="lg" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatCard titulo={`Total ${metric === 'monto' ? '($)' : '(caras)'}`} valor={fmt(total)} sub={`en ${data.length} ${DIMS.find((d) => d.k === dim)?.label.toLowerCase()}`} />
            <StatCard titulo="Líder" valor={top[0]?.nombre ?? '—'} tono="up" sub={top[0] ? fmt(top[0].valor) : ''} />
            <StatCard titulo="Concentración top 3" valor={total ? `${Math.round((top.slice(0, 3).reduce((a, d) => a + d.valor, 0) / total) * 100)}%` : '—'} sub="del total" />
          </div>

          <div className={CARD}>
            <h3 className="mb-2 text-xs font-light tracking-wide text-purple-700 dark:text-purple-200">
              {metric === 'monto' ? 'Monto' : 'Caras'} por {DIMS.find((d) => d.k === dim)?.label} (top 12)
            </h3>
            <ResponsiveContainer width="100%" height={Math.max(240, top.length * 32)}>
              <BarChart data={top} layout="vertical" margin={{ top: 4, right: metric === 'monto' ? 70 : 50, left: 8, bottom: 4 }}>
                <CartesianGrid stroke={ink.grid} horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => (metric === 'monto' ? fmtM(Number(v)) : nf(Number(v)))} tick={{ fill: ink.axis, fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="corto" tick={{ fill: ink.axis, fontSize: 10 }} tickLine={false} axisLine={false} width={150} />
                <Tooltip cursor={{ fill: ink.cursor }} content={<TooltipChart format={(v) => fmt(v)} />} />
                <Bar dataKey="valor" fill="#8b5cf6" radius={[0, 4, 4, 0]} maxBarSize={20}>
                  <LabelList dataKey="valor" position="right" formatter={(v: unknown) => (metric === 'monto' ? fmtM(Number(v)) : nf(Number(v)))} fill={ink.label} fontSize={10} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {dim === 'asesor' && (
            <div className={CARD}>
              <h3 className="mb-2 text-xs font-light tracking-wide text-purple-700 dark:text-purple-200">Objetivo vs. real por asesor</h3>
              {ovr.length ? (
                <>
                  <ResponsiveContainer width="100%" height={Math.max(240, ovr.length * 36)}>
                    <BarChart data={ovr} layout="vertical" margin={{ top: 4, right: 60, left: 8, bottom: 4 }}>
                      <CartesianGrid stroke={ink.grid} horizontal={false} />
                      <XAxis type="number" tickFormatter={fmtM} tick={{ fill: ink.axis, fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="corto" tick={{ fill: ink.axis, fontSize: 10 }} tickLine={false} axisLine={false} width={140} />
                      <Tooltip cursor={{ fill: ink.cursor }} content={<TooltipChart format={(v) => formatCurrency(v)} />} />
                      <Bar dataKey="objetivo" name="Objetivo" fill="#8b5cf6" opacity={0.35} radius={[0, 3, 3, 0]} maxBarSize={9} />
                      <Bar dataKey="real" name="Real" fill="#8b5cf6" radius={[0, 3, 3, 0]} maxBarSize={9} />
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="mt-1 text-center text-[11px] text-zinc-400">Barra clara = objetivo · barra sólida = real</p>
                </>
              ) : (
                <p className="py-6 text-center text-xs text-zinc-400">Captura objetivos por asesor en <b>Objetivos → Paso 2</b> para comparar aquí.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============ CAMPAÑAS (detalle) ============
function badgeStatus(s: string | null): string {
  const x = (s ?? '').toLowerCase();
  if (/final/.test(x)) return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
  if (/rechaz|cancel/.test(x)) return 'bg-rose-500/15 text-rose-700 dark:text-rose-300';
  if (/aprob|iniciar/.test(x)) return 'bg-purple-500/15 text-purple-700 dark:text-purple-300';
  return 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400';
}

function CampaniasView() {
  const [rows, setRows] = useState<CampaniaDetalle[] | null>(null);
  const [error, setError] = useState(false);
  const [q, setQ] = useState('');
  useEffect(() => {
    getCampanias(100).then(setRows).catch(() => setError(true));
  }, []);
  if (error) return <p className="text-sm text-rose-500">No se pudo cargar campañas.</p>;
  if (!rows) return <div className="flex h-48 items-center justify-center"><Spinner size="lg" /></div>;

  const fil = rows.filter((c) => !q || `${c.nombre} ${c.cliente ?? ''} ${c.asesor ?? ''}`.toLowerCase().includes(q.toLowerCase()));
  const fmtF = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) : '—');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard titulo="Campañas (recientes)" valor={nf(rows.length)} />
        <StatCard titulo="Caras" valor={nf(rows.reduce((a, c) => a + c.totalCaras, 0))} />
        <StatCard titulo="Activas / por iniciar" valor={nf(rows.filter((c) => /aprob|iniciar/i.test(c.status ?? '')).length)} tono="up" />
        <StatCard titulo="Finalizadas" valor={nf(rows.filter((c) => /final/i.test(c.status ?? '')).length)} />
      </div>
      <div className={CARD}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-light tracking-wide text-purple-700 dark:text-purple-200">Detalle de campañas (recientes)</h3>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar campaña, cliente, asesor…" className="w-60 rounded-full border border-purple-200/60 bg-white/70 px-3 py-1 text-xs outline-none dark:border-purple-900/40 dark:bg-[#1a1025]/70 dark:text-zinc-200" />
        </div>
        <div className="max-h-[560px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white/90 dark:bg-[#1a1025]/90">
              <tr className="text-left text-xs text-zinc-400">
                <th className="py-1 pr-2">Campaña</th>
                <th className="py-1 pr-2">Cliente</th>
                <th className="py-1 pr-2">Asesor</th>
                <th className="py-1 pr-2">Caras</th>
                <th className="py-1 pr-2">Vigencia</th>
                <th className="py-1">Status</th>
              </tr>
            </thead>
            <tbody>
              {fil.map((c) => (
                <tr key={c.id} className="border-t border-purple-100/40 dark:border-purple-900/20">
                  <td className="py-1.5 pr-2 font-medium text-zinc-700 dark:text-zinc-200">{c.nombre?.trim()}</td>
                  <td className="max-w-[180px] truncate py-1.5 pr-2 text-zinc-500 dark:text-zinc-400">{c.cliente ?? '—'}</td>
                  <td className="py-1.5 pr-2 text-zinc-500 dark:text-zinc-400">{c.asesor ?? '—'}</td>
                  <td className="py-1.5 pr-2 tabular-nums text-zinc-600 dark:text-zinc-300">{nf(c.totalCaras)}</td>
                  <td className="py-1.5 pr-2 text-xs text-zinc-500">{fmtF(c.fechaInicio)} – {fmtF(c.fechaFin)}</td>
                  <td className="py-1.5"><span className={cn('rounded px-1.5 py-0.5 text-[11px] font-medium', badgeStatus(c.status))}>{c.status ?? '—'}</span></td>
                </tr>
              ))}
              {!fil.length && <tr><td colSpan={6} className="py-6 text-center text-xs text-zinc-400">Sin resultados</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============ página ============
type Sub = 'objetivos' | 'distribucion' | 'embudo' | 'variaciones' | 'campanias';

export function ReportesPage() {
  const [sub, setSub] = useState<Sub>('objetivos');
  const tabs: { k: Sub; label: string; Icon: typeof Target }[] = [
    { k: 'objetivos', label: 'Objetivos', Icon: Target },
    { k: 'distribucion', label: 'Distribución', Icon: PieChart },
    { k: 'embudo', label: 'Embudo', Icon: Filter },
    { k: 'variaciones', label: 'Variaciones e impacto', Icon: TrendingUp },
    { k: 'campanias', label: 'Campañas', Icon: ClipboardList },
  ];

  return (
    <div className="min-w-0 flex-1">
      <div className="mb-4">
        <h1 className="text-lg font-light tracking-wide text-purple-700 dark:text-purple-200">Reportes de Ventas</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Objetivos, embudo de conversión y variaciones — con datos reales de QEB.</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.k}
            onClick={() => setSub(t.k)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              sub === t.k ? 'bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white shadow' : 'bg-purple-500/10 text-purple-700 hover:bg-purple-500/20 dark:text-purple-200'
            )}
          >
            <t.Icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {sub === 'objetivos' && <ObjetivosView />}
      {sub === 'distribucion' && <DistribucionView />}
      {sub === 'embudo' && <EmbudoView />}
      {sub === 'variaciones' && <VariacionesView />}
      {sub === 'campanias' && <CampaniasView />}
    </div>
  );
}
