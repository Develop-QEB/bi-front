import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, ComposedChart, LabelList, Line, Pie, PieChart,
  ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis,
} from 'recharts';
import { Spinner } from '../../components/ui/spinner';
import { MetricCard, ACCENTS } from '../../components/bi/MetricCard';
import { TooltipChart } from '../../components/charts/TooltipChart';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/format';
import { chartInk } from '../../lib/chartTheme';
import { useThemeStore } from '../../store/themeStore';
import { getAsesores, getResumenVentas } from '../../services/resumenVentas.service';
import { getImpacto } from '../../services/historial.service';
import { getCampanias, getCiclo, getDistribucion, getEmbudo, getVentasPeriodo } from '../../services/reportes.service';
import { asesorObjetivoDe, objetivoAnual, objetivoDe, useObjetivosStore } from '../../store/objetivosStore';
import type { ResumenVentas } from '../../types/bi';
import type { CampaniaDetalle, Ciclo, ConteoMonto, Embudo, EtapaEmbudo, Impacto, Periodo } from '../../types/reportes';

const ANIO = 2026;

const CARD = cn(
  'rounded-2xl border p-4 backdrop-blur-xl shadow-xl',
  'border-purple-200/50 bg-white/90 shadow-purple-100/20',
  'dark:border-purple-900/30 dark:bg-[#1a1025]/90 dark:shadow-purple-900/10'
);
const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const fmtM = (v: number) => (Math.abs(v) >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : `$${(v / 1e3).toFixed(0)}k`);
const nf = (n: number) => n.toLocaleString('es-MX');
const CardTitle = ({ children }: { children: ReactNode }) => (
  <h3 className="mb-2 text-xs font-light tracking-wide text-purple-700 dark:text-purple-200">{children}</h3>
);

// Rampa morado → cyan para el funnel y acentos gráficos.
const RAMP = ['#a855f7', '#8b5cf6', '#7c3aed', '#22d3ee', '#06b6d4', '#0891b2'];
const DIGITAL_COLORS: Record<string, string> = { Digital: '#22d3ee', Tradicional: '#a855f7' };

// ============================================================
//  FUNNEL (cono) — trapecios centrados que se conectan
// ============================================================
function FunnelCono({ etapas }: { etapas: EtapaEmbudo[] }) {
  const max = etapas[0]?.valor || 1;
  return (
    <div className="flex flex-col">
      {etapas.map((e, i) => {
        const topW = (e.valor / max) * 100;
        const next = etapas[i + 1]?.valor ?? e.valor * 0.55;
        const botRatio = e.valor ? next / e.valor : 0.55;
        const clip = `polygon(0 0, 100% 0, ${(50 + (botRatio * 50)).toFixed(2)}% 100%, ${(50 - (botRatio * 50)).toFixed(2)}% 100%)`;
        return (
          <div key={e.nombre} className="flex items-center gap-3">
            <span className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums text-zinc-700 dark:text-zinc-200">
              {nf(e.valor)}
            </span>
            <div className="relative flex-1">
              <div
                className="mx-auto flex h-11 items-center justify-center text-[11px] font-semibold text-white/90"
                style={{ width: `${Math.max(6, topW)}%`, clipPath: clip, background: RAMP[i % RAMP.length] }}
              >
                <span className="opacity-90">{e.pct}%</span>
              </div>
            </div>
            <span className="w-32 shrink-0 text-left text-xs text-zinc-500 dark:text-zinc-400">{e.nombre}</span>
          </div>
        );
      })}
    </div>
  );
}

// Barra de progreso (ciclo de venta)
function BarraCiclo({ label, dias, max, color }: { label: string; dias: number; max: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-zinc-600 dark:text-zinc-300">{label}</span>
        <span className="font-semibold tabular-nums text-zinc-700 dark:text-zinc-200">{dias} días</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-purple-500/10">
        <div className="h-full rounded-full" style={{ width: `${Math.max(4, (dias / (max || 1)) * 100)}%`, background: color }} />
      </div>
    </div>
  );
}

