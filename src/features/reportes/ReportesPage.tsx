import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Filter, PieChart, Target, TrendingUp } from 'lucide-react';
import { Spinner } from '../../components/ui/spinner';
import { TooltipChart } from '../../components/charts/TooltipChart';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/format';
import { chartInk } from '../../lib/chartTheme';
import { useThemeStore } from '../../store/themeStore';
import { getResumenVentas } from '../../services/resumenVentas.service';
import { getResumenHistorial } from '../../services/historial.service';
import { getDistribucion, getEmbudo } from '../../services/reportes.service';
import { objetivoDe, useObjetivosStore } from '../../store/objetivosStore';
import type { ResumenVentas } from '../../types/bi';
import type { ResumenHistorial } from '../../types/historial';
import type { ConteoMonto, Dimension, Embudo } from '../../types/reportes';

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
  const anio = 2026;
  const [ventas, setVentas] = useState<ResumenVentas | null>(null);
  const [error, setError] = useState(false);
  const objetivos = useObjetivosStore((s) => s.objetivos);
  const setObjetivo = useObjetivosStore((s) => s.setObjetivo);
  const limpiarAnio = useObjetivosStore((s) => s.limpiarAnio);
  const isDark = useThemeStore((s) => s.theme) === 'dark';
  const ink = chartInk(isDark);

  useEffect(() => {
    getResumenVentas({ base: null, asesor: null, cliente: null, anio, mes: null })
      .then(setVentas)
      .catch(() => setError(true));
  }, []);

  const filas = useMemo(() => {
    const real = new Map((ventas?.ventasMensuales ?? []).map((m) => [m.mes, m.aps]));
    return MESES.map((etiqueta, i) => {
      const mes = i + 1;
      const objetivo = objetivoDe(objetivos, anio, mes);
      const r = real.get(mes) ?? 0;
      return { mes, etiqueta, objetivo, real: r, brecha: r - objetivo, pct: objetivo ? (r / objetivo) * 100 : 0 };
    });
  }, [ventas, objetivos]);

  const totObj = filas.reduce((a, f) => a + f.objetivo, 0);
  const totReal = filas.reduce((a, f) => a + f.real, 0);
  const cumpl = totObj ? (totReal / totObj) * 100 : 0;

  if (error) return <p className="text-sm text-rose-500">No se pudo cargar ventas (¿back arriba?).</p>;
  if (!ventas) return <div className="flex h-48 items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard titulo="Objetivo anual" valor={formatCurrency(totObj)} sub="suma de metas capturadas" />
        <StatCard titulo="Real acumulado" valor={formatCurrency(totReal)} tono="up" sub="ventas 2026" />
        <StatCard titulo="Brecha" valor={formatCurrency(totReal - totObj)} tono={totReal - totObj >= 0 ? 'up' : 'down'} sub="real − objetivo" />
        <StatCard titulo="Cumplimiento" valor={`${cumpl.toFixed(1)}%`} tono={cumpl >= 100 ? 'up' : 'down'} sub="acumulado vs meta" />
      </div>

      <div className={CARD}>
        <h3 className="mb-2 text-xs font-light tracking-wide text-purple-700 dark:text-purple-200">Objetivo vs Real por mes</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={filas} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={ink.grid} vertical={false} />
            <XAxis dataKey="etiqueta" tick={{ fill: ink.axis, fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={fmtM} tick={{ fill: ink.axis, fontSize: 10 }} tickLine={false} axisLine={false} width={40} />
            <Tooltip cursor={{ fill: ink.cursor }} content={<TooltipChart format={(v) => formatCurrency(v)} />} />
            <Bar dataKey="objetivo" name="Objetivo" fill="#8b5cf6" opacity={0.35} radius={[4, 4, 0, 0]} maxBarSize={18} />
            <Bar dataKey="real" name="Real" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={CARD}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-xs font-light tracking-wide text-purple-700 dark:text-purple-200">
            Captura de metas en millones de pesos (MDP) — se guardan en tu navegador
          </h3>
          <button
            onClick={() => limpiarAnio(anio)}
            className="shrink-0 rounded-md bg-purple-500/10 px-2 py-1 text-xs text-purple-700 hover:bg-purple-500/20 dark:text-purple-300"
          >
            Limpiar
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-zinc-400">
                <th className="py-1 pr-2">Mes</th>
                <th className="py-1 pr-2">Objetivo (MDP)</th>
                <th className="py-1 pr-2">Real</th>
                <th className="py-1 pr-2">Brecha</th>
                <th className="py-1">Cumpl.</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.mes} className="border-t border-purple-100/40 dark:border-purple-900/20">
                  <td className="py-1.5 pr-2 font-medium text-zinc-600 dark:text-zinc-300">{f.etiqueta}</td>
                  <td className="py-1.5 pr-2">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={f.objetivo ? f.objetivo / 1e6 : ''}
                        onChange={(e) => setObjetivo(anio, f.mes, Math.max(0, Number(e.target.value) || 0) * 1e6)}
                        placeholder="0"
                        className="w-24 rounded-md border border-purple-200/60 bg-white/70 px-2 py-0.5 text-right tabular-nums outline-none focus:border-purple-400 dark:border-purple-900/40 dark:bg-[#1a1025]/70 dark:text-zinc-200"
                      />
                      <span className="text-[11px] text-zinc-400">MDP</span>
                    </div>
                  </td>
                  <td className="py-1.5 pr-2 tabular-nums text-zinc-700 dark:text-zinc-200">{formatCurrency(f.real)}</td>
                  <td className={cn('py-1.5 pr-2 tabular-nums', f.brecha >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                    {f.objetivo ? formatCurrency(f.brecha) : '—'}
                  </td>
                  <td className="py-1.5">
                    {f.objetivo ? (
                      <span className={cn('rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums', f.pct >= 100 ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/15 text-rose-700 dark:text-rose-300')}>
                        {f.pct.toFixed(0)}%
                      </span>
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
    </div>
  );
}

// ============ EMBUDO ============
function EmbudoView() {
  const [emb, setEmb] = useState<Embudo | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    getEmbudo().then(setEmb).catch(() => setError(true));
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
  const [error, setError] = useState(false);
  const isDark = useThemeStore((s) => s.theme) === 'dark';
  const ink = chartInk(isDark);
  useEffect(() => {
    getResumenHistorial().then(setR).catch(() => setError(true));
  }, []);
  if (error) return <p className="text-sm text-rose-500">No se pudo cargar variaciones.</p>;
  if (!r) return <div className="flex h-48 items-center justify-center"><Spinner size="lg" /></div>;

  const varData = [...r.variacionPorUsuario].sort((a, b) => a.neto - b.neto).map((v) => ({ ...v, corto: v.nombre.split(' ').slice(0, 2).join(' ') }));
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
        <p className="mt-1 text-center text-[11px] text-zinc-400">Verde = aprobó caras (DG/DCM) · Rojo = quitó reservas (tráfico)</p>
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

  useEffect(() => {
    setData(null);
    setError(false);
    getDistribucion(dim).then(setData).catch(() => setError(true));
  }, [dim]);

  const top = (data ?? []).slice(0, 12).map((d) => ({ ...d, valor: d[metric], corto: d.nombre.length > 26 ? d.nombre.slice(0, 25) + '…' : d.nombre }));
  const total = (data ?? []).reduce((a, d) => a + d[metric], 0);
  const fmt = (v: number) => (metric === 'monto' ? formatCurrency(v) : `${nf(v)} caras`);

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
        </>
      )}
    </div>
  );
}

// ============ página ============
type Sub = 'objetivos' | 'embudo' | 'variaciones' | 'distribucion';

export function ReportesPage() {
  const [sub, setSub] = useState<Sub>('objetivos');
  const tabs: { k: Sub; label: string; Icon: typeof Target }[] = [
    { k: 'objetivos', label: 'Objetivos', Icon: Target },
    { k: 'distribucion', label: 'Distribución', Icon: PieChart },
    { k: 'embudo', label: 'Embudo', Icon: Filter },
    { k: 'variaciones', label: 'Variaciones e impacto', Icon: TrendingUp },
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
    </div>
  );
}
