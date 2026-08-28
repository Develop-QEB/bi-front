import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Filter, Target, TrendingUp } from 'lucide-react';
import { Spinner } from '../../components/ui/spinner';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/format';
import { chartInk } from '../../lib/chartTheme';
import { useThemeStore } from '../../store/themeStore';
import { getResumenVentas } from '../../services/resumenVentas.service';
import { getResumenHistorial } from '../../services/historial.service';
import { getEmbudo } from '../../services/reportes.service';
import { objetivoDe, useObjetivosStore } from '../../store/objetivosStore';
import type { ResumenVentas } from '../../types/bi';
import type { ResumenHistorial } from '../../types/historial';
import type { Embudo } from '../../types/reportes';

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
            <Tooltip cursor={{ fill: ink.cursor }} formatter={(v: unknown) => formatCurrency(Number(v))} contentStyle={{ borderRadius: 12, border: 'none', background: isDark ? '#241633' : '#fff', fontSize: 12 }} />
            <Bar dataKey="objetivo" name="Objetivo" fill="#8b5cf6" opacity={0.35} radius={[4, 4, 0, 0]} maxBarSize={18} />
            <Bar dataKey="real" name="Real" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={CARD}>
        <h3 className="mb-3 text-xs font-light tracking-wide text-purple-700 dark:text-purple-200">Captura de metas (se guardan en tu navegador)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-zinc-400">
                <th className="py-1 pr-2">Mes</th>
                <th className="py-1 pr-2">Objetivo</th>
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
                    <input
                      type="number"
                      value={f.objetivo || ''}
                      onChange={(e) => setObjetivo(anio, f.mes, Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-28 rounded-md border border-purple-200/60 bg-white/70 px-2 py-0.5 text-right tabular-nums outline-none focus:border-purple-400 dark:border-purple-900/40 dark:bg-[#1a1025]/70 dark:text-zinc-200"
                    />
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

  const totAlzas = r.variacionPorUsuario.reduce((a, v) => a + v.alzas, 0);
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
            <Tooltip cursor={{ fill: ink.cursor }} formatter={(v: unknown) => `${nf(Number(v))} caras`} contentStyle={{ borderRadius: 12, border: 'none', background: isDark ? '#241633' : '#fff', fontSize: 12 }} />
            <Bar dataKey="neto" radius={[0, 4, 4, 0]} maxBarSize={20}>
              {varData.map((v) => (
                <Cell key={v.nombre} fill={v.neto >= 0 ? '#10b981' : '#f43f5e'} />
              ))}
              <LabelList dataKey="neto" position="right" formatter={(v: unknown) => nf(Number(v))} fill={ink.label} fontSize={10} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="mt-1 text-center text-[11px] text-zinc-400">Verde = aprobó caras (DG/DCM) · Rojo = quitó reservas (tráfico). {totAlzas === 0 ? '' : ''}</p>
      </div>

      <div className={CARD}>
        <h3 className="mb-2 text-xs font-light tracking-wide text-purple-700 dark:text-purple-200">Alzas y bajas por día</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dia} stackOffset="sign" margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={ink.grid} vertical={false} />
            <XAxis dataKey="etiqueta" tick={{ fill: ink.axis, fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={16} />
            <YAxis tick={{ fill: ink.axis, fontSize: 10 }} tickLine={false} axisLine={false} width={44} tickFormatter={(v) => nf(Number(v))} />
            <Tooltip cursor={{ fill: ink.cursor }} formatter={(v: unknown) => `${nf(Math.abs(Number(v)))} caras`} contentStyle={{ borderRadius: 12, border: 'none', background: isDark ? '#241633' : '#fff', fontSize: 12 }} />
            <Bar dataKey="agregadas" name="Alzas" stackId="s" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={22} />
            <Bar dataKey="quitadas" name="Bajas" stackId="s" fill="#f43f5e" radius={[0, 0, 3, 3]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ============ página ============
type Sub = 'objetivos' | 'embudo' | 'variaciones';

export function ReportesPage() {
  const [sub, setSub] = useState<Sub>('objetivos');
  const tabs: { k: Sub; label: string; Icon: typeof Target }[] = [
    { k: 'objetivos', label: 'Objetivos', Icon: Target },
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
      {sub === 'embudo' && <EmbudoView />}
      {sub === 'variaciones' && <VariacionesView />}
    </div>
  );
}