// Barras horizontales (distribución por dimensión)
function BarrasDim({ data, color, height }: { data: ConteoMonto[]; color: string; height?: number }) {
  const isDark = useThemeStore((s) => s.theme) === 'dark';
  const ink = chartInk(isDark);
  const rows = data.slice(0, 7).map((d) => ({
    ...d,
    corto: d.nombre.length > 22 ? d.nombre.slice(0, 21) + '…' : d.nombre,
  }));
  return (
    <ResponsiveContainer width="100%" height={height ?? Math.max(180, rows.length * 34)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 62, left: 8, bottom: 4 }}>
        <CartesianGrid stroke={ink.grid} horizontal={false} />
        <XAxis type="number" tickFormatter={(v) => fmtM(Number(v))} tick={{ fill: ink.axis, fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="corto" tick={{ fill: ink.axis, fontSize: 10 }} tickLine={false} axisLine={false} width={130} />
        <Tooltip cursor={{ fill: ink.cursor }} content={<TooltipChart format={(v) => formatCurrency(v)} />} />
        <Bar dataKey="monto" fill={color} radius={[0, 4, 4, 0]} maxBarSize={20}>
          <LabelList dataKey="monto" position="right" formatter={(v: unknown) => fmtM(Number(v))} fill={ink.label} fontSize={10} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ============================================================
//  EMBUDO (página completa)
// ============================================================
export function EmbudoPage() {
  const isDark = useThemeStore((s) => s.theme) === 'dark';
  const ink = chartInk(isDark);
  const cargarObj = useObjetivosStore((s) => s.cargar);
  const objetivos = useObjetivosStore((s) => s.objetivos);

  const [emb, setEmb] = useState<Embudo | null>(null);
  const [ciclo, setCiclo] = useState<Ciclo | null>(null);
  const [camps, setCamps] = useState<CampaniaDetalle[] | null>(null);
  const [plaza, setPlaza] = useState<ConteoMonto[]>([]);
  const [digital, setDigital] = useState<ConteoMonto[]>([]);
  const [mueble, setMueble] = useState<ConteoMonto[]>([]);
  const [cliente, setCliente] = useState<ConteoMonto[]>([]);
  const [asesor, setAsesor] = useState<ConteoMonto[]>([]);
  const [porMes, setPorMes] = useState<{ etiqueta: string; monto: number; caras: number }[]>([]);
  const [error, setError] = useState(false);

  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'activas' | 'finalizadas'>('todos');
  const [q, setQ] = useState('');

  useEffect(() => {
    cargarObj(ANIO);
    Promise.all([
      getEmbudo().then(setEmb),
      getCiclo().then(setCiclo).catch(() => {}),
      getCampanias(120).then(setCamps).catch(() => setCamps([])),
      getDistribucion('plaza').then(setPlaza).catch(() => {}),
      getDistribucion('digital').then(setDigital).catch(() => {}),
      getDistribucion('mueble').then(setMueble).catch(() => {}),
      getDistribucion('cliente').then(setCliente).catch(() => {}),
      getDistribucion('asesor').then(setAsesor).catch(() => {}),
      getVentasPeriodo('mes', ANIO).then((rows) => {
        const map = new Map(rows.map((r) => [r.periodo, r]));
        setPorMes(MESES.map((etiqueta, i) => ({ etiqueta, monto: map.get(i + 1)?.monto ?? 0, caras: map.get(i + 1)?.caras ?? 0 })));
      }).catch(() => {}),
    ]).catch(() => setError(true));
  }, [cargarObj]);

  const montoTotal = useMemo(() => plaza.reduce((a, d) => a + d.monto, 0), [plaza]);
  const anual = objetivoAnual(objetivos, ANIO);

  if (error) return <p className="text-sm text-rose-500">No se pudo cargar el embudo.</p>;
  if (!emb) return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>;

  // El back a veces reporta totales.propuestas/campanias == solicitudes; usamos
  // la progresión real del funnel (etapas) para los KPIs.
  const etapaVal = (re: RegExp) => emb.etapas.find((e) => re.test(e.nombre.toLowerCase()))?.valor ?? 0;
  const nSolic = emb.etapas[0]?.valor ?? emb.totales.solicitudes;
  const nProp = etapaVal(/propuesta/) || emb.totales.propuestas;
  const nCamp = etapaVal(/campañ|campan|activ/) || emb.totales.campanias;
  const kpis = [
    { titulo: 'Solicitudes', valor: nf(nSolic), sub: 'Registros creados' },
    { titulo: 'Propuestas', valor: nf(nProp), sub: nSolic ? `${((nProp / nSolic) * 100).toFixed(1)}% de solicitudes` : '' },
    { titulo: 'Campañas', valor: nf(nCamp), sub: nProp ? `${((nCamp / nProp) * 100).toFixed(1)}% de propuestas` : '' },
    { titulo: 'Conversión global', valor: ciclo ? `${ciclo.conversionGlobalPct}%` : '—', sub: 'Solicitud → Campaña' },
    { titulo: 'Monto vendido', valor: formatCurrency(montoTotal), sub: nCamp ? `Ticket prom. ${formatCurrency(Math.round(montoTotal / nCamp))}` : '' },
    { titulo: 'Avance vs objetivo', valor: anual ? `${((montoTotal / anual) * 100).toFixed(1)}%` : '—', sub: anual ? `Meta ${fmtM(anual)}` : 'Sin objetivo capturado' },
  ];

  const campsFil = (camps ?? []).filter((c) => {
    const s = (c.status ?? '').toLowerCase();
    if (statusFiltro === 'activas' && !/aprob|iniciar|activ/.test(s)) return false;
    if (statusFiltro === 'finalizadas' && !/final/.test(s)) return false;
    return !q || `${c.nombre} ${c.cliente ?? ''} ${c.asesor ?? ''}`.toLowerCase().includes(q.toLowerCase());
  });
  const fmtF = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) : '—');
  const cicloMax = Math.max(ciclo?.cicloTotalDias ?? 1, ...(ciclo?.etapas.map((e) => e.dias) ?? [1]));
  const topCli = cliente.slice(0, 8);

  return (
    <div className="space-y-4">
      {/* 6 KPI con barra de gradiente */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k, i) => (
          <MetricCard key={k.titulo} titulo={k.titulo} valor={k.valor} sub={k.sub} accent={ACCENTS[i % ACCENTS.length]} />
        ))}
      </div>

      {/* Funnel + Ciclo */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={CARD}>
          <CardTitle>Embudo de conversión</CardTitle>
          <p className="mb-4 text-[11px] text-zinc-400">Conteo de registros por etapa de estatus alcanzada</p>
          <FunnelCono etapas={emb.etapas} />
        </div>

        {ciclo && (
          <div className={CARD}>
            <CardTitle>Ciclo de venta</CardTitle>
            <p className="mb-4 text-[11px] text-zinc-400">Tiempo promedio entre transiciones de estatus (días)</p>
            <div className="space-y-4">
              {ciclo.etapas.map((e, i) => (
                <BarraCiclo key={e.de} label={`${e.de} → ${e.a}`} dias={e.dias} max={cicloMax} color={RAMP[i % RAMP.length]} />
              ))}
              <BarraCiclo label="Ciclo total (Solicitud → Campaña)" dias={ciclo.cicloTotalDias} max={cicloMax} color="#f59e0b" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-purple-100/40 pt-3 dark:border-purple-900/20">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-zinc-400">Conversión global</p>
                <p className="text-xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{ciclo.conversionGlobalPct}%</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-zinc-400">Registros analizados</p>
                <p className="text-xl font-semibold tabular-nums text-purple-700 dark:text-purple-200">{nf(ciclo.total)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detalle de campañas */}
      <div className={CARD}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>Detalle de campañas</CardTitle>
            <p className="-mt-1 text-[11px] text-zinc-400">Registros con ID de campaña a lo largo del flujo Solicitud → Propuesta → Campaña.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 rounded-full bg-purple-500/10 p-0.5">
              {(['todos', 'activas', 'finalizadas'] as const).map((s) => (
                <button key={s} onClick={() => setStatusFiltro(s)} className={cn('rounded-full px-3 py-0.5 text-xs font-medium capitalize', statusFiltro === s ? 'bg-white text-purple-700 shadow dark:bg-[#241633] dark:text-purple-200' : 'text-zinc-500')}>
                  {s}
                </button>
              ))}
            </div>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" className="w-44 rounded-full border border-purple-200/60 bg-white/70 px-3 py-1 text-xs outline-none dark:border-purple-900/40 dark:bg-[#1a1025]/70 dark:text-zinc-200" />
          </div>
        </div>
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white/90 dark:bg-[#1a1025]/90">
              <tr className="text-left text-xs text-zinc-400">
                <th className="py-1 pr-2">Campaña</th>
                <th className="py-1 pr-2">Cliente</th>
                <th className="py-1 pr-2">Asesor</th>
                <th className="py-1 pr-2">Vigencia</th>
                <th className="py-1 pr-2">Caras</th>
                <th className="py-1 pr-2 text-right">Inversión</th>
                <th className="py-1">Status</th>
              </tr>
            </thead>
            <tbody>
              {campsFil.map((c) => (
                <tr key={c.id} className="border-t border-purple-100/40 dark:border-purple-900/20">
                  <td className="py-1.5 pr-2 font-medium text-zinc-700 dark:text-zinc-200">{c.nombre?.trim()}</td>
                  <td className="max-w-[160px] truncate py-1.5 pr-2 text-zinc-500 dark:text-zinc-400">{c.cliente ?? '—'}</td>
                  <td className="py-1.5 pr-2 text-zinc-500 dark:text-zinc-400">{c.asesor ?? '—'}</td>
                  <td className="py-1.5 pr-2 text-xs text-zinc-500">{fmtF(c.fechaInicio)} – {fmtF(c.fechaFin)}</td>
                  <td className="py-1.5 pr-2 tabular-nums text-zinc-500 dark:text-zinc-400">{nf(c.totalCaras)}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums font-medium text-zinc-700 dark:text-zinc-200">{formatCurrency(c.monto)}</td>
                  <td className="py-1.5"><span className={cn('rounded px-1.5 py-0.5 text-[11px] font-medium', badgeStatus(c.status))}>{c.status ?? '—'}</span></td>
                </tr>
              ))}
              {!campsFil.length && <tr><td colSpan={7} className="py-6 text-center text-xs text-zinc-400">Sin resultados</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top clientes + Ranking asesores */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={CARD}>
          <CardTitle>Top clientes</CardTitle>
          <p className="-mt-1 mb-2 text-[11px] text-zinc-400">Por monto cerrado en el período</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-zinc-400">
                <th className="py-1 pr-2">Cliente</th>
                <th className="py-1 pr-2 text-right">Campañas</th>
                <th className="py-1 pr-2 text-right">Monto</th>
                <th className="py-1 text-right">Ticket prom.</th>
              </tr>
            </thead>
            <tbody>
              {topCli.map((c) => (
                <tr key={c.nombre} className="border-t border-purple-100/40 dark:border-purple-900/20">
                  <td className="max-w-[200px] truncate py-1.5 pr-2 text-zinc-700 dark:text-zinc-200">{c.nombre}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums text-zinc-500">{nf(c.n)}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums font-medium text-zinc-700 dark:text-zinc-200">{formatCurrency(c.monto)}</td>
                  <td className="py-1.5 text-right tabular-nums text-zinc-500">{formatCurrency(c.n ? Math.round(c.monto / c.n) : 0)}</td>
                </tr>
              ))}
              {!topCli.length && <tr><td colSpan={4} className="py-4 text-center text-xs text-zinc-400">Sin datos</td></tr>}
            </tbody>
          </table>
        </div>

        <div className={CARD}>
          <CardTitle>Ranking de asesores</CardTitle>
          <p className="-mt-1 mb-2 text-[11px] text-zinc-400">Monto cerrado por asesor</p>
          <BarrasDim data={asesor} color="#8b5cf6" height={Math.max(200, Math.min(asesor.length, 7) * 34)} />
        </div>
      </div>

      {/* Análisis gráfico */}
      <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-purple-700/70 dark:text-purple-300/60">Análisis gráfico</p>

      <div className={CARD}>
        <CardTitle>Tendencia por mes</CardTitle>
        <p className="-mt-1 mb-2 text-[11px] text-zinc-400">Caras cerradas (barras) y monto vendido (línea)</p>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={porMes} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={ink.grid} vertical={false} />
            <XAxis dataKey="etiqueta" tick={{ fill: ink.axis, fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis yAxisId="caras" tick={{ fill: ink.axis, fontSize: 10 }} tickLine={false} axisLine={false} width={40} tickFormatter={(v) => nf(Number(v))} />
            <YAxis yAxisId="monto" orientation="right" tickFormatter={fmtM} tick={{ fill: ink.axis, fontSize: 10 }} tickLine={false} axisLine={false} width={48} />
            <Tooltip cursor={{ fill: ink.cursor }} content={<TooltipChart format={(v, n) => (n === 'Monto' ? formatCurrency(v) : `${nf(v)} caras`)} />} />
            <Bar yAxisId="caras" dataKey="caras" name="Caras" fill="#a855f7" radius={[4, 4, 0, 0]} maxBarSize={22} />
            <Line yAxisId="monto" type="monotone" dataKey="monto" name="Monto" stroke="#22d3ee" strokeWidth={2.5} dot={{ r: 2.5 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className={CARD}>
          <CardTitle>Monto por plaza</CardTitle>
          <BarrasDim data={plaza} color="#8b5cf6" />
        </div>
        <div className={CARD}>
          <CardTitle>Tradicional vs Digital</CardTitle>
          <p className="-mt-1 mb-1 text-[11px] text-zinc-400">Distribución de monto por formato</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={digital} dataKey="monto" nameKey="nombre" innerRadius={55} outerRadius={85} paddingAngle={2} stroke="none">
                {digital.map((d) => <Cell key={d.nombre} fill={DIGITAL_COLORS[d.nombre] ?? '#8b5cf6'} />)}
              </Pie>
              <Tooltip content={<TooltipChart format={(v) => formatCurrency(v)} />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4">
            {digital.map((d) => (
              <span key={d.nombre} className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: DIGITAL_COLORS[d.nombre] ?? '#8b5cf6' }} />
                {d.nombre} <b className="tabular-nums">{fmtM(d.monto)}</b>
              </span>
            ))}
          </div>
        </div>
        <div className={CARD}>
          <CardTitle>Monto por tipo de mueble</CardTitle>
          <BarrasDim data={mueble} color="#22d3ee" />
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  VARIACIONES E IMPACTO
// ============================================================
export function VariacionesPage() {
  const [imp, setImp] = useState<Impacto | null>(null);
  const [error, setError] = useState(false);
  const [campoFiltro, setCampoFiltro] = useState<'todos' | 'caras' | 'monto'>('todos');
  const isDark = useThemeStore((s) => s.theme) === 'dark';
  const ink = chartInk(isDark);

  useEffect(() => {
    getImpacto().then(setImp).catch(() => setError(true));
  }, []);
  if (error) return <p className="text-sm text-rose-500">No se pudo cargar el impacto.</p>;
  if (!imp) return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>;

  const alzas = imp.ediciones.filter((e) => (e.monto ?? 0) > 0);
  const bajas = imp.ediciones.filter((e) => (e.monto ?? 0) < 0);
  const sumAlzas = alzas.reduce((a, e) => a + (e.monto ?? 0), 0);
  const sumBajas = bajas.reduce((a, e) => a + (e.monto ?? 0), 0);
  const campaniasEditadas = new Set(imp.ediciones.map((e) => e.campania ?? e.refId)).size;

  const kpis = [
    { titulo: 'Ediciones registradas', valor: nf(imp.count), sub: `${campaniasEditadas} campañas afectadas`, tono: 'neutral' as const, accent: ACCENTS[0] },
    { titulo: 'Variación neta', valor: `${imp.total >= 0 ? '+' : ''}${formatCurrency(imp.total)}`, sub: 'Impacto total en inversión', tono: imp.total >= 0 ? 'up' as const : 'down' as const, accent: ACCENTS[1] },
    { titulo: 'Impacto promedio', valor: `${imp.promedio >= 0 ? '+' : ''}${formatCurrency(imp.promedio)}`, sub: 'Magnitud por edición', tono: imp.promedio >= 0 ? 'up' as const : 'down' as const, accent: ACCENTS[2] },
    { titulo: 'Alzas', valor: `+${formatCurrency(sumAlzas)}`, sub: `${alzas.length} ediciones al alza`, tono: 'up' as const, accent: ACCENTS[3] },
    { titulo: 'Bajas', valor: formatCurrency(sumBajas), sub: `${bajas.length} ediciones a la baja`, tono: 'down' as const, accent: ACCENTS[4] },
    { titulo: 'Mayor impacto', valor: imp.mayor ? formatCurrency(imp.mayor.monto ?? 0) : '—', sub: imp.mayor?.campania ?? imp.mayor?.usuario ?? '', tono: (imp.mayor?.monto ?? 0) >= 0 ? 'up' as const : 'down' as const, accent: ACCENTS[5] },
  ];

  const puntos = imp.puntos.map((p) => ({ x: new Date(p.fecha).getTime(), monto: p.monto }));
  const filas = imp.ediciones.filter((e) => {
    if (campoFiltro === 'caras') return e.carasAntes != null;
    if (campoFiltro === 'monto') return e.invAntes != null || (e.monto ?? 0) !== 0;
    return true;
  });

  return (
    <div className="space-y-4">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Cada registro proviene del historial de acciones: una edición de caras o tarifa que modificó la inversión de una campaña ya creada (venta cerrada).
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => (
          <MetricCard key={k.titulo} titulo={k.titulo} valor={k.valor} sub={k.sub} tono={k.tono} accent={k.accent} />
        ))}
      </div>

      <div className={CARD}>
        <CardTitle>Dónde se concentran los ajustes de inversión</CardTitle>
        <ResponsiveContainer width="100%" height={240}>
          <ScatterChart margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid stroke={ink.grid} />
            <XAxis type="number" dataKey="x" name="Fecha" domain={['dataMin', 'dataMax']} tickFormatter={(v) => new Date(Number(v)).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })} tick={{ fill: ink.axis, fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis type="number" dataKey="monto" name="Monto" tickFormatter={fmtM} tick={{ fill: ink.axis, fontSize: 10 }} tickLine={false} axisLine={false} width={48} />
            <ZAxis range={[45, 45]} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<TooltipChart hideLabel format={(v, n) => (n === 'Monto' ? formatCurrency(v) : new Date(Number(v)).toLocaleDateString('es-MX'))} />} />
            <Scatter data={puntos} fill="#8b5cf6" fillOpacity={0.6} />
          </ScatterChart>
        </ResponsiveContainer>
        <p className="mt-1 text-center text-[11px] text-zinc-400">Cada punto = un ajuste de inversión · eje Y = delta en $</p>
      </div>

      <div className={CARD}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>Historial de ediciones</CardTitle>
            <p className="-mt-1 text-[11px] text-zinc-400">Audit log con campaña, quién editó y el impacto en inversión</p>
          </div>
          <div className="flex gap-1 rounded-full bg-purple-500/10 p-0.5">
            {(['todos', 'caras', 'monto'] as const).map((c) => (
              <button key={c} onClick={() => setCampoFiltro(c)} className={cn('rounded-full px-3 py-0.5 text-xs font-medium capitalize', campoFiltro === c ? 'bg-white text-purple-700 shadow dark:bg-[#241633] dark:text-purple-200' : 'text-zinc-500')}>
                {c === 'monto' ? 'Tarifa' : c}
              </button>
            ))}
          </div>
        </div>
        <div className="max-h-[460px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white/90 dark:bg-[#1a1025]/90">
              <tr className="text-left text-xs text-zinc-400">
                <th className="py-1 pr-2">Fecha</th>
                <th className="py-1 pr-2">Campaña</th>
                <th className="py-1 pr-2">Usuario</th>
                <th className="py-1 pr-2">Campo</th>
                <th className="py-1 pr-2">Caras (antes → después)</th>
                <th className="py-1 pr-2">Inversión (antes → después)</th>
                <th className="py-1 text-right">Δ Inversión</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((e) => {
                const campos: string[] = [];
                if (e.carasAntes != null) campos.push('Caras');
                if (e.invAntes != null) campos.push('Tarifa');
                return (
                  <tr key={e.id} className="border-t border-purple-100/40 dark:border-purple-900/20">
                    <td className="py-1.5 pr-2 text-xs text-zinc-500">{new Date(e.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</td>
                    <td className="max-w-[150px] truncate py-1.5 pr-2 font-medium text-zinc-700 dark:text-zinc-200">{e.campania ?? '—'}</td>
                    <td className="max-w-[130px] truncate py-1.5 pr-2 text-zinc-500 dark:text-zinc-400">{e.usuario ?? '—'}</td>
                    <td className="py-1.5 pr-2">
                      <span className="flex gap-1">
                        {campos.length ? campos.map((c) => (
                          <span key={c} className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', c === 'Caras' ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300' : 'bg-amber-500/15 text-amber-700 dark:text-amber-300')}>{c}</span>
                        )) : <span className="text-xs text-zinc-400">—</span>}
                      </span>
                    </td>
                    <td className="py-1.5 pr-2 text-xs tabular-nums">
                      {e.carasAntes != null ? (
                        <span className="text-zinc-600 dark:text-zinc-300">
                          {e.carasAntes} <span className="text-zinc-400">→</span> {e.carasDespues}
                          <span className={cn('ml-1', e.caras > 0 ? 'text-emerald-600 dark:text-emerald-400' : e.caras < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-400')}>({e.caras > 0 ? '+' : ''}{e.caras})</span>
                        </span>
                      ) : <span className="text-zinc-400">—</span>}
                    </td>
                    <td className="py-1.5 pr-2 text-xs tabular-nums">
                      {e.invAntes != null ? (
                        <span className="text-zinc-600 dark:text-zinc-300">{fmtM(e.invAntes)} <span className="text-zinc-400">→</span> {fmtM(e.invDespues ?? 0)}</span>
                      ) : <span className="text-zinc-400">—</span>}
                    </td>
                    <td className={cn('py-1.5 text-right tabular-nums font-medium', (e.monto ?? 0) > 0 ? 'text-emerald-600 dark:text-emerald-400' : (e.monto ?? 0) < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-400')}>
                      {e.monto ? `${e.monto > 0 ? '+' : ''}${formatCurrency(e.monto)}` : '—'}
                    </td>
                  </tr>
                );
              })}
              {!filas.length && <tr><td colSpan={7} className="py-6 text-center text-xs text-zinc-400">Sin ediciones en el período</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  OBJETIVOS
// ============================================================
export function ObjetivosPage() {
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
  const realAcum = realMes.reduce((a, b) => a + b, 0);

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
  const cuadra = anual > 0 && Math.abs(sumAsesores - anual) < 1;

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard titulo="Objetivo anual" valor={formatCurrency(anual)} sub="Suma de los 12 meses" accent="purple" />
        <MetricCard titulo="Real acumulado" valor={formatCurrency(realAcum)} sub="Ventas del período" accent="cyan" tono="up" />
        <MetricCard titulo="Avance" valor={anual ? `${((realAcum / anual) * 100).toFixed(1)}%` : '—'} sub="Real / objetivo anual" accent="green" />
        <MetricCard titulo="Brecha" valor={anual ? formatCurrency(realAcum - anual) : '—'} sub="Falta para la meta" accent="pink" tono={realAcum >= anual ? 'up' : 'down'} />
      </div>

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
          <div className="flex items-center gap-2">
            <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', cuadra ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-500/10 text-zinc-500')}>
              {cuadra ? 'Cuadra ✓' : anual ? `${((sumAsesores / anual) * 100).toFixed(0)}%` : '—'}
            </span>
            <div className="flex gap-1 rounded-full bg-purple-500/10 p-0.5">
              {(['pct', 'monto'] as const).map((c) => (
                <button key={c} onClick={() => setCaptura(c)} className={cn('rounded-full px-3 py-0.5 text-xs font-medium', captura === c ? 'bg-white text-purple-700 shadow dark:bg-[#241633] dark:text-purple-200' : 'text-zinc-500')}>
                  {c === 'pct' ? 'Por %' : 'Por monto'}
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">Distribuye el objetivo anual ({formatCurrency(anual)}) entre el equipo. La otra columna se calcula sola.</p>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <button onClick={repartirPorVentas} disabled={!anual} className="rounded-md bg-purple-500/15 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-500/25 disabled:opacity-40 dark:text-purple-300">Repartir según ventas</button>
          <button onClick={() => limpiarAsesores(ANIO)} className="rounded-md bg-purple-500/10 px-2 py-1 text-xs text-purple-700 hover:bg-purple-500/20 dark:text-purple-300">Limpiar reparto</button>
          <span className={cn('ml-auto text-xs', cuadra ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400')}>
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
        <MetricCard titulo="Meta del período" valor={formatCurrency(totObj)} sub={asesorSel || 'todo el equipo'} accent="purple" />
        <MetricCard titulo="Cerrado (real)" valor={formatCurrency(totReal)} tono="up" accent="cyan" />
        <MetricCard titulo="Falta para la meta" valor={formatCurrency(Math.max(0, totObj - totReal))} tono={totReal >= totObj ? 'up' : 'down'} sub={totObj && totReal >= totObj ? 'meta alcanzada' : ''} accent="orange" />
        <MetricCard titulo="Cumplimiento" valor={totObj ? `${((totReal / totObj) * 100).toFixed(0)}%` : '—'} tono={totReal >= totObj ? 'up' : 'down'} accent="green" />
      </div>

      {!real ? (
        <div className="flex h-48 items-center justify-center"><Spinner size="lg" /></div>
      ) : (
        <>
          <div className={CARD}>
            <CardTitle>Cerrado vs meta del período</CardTitle>
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

// ============================================================
//  helpers compartidos
// ============================================================
function badgeStatus(s: string | null): string {
  const x = (s ?? '').toLowerCase();
  if (/final/.test(x)) return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
  if (/rechaz|cancel/.test(x)) return 'bg-rose-500/15 text-rose-700 dark:text-rose-300';
  if (/aprob|iniciar/.test(x)) return 'bg-purple-500/15 text-purple-700 dark:text-purple-300';
  return 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400';
}
