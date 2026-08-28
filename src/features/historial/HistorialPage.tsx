import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  Building2,
  CalendarDays,
  Circle,
  Layers,
  Radio,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { Spinner } from '../../components/ui/spinner';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/format';
import { chartInk } from '../../lib/chartTheme';
import { useThemeStore } from '../../store/themeStore';
import {
  getContexto,
  getEventos,
  getResumenHistorial,
  suscribirEventos,
  type EstadoWS,
} from '../../services/historial.service';
import type { CategoriaAccion, ContextoHistorial, EventoHistorial, ResumenHistorial } from '../../types/historial';

// ---------- metadatos de categoría ----------
const CAT_META: Record<CategoriaAccion, { label: string; Icon: LucideIcon; color: string }> = {
  eliminacion: { label: 'Eliminación', Icon: Trash2, color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10' },
  autorizacion: { label: 'Autorización', Icon: ShieldCheck, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' },
  rechazo: { label: 'Rechazo', Icon: XCircle, color: 'text-red-600 dark:text-red-400 bg-red-500/10' },
  cambio_estado: { label: 'Cambio de estado', Icon: ArrowLeftRight, color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10' },
  asignacion: { label: 'Asignación', Icon: Layers, color: 'text-sky-600 dark:text-sky-400 bg-sky-500/10' },
  creacion: { label: 'Creación', Icon: Sparkles, color: 'text-violet-600 dark:text-violet-400 bg-violet-500/10' },
  post_sap: { label: 'POST a SAP', Icon: Send, color: 'text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-500/10' },
  otro: { label: 'Otro', Icon: Circle, color: 'text-zinc-500 dark:text-zinc-400 bg-zinc-500/10' },
};

const CHIPS: { key: CategoriaAccion | null; label: string }[] = [
  { key: null, label: 'Todas' },
  { key: 'eliminacion', label: 'Eliminaciones' },
  { key: 'autorizacion', label: 'Autorizaciones' },
  { key: 'cambio_estado', label: 'Cambios de estado' },
  { key: 'asignacion', label: 'Asignaciones' },
  { key: 'creacion', label: 'Creaciones' },
  { key: 'post_sap', label: 'POST SAP' },
];

// ---------- helpers ----------
function tiempoRelativo(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `hace ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

function semanaKey(iso: string): string {
  const d = new Date(iso);
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const wk = Math.ceil(((t.getTime() - y0.getTime()) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-S${String(wk).padStart(2, '0')}`;
}

/** YYYY-MM-DD + n días → YYYY-MM-DD */
function masDias(fecha: string, n: number): string {
  const d = new Date(fecha + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const CARD = cn(
  'rounded-2xl border p-4 backdrop-blur-xl shadow-xl',
  'border-purple-200/50 bg-white/90 shadow-purple-100/20',
  'dark:border-purple-900/30 dark:bg-[#1a1025]/90 dark:shadow-purple-900/10'
);

type CampFiltro = { id: number; nombre: string };
type RangoFiltro = { desde: string; hasta: string; label: string };

// ---------- tarjeta de stat ----------
function StatCard({ titulo, valor, sub, tono = 'neutral', Icon }: { titulo: string; valor: string; sub?: string; tono?: 'neutral' | 'up' | 'down' | 'auth'; Icon: LucideIcon }) {
  const tonos = {
    neutral: 'text-purple-700 dark:text-purple-200',
    up: 'text-emerald-600 dark:text-emerald-400',
    down: 'text-rose-600 dark:text-rose-400',
    auth: 'text-sky-600 dark:text-sky-400',
  };
  return (
    <article className={CARD}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-light tracking-wide text-purple-700 dark:text-purple-200">{titulo}</h3>
        <Icon className={cn('h-4 w-4', tonos[tono])} />
      </div>
      <p className={cn('mt-2 text-2xl font-semibold tabular-nums leading-none', tonos[tono])}>{valor}</p>
      {sub && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{sub}</p>}
    </article>
  );
}

// ---------- píldora de impacto ----------
function ImpactoPill({ caras }: { caras: number }) {
  if (caras === 0) return null;
  const sube = caras > 0;
  return (
    <span className={cn('flex items-center gap-0.5 rounded-lg px-2 py-1 text-sm font-semibold tabular-nums', sube ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/15 text-rose-700 dark:text-rose-300')}>
      {sube ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
      {Math.abs(caras)} caras
    </span>
  );
}

// ---------- fila del feed (clic abre detalle) ----------
function EventoRow({ e, nuevo, onAbrir }: { e: EventoHistorial; nuevo: boolean; onAbrir: (refId: number) => void }) {
  const meta = CAT_META[e.categoria] ?? CAT_META.otro;
  const { Icon } = meta;
  return (
    <li>
      <button
        onClick={() => e.refId && onAbrir(e.refId)}
        className={cn(
          'flex w-full items-start gap-3 rounded-xl border border-transparent px-2 py-2.5 text-left transition-colors',
          'hover:bg-purple-500/5',
          nuevo && 'animate-pulse border-purple-400/40 bg-purple-500/10'
        )}
      >
        <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', meta.color)}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug text-zinc-800 dark:text-zinc-100">{e.descripcion}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
            <span>{tiempoRelativo(e.fecha)}</span>
            {e.usuario && <span>· {e.usuario}</span>}
            {e.campania && (
              <span className="rounded-md bg-purple-500/10 px-1.5 py-0.5 font-medium text-purple-700 dark:text-purple-300">
                {e.campania}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <ImpactoPill caras={e.caras} />
          {e.monto != null && e.monto !== 0 && (
            <span className={cn('rounded-lg px-2 py-0.5 text-xs font-medium tabular-nums', e.monto > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
              {e.monto > 0 ? '+' : ''}
              {formatCurrency(e.monto)}
            </span>
          )}
        </div>
      </button>
    </li>
  );
}

// ---------- gráfica de actividad ----------
function ActividadChart({ resumen }: { resumen: ResumenHistorial }) {
  const isDark = useThemeStore((s) => s.theme) === 'dark';
  const ink = chartInk(isDark);
  const data = resumen.porDia.map((d) => ({ ...d, etiqueta: d.fecha.slice(5) }));
  return (
    <div className={CARD}>
      <h3 className="mb-2 text-xs font-light tracking-wide text-purple-700 dark:text-purple-200">Actividad por día (acciones)</h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={ink.grid} vertical={false} />
          <XAxis dataKey="etiqueta" tick={{ fill: ink.axis, fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={16} />
          <YAxis tick={{ fill: ink.axis, fontSize: 10 }} tickLine={false} axisLine={false} width={32} />
          <Tooltip
            cursor={{ fill: ink.cursor }}
            contentStyle={{ borderRadius: 12, border: 'none', background: isDark ? '#241633' : '#fff', color: isDark ? '#e4e4e7' : '#3f3f46', fontSize: 12 }}
            formatter={(v: unknown, _n, p: any) => [`${v} acciones · +${p?.payload?.carasAgregadas ?? 0} / -${p?.payload?.carasQuitadas ?? 0} caras`, p?.payload?.fecha]}
            labelFormatter={() => ''}
          />
          <Bar dataKey="eventos" radius={[4, 4, 0, 0]} maxBarSize={26}>
            {data.map((d) => (
              <Cell key={d.fecha} fill={d.neto >= 0 ? '#10b981' : '#8b5cf6'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------- barra de conteo (drill) ----------
function BarraConteo({ nombre, valor, max, activo, onClick }: { nombre: string; valor: number; max: number; activo: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group block w-full text-left">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className={cn('truncate', activo ? 'font-semibold text-purple-700 dark:text-purple-300' : 'text-zinc-600 dark:text-zinc-300')}>{nombre}</span>
        <span className="shrink-0 tabular-nums text-zinc-500 dark:text-zinc-400">{valor}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-purple-500/10">
        <div className={cn('h-full rounded-full transition-all', activo ? 'bg-purple-600' : 'bg-purple-400/60 group-hover:bg-purple-500')} style={{ width: `${Math.max(4, (valor / max) * 100)}%` }} />
      </div>
    </button>
  );
}

// ---------- modal de detalle ----------
function DetalleModal({ refId, onClose }: { refId: number; onClose: () => void }) {
  const [ctx, setCtx] = useState<ContextoHistorial | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    setCtx(null);
    setError(false);
    getContexto(refId).then(setCtx).catch(() => setError(true));
  }, [refId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-purple-200/50 bg-white shadow-2xl dark:border-purple-900/40 dark:bg-[#160e22]"
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-purple-100/60 p-4 dark:border-purple-900/30">
          <div className="min-w-0">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Propuesta / Campaña #{refId}</p>
            <h2 className="truncate text-lg font-semibold text-purple-700 dark:text-purple-200">
              {ctx?.campania ?? (error ? 'No se pudo cargar' : 'Cargando…')}
            </h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-zinc-500 hover:bg-purple-500/10">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!ctx ? (
          <div className="flex h-48 items-center justify-center">{error ? <p className="text-sm text-rose-500">Error al cargar</p> : <Spinner size="lg" />}</div>
        ) : (
          <div className="max-h-[calc(85vh-64px)] overflow-y-auto p-4">
            <div className="mb-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <Dato k="Cliente" v={ctx.cliente} />
              <Dato k="Asesor" v={ctx.asesor} />
              <Dato k="Marca" v={ctx.marca} />
              <Dato k="Status" v={ctx.status} />
              {ctx.inversion != null && <Dato k="Inversión" v={formatCurrency(ctx.inversion)} />}
            </div>
            {ctx.descripcion && (
              <p className="mb-4 rounded-lg bg-purple-500/5 p-2 text-xs text-zinc-600 dark:text-zinc-300">{ctx.descripcion}</p>
            )}
            <h3 className="mb-2 text-xs font-light uppercase tracking-wide text-purple-700 dark:text-purple-200">
              Línea de tiempo ({ctx.eventos.length})
            </h3>
            <ol className="relative space-y-3 border-l border-purple-200/50 pl-4 dark:border-purple-900/30">
              {ctx.eventos.map((e) => {
                const meta = CAT_META[e.categoria] ?? CAT_META.otro;
                return (
                  <li key={e.id} className="relative">
                    <span className={cn('absolute -left-[22px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full', meta.color)}>
                      <meta.Icon className="h-2.5 w-2.5" />
                    </span>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-zinc-700 dark:text-zinc-200">{e.descripcion}</p>
                      <ImpactoPill caras={e.caras} />
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      {new Date(e.fecha).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      {e.usuario && ` · ${e.usuario}`}
                    </p>
                  </li>
                );
              })}
              {!ctx.eventos.length && <li className="text-sm text-zinc-400">Sin acciones registradas</li>}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

function Dato({ k, v }: { k: string; v: string | null }) {
  if (!v) return null;
  return (
    <div>
      <span className="text-xs text-zinc-400">{k}</span>
      <p className="text-zinc-700 dark:text-zinc-200">{v}</p>
    </div>
  );
}

// ================= página =================
export function HistorialPage() {
  const [resumen, setResumen] = useState<ResumenHistorial | null>(null);
  const [eventos, setEventos] = useState<EventoHistorial[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categoria, setCategoria] = useState<CategoriaAccion | null>(null);
  const [soloImpacto, setSoloImpacto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [usuarioFiltro, setUsuarioFiltro] = useState('');

  const [drill, setDrill] = useState<'campana' | 'semana'>('campana');
  const [campFiltro, setCampFiltro] = useState<CampFiltro | null>(null);
  const [rango, setRango] = useState<RangoFiltro | null>(null);

  const [estadoWS, setEstadoWS] = useState<EstadoWS>('desconectado');
  const [detalleRef, setDetalleRef] = useState<number | null>(null);
  const nuevosRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    getResumenHistorial().then(setResumen).catch(() => setResumen(null));
  }, []);

  // feed (todo del lado del servidor)
  useEffect(() => {
    let vivo = true;
    setCargando(true);
    setError(null);
    getEventos({
      categoria,
      soloImpacto,
      usuario: usuarioFiltro || null,
      campaniaId: campFiltro?.id ?? null,
      desde: rango?.desde ?? null,
      hasta: rango?.hasta ?? null,
      limit: 200,
    })
      .then((ev) => vivo && setEventos(ev))
      .catch((e: unknown) => vivo && setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => vivo && setCargando(false));
    return () => {
      vivo = false;
    };
  }, [categoria, soloImpacto, usuarioFiltro, campFiltro, rango]);

  // WebSocket en vivo
  useEffect(() => {
    const pasa = (e: EventoHistorial) =>
      (!categoria || e.categoria === categoria) &&
      (!soloImpacto || e.caras !== 0 || e.monto) &&
      (!usuarioFiltro || (e.usuario ?? '').toLowerCase().includes(usuarioFiltro.toLowerCase())) &&
      (!campFiltro || e.campania === campFiltro.nombre);

    const off = suscribirEventos((nuevos) => {
      const filtrados = nuevos.filter(pasa);
      if (!filtrados.length) return;
      for (const e of filtrados) nuevosRef.current.add(e.id);
      setEventos((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        const add = filtrados.filter((e) => !ids.has(e.id)).sort((a, b) => b.id - a.id);
        return [...add, ...prev].slice(0, 400);
      });
      setTimeout(() => {
        for (const e of filtrados) nuevosRef.current.delete(e.id);
        setEventos((p) => [...p]);
      }, 3000);
    }, setEstadoWS);
    return off;
  }, [categoria, soloImpacto, usuarioFiltro, campFiltro]);

  const semanas = useMemo(() => {
    if (!resumen) return [] as { key: string; valor: number; desde: string; hasta: string }[];
    const m = new Map<string, { valor: number; min: string; max: string }>();
    for (const d of resumen.porDia) {
      const k = semanaKey(d.fecha);
      const e = m.get(k) ?? { valor: 0, min: d.fecha, max: d.fecha };
      e.valor += d.eventos;
      if (d.fecha < e.min) e.min = d.fecha;
      if (d.fecha > e.max) e.max = d.fecha;
      m.set(k, e);
    }
    return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([key, v]) => ({ key, valor: v.valor, desde: v.min, hasta: masDias(v.max, 1) }));
  }, [resumen]);

  const nf = (n: number) => n.toLocaleString('es-MX');

  return (
    <div className="min-w-0 flex-1">
      {detalleRef != null && <DetalleModal refId={detalleRef} onClose={() => setDetalleRef(null)} />}

      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-light tracking-wide text-purple-700 dark:text-purple-200">Historial de Acciones</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Qué se movió, quién y cuánto — en vivo. Pica cualquier acción para ver el detalle.</p>
        </div>
        <span className={cn('flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium', estadoWS === 'conectado' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-zinc-500/15 text-zinc-500 dark:text-zinc-400')}>
          <Radio className={cn('h-3.5 w-3.5', estadoWS === 'conectado' && 'animate-pulse')} />
          {estadoWS === 'conectado' ? 'En vivo' : 'Reconectando…'}
        </span>
      </div>

      {/* Stats */}
      {resumen && (
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard titulo="Acciones (45 d)" valor={nf(resumen.totalEventos)} Icon={Circle} sub="registros en el periodo" />
          <StatCard titulo="Caras quitadas" valor={nf(resumen.carasQuitadas)} tono="down" Icon={ArrowDown} sub="por eliminaciones" />
          <StatCard titulo="Caras aprobadas" valor={nf(resumen.carasAgregadas)} tono="up" Icon={ArrowUp} sub="por autorizaciones" />
          <StatCard titulo="Autorizaciones" valor={nf(resumen.autorizaciones.total)} tono="auth" Icon={ShieldCheck} sub={`${resumen.autorizaciones.dg} DG · ${resumen.autorizaciones.dcm} DCM · ${resumen.autorizaciones.rechazos} rechazos`} />
        </div>
      )}

      {resumen && (
        <div className="mb-4">
          <ActividadChart resumen={resumen} />
        </div>
      )}

      {/* Filtros */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {CHIPS.map((c) => (
          <button
            key={c.label}
            onClick={() => setCategoria(c.key)}
            className={cn('rounded-full px-3 py-1 text-xs font-medium transition-colors', categoria === c.key ? 'bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white shadow' : 'bg-purple-500/10 text-purple-700 hover:bg-purple-500/20 dark:text-purple-200')}
          >
            {c.label}
          </button>
        ))}
        <button onClick={() => setSoloImpacto((v) => !v)} className={cn('rounded-full px-3 py-1 text-xs font-medium transition-colors', soloImpacto ? 'bg-amber-500/20 text-amber-700 ring-1 ring-amber-500/40 dark:text-amber-300' : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-300')}>
          Solo impacto (±caras)
        </button>
        <form onSubmit={(ev) => { ev.preventDefault(); setUsuarioFiltro(busqueda.trim()); }} className="relative ml-auto">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar persona…" className="w-44 rounded-full border border-purple-200/60 bg-white/70 py-1 pl-8 pr-3 text-xs text-zinc-700 outline-none focus:border-purple-400 dark:border-purple-900/40 dark:bg-[#1a1025]/70 dark:text-zinc-200" />
        </form>
      </div>

      {/* filtros activos */}
      {(campFiltro || rango || usuarioFiltro) && (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-zinc-500 dark:text-zinc-400">Filtrando:</span>
          {campFiltro && (
            <button onClick={() => setCampFiltro(null)} className="rounded-full bg-purple-500/15 px-2 py-0.5 text-purple-700 dark:text-purple-300">{campFiltro.nombre} ✕</button>
          )}
          {rango && (
            <button onClick={() => setRango(null)} className="rounded-full bg-purple-500/15 px-2 py-0.5 text-purple-700 dark:text-purple-300">{rango.label} ✕</button>
          )}
          {usuarioFiltro && (
            <button onClick={() => { setUsuarioFiltro(''); setBusqueda(''); }} className="rounded-full bg-purple-500/15 px-2 py-0.5 text-purple-700 dark:text-purple-300">{usuarioFiltro} ✕</button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Feed */}
        <div className={cn(CARD, 'lg:col-span-2')}>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-light tracking-wide text-purple-700 dark:text-purple-200">Feed de acciones</h3>
            <span className="text-xs text-zinc-400">{eventos.length} mostradas</span>
          </div>
          {error ? (
            <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">No se pudo cargar: {error}</div>
          ) : cargando && !eventos.length ? (
            <div className="flex h-48 items-center justify-center"><Spinner size="lg" /></div>
          ) : (
            <ul className="max-h-[560px] divide-y divide-purple-100/40 overflow-y-auto pr-1 dark:divide-purple-900/20">
              {eventos.map((e) => (
                <EventoRow key={e.id} e={e} nuevo={nuevosRef.current.has(e.id)} onAbrir={setDetalleRef} />
              ))}
              {!eventos.length && <li className="py-8 text-center text-sm text-zinc-400">Sin acciones para este filtro</li>}
            </ul>
          )}
        </div>

        {/* Drill */}
        <div className={CARD}>
          <div className="mb-3 flex gap-1 rounded-lg bg-purple-500/10 p-1">
            <button onClick={() => setDrill('campana')} className={cn('flex flex-1 items-center justify-center gap-1 rounded-md py-1 text-xs font-medium', drill === 'campana' ? 'bg-white text-purple-700 shadow dark:bg-[#241633] dark:text-purple-200' : 'text-zinc-500')}>
              <Building2 className="h-3.5 w-3.5" /> Por campaña
            </button>
            <button onClick={() => setDrill('semana')} className={cn('flex flex-1 items-center justify-center gap-1 rounded-md py-1 text-xs font-medium', drill === 'semana' ? 'bg-white text-purple-700 shadow dark:bg-[#241633] dark:text-purple-200' : 'text-zinc-500')}>
              <CalendarDays className="h-3.5 w-3.5" /> Por semana
            </button>
          </div>

          {!resumen ? (
            <div className="flex h-40 items-center justify-center"><Spinner /></div>
          ) : drill === 'campana' ? (
            <div className="space-y-2.5">
              {resumen.topCampanias.map((c) => (
                <BarraConteo
                  key={c.id ?? c.nombre}
                  nombre={c.nombre}
                  valor={c.valor}
                  max={resumen.topCampanias[0]?.valor || 1}
                  activo={campFiltro?.id === c.id}
                  onClick={() => setCampFiltro(campFiltro?.id === c.id ? null : c.id != null ? { id: c.id, nombre: c.nombre } : null)}
                />
              ))}
              {!resumen.topCampanias.length && <p className="text-center text-xs text-zinc-400">Sin datos</p>}
            </div>
          ) : (
            <div className="space-y-2.5">
              {semanas.map((s) => (
                <BarraConteo
                  key={s.key}
                  nombre={s.key}
                  valor={s.valor}
                  max={semanas[0]?.valor || 1}
                  activo={rango?.label === s.key}
                  onClick={() => setRango(rango?.label === s.key ? null : { desde: s.desde, hasta: s.hasta, label: s.key })}
                />
              ))}
            </div>
          )}

          {resumen && (
            <div className="mt-4 border-t border-purple-100/40 pt-3 dark:border-purple-900/20">
              <h4 className="mb-2 text-xs font-light tracking-wide text-purple-700 dark:text-purple-200">Quién quitó más caras</h4>
              <div className="space-y-2.5">
                {resumen.topQuitadores.slice(0, 5).map((q) => (
                  <BarraConteo
                    key={q.nombre}
                    nombre={q.nombre}
                    valor={q.valor}
                    max={resumen.topQuitadores[0]?.valor || 1}
                    activo={usuarioFiltro === q.nombre}
                    onClick={() => { setBusqueda(q.nombre); setUsuarioFiltro(usuarioFiltro === q.nombre ? '' : q.nombre); }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
