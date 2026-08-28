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
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { Spinner } from '../../components/ui/spinner';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/format';
import { chartInk } from '../../lib/chartTheme';
import { useThemeStore } from '../../store/themeStore';
import { getEventos, getResumenHistorial, suscribirEventos, type EstadoWS } from '../../services/historial.service';
import type { CategoriaAccion, EventoHistorial, ResumenHistorial } from '../../types/historial';

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

const CARD = cn(
  'rounded-2xl border p-4 backdrop-blur-xl shadow-xl',
  'border-purple-200/50 bg-white/90 shadow-purple-100/20',
  'dark:border-purple-900/30 dark:bg-[#1a1025]/90 dark:shadow-purple-900/10'
);

// ---------- tarjeta de stat ----------
function StatCard({
  titulo,
  valor,
  sub,
  tono = 'neutral',
  Icon,
}: {
  titulo: string;
  valor: string;
  sub?: string;
  tono?: 'neutral' | 'up' | 'down' | 'auth';
  Icon: LucideIcon;
}) {
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

// ---------- fila del feed ----------
function EventoRow({ e, nuevo, onCampania }: { e: EventoHistorial; nuevo: boolean; onCampania: (c: string) => void }) {
  const meta = CAT_META[e.categoria] ?? CAT_META.otro;
  const { Icon } = meta;
  const sube = e.caras > 0;
  const baja = e.caras < 0;
  return (
    <li
      className={cn(
        'flex items-start gap-3 rounded-xl border border-transparent px-2 py-2.5 transition-colors',
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
            <button
              onClick={() => onCampania(e.campania!)}
              className="rounded-md bg-purple-500/10 px-1.5 py-0.5 text-purple-700 hover:bg-purple-500/20 dark:text-purple-300"
            >
              {e.campania}
            </button>
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {(sube || baja) && (
          <span
            className={cn(
              'flex items-center gap-0.5 rounded-lg px-2 py-1 text-sm font-semibold tabular-nums',
              sube ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
            )}
          >
            {sube ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
            {Math.abs(e.caras)} caras
          </span>
        )}
        {e.monto != null && e.monto !== 0 && (
          <span
            className={cn(
              'rounded-lg px-2 py-0.5 text-xs font-medium tabular-nums',
              e.monto > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            )}
          >
            {e.monto > 0 ? '+' : ''}
            {formatCurrency(e.monto)}
          </span>
        )}
      </div>
    </li>
  );
}

// ---------- gráfica de actividad diaria ----------
function ActividadChart({ resumen, onDia }: { resumen: ResumenHistorial; onDia: (fecha: string) => void }) {
  const isDark = useThemeStore((s) => s.theme) === 'dark';
  const ink = chartInk(isDark);
  const data = resumen.porDia.map((d) => ({
    ...d,
    etiqueta: d.fecha.slice(5), // MM-DD
  }));
  return (
    <div className={CARD}>
      <h3 className="mb-2 text-xs font-light tracking-wide text-purple-700 dark:text-purple-200">
        Actividad por día (acciones)
      </h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={ink.grid} vertical={false} />
          <XAxis dataKey="etiqueta" tick={{ fill: ink.axis, fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={16} />
          <YAxis tick={{ fill: ink.axis, fontSize: 10 }} tickLine={false} axisLine={false} width={32} />
          <Tooltip
            cursor={{ fill: ink.cursor }}
            contentStyle={{
              borderRadius: 12,
              border: 'none',
              background: isDark ? '#241633' : '#fff',
              color: isDark ? '#e4e4e7' : '#3f3f46',
              fontSize: 12,
            }}
            formatter={(v: unknown, _n, p: any) => [
              `${v} acciones · +${p?.payload?.carasAgregadas ?? 0} / -${p?.payload?.carasQuitadas ?? 0} caras`,
              p?.payload?.fecha,
            ]}
            labelFormatter={() => ''}
          />
          <Bar dataKey="eventos" radius={[4, 4, 0, 0]} maxBarSize={26} onClick={(d: any) => d?.fecha && onDia(d.fecha)} cursor="pointer">
            {data.map((d) => (
              <Cell key={d.fecha} fill={d.neto >= 0 ? '#10b981' : '#8b5cf6'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-1 text-center text-[11px] text-zinc-400">Pica una barra para filtrar por ese día</p>
    </div>
  );
}

// ---------- panel de drill (campañas / semanas) ----------
function BarraConteo({
  nombre,
  valor,
  max,
  activo,
  onClick,
}: {
  nombre: string;
  valor: number;
  max: number;
  activo: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="group block w-full text-left">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className={cn('truncate', activo ? 'font-semibold text-purple-700 dark:text-purple-300' : 'text-zinc-600 dark:text-zinc-300')}>
          {nombre}
        </span>
        <span className="shrink-0 tabular-nums text-zinc-500 dark:text-zinc-400">{valor}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-purple-500/10">
        <div
          className={cn('h-full rounded-full transition-all', activo ? 'bg-purple-600' : 'bg-purple-400/60 group-hover:bg-purple-500')}
          style={{ width: `${Math.max(4, (valor / max) * 100)}%` }}
        />
      </div>
    </button>
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
  const [campaniaSel, setCampaniaSel] = useState<string | null>(null);
  const [semanaSel, setSemanaSel] = useState<string | null>(null);

  const [estadoWS, setEstadoWS] = useState<EstadoWS>('desconectado');
  const nuevosRef = useRef<Set<number>>(new Set());

  // resumen (una vez)
  useEffect(() => {
    getResumenHistorial().then(setResumen).catch(() => setResumen(null));
  }, []);

  // feed según filtros de servidor
  useEffect(() => {
    let vivo = true;
    setCargando(true);
    setError(null);
    getEventos({ categoria, soloImpacto, usuario: usuarioFiltro || null, limit: 150 })
      .then((ev) => vivo && setEventos(ev))
      .catch((e: unknown) => vivo && setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => vivo && setCargando(false));
    return () => {
      vivo = false;
    };
  }, [categoria, soloImpacto, usuarioFiltro]);

  // WebSocket en vivo
  useEffect(() => {
    const pasa = (e: EventoHistorial) =>
      (!categoria || e.categoria === categoria) &&
      (!soloImpacto || e.caras !== 0 || e.monto) &&
      (!usuarioFiltro || (e.usuario ?? '').toLowerCase().includes(usuarioFiltro.toLowerCase()));

    const off = suscribirEventos((nuevos) => {
      const filtrados = nuevos.filter(pasa);
      if (!filtrados.length) return;
      for (const e of filtrados) nuevosRef.current.add(e.id);
      setEventos((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        const add = filtrados.filter((e) => !ids.has(e.id)).sort((a, b) => b.id - a.id);
        return [...add, ...prev].slice(0, 300);
      });
      // limpiar el resaltado después de un rato
      setTimeout(() => {
        for (const e of filtrados) nuevosRef.current.delete(e.id);
        setEventos((p) => [...p]);
      }, 3000);
    }, setEstadoWS);
    return off;
  }, [categoria, soloImpacto, usuarioFiltro]);

  const semanas = useMemo(() => {
    if (!resumen) return [] as { nombre: string; valor: number; eventos: number }[];
    const m = new Map<string, number>();
    for (const d of resumen.porDia) m.set(semanaKey(d.fecha), (m.get(semanaKey(d.fecha)) ?? 0) + d.eventos);
    return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([nombre, valor]) => ({ nombre, valor, eventos: valor }));
  }, [resumen]);

  const eventosVisibles = useMemo(
    () =>
      eventos.filter(
        (e) => (!campaniaSel || e.campania === campaniaSel) && (!semanaSel || semanaKey(e.fecha) === semanaSel)
      ),
    [eventos, campaniaSel, semanaSel]
  );

  const nf = (n: number) => n.toLocaleString('es-MX');

  return (
    <div className="min-w-0 flex-1">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-light tracking-wide text-purple-700 dark:text-purple-200">Historial de Acciones</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Qué se movió, quién y cuánto — en vivo</p>
        </div>
        <span
          className={cn(
            'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
            estadoWS === 'conectado'
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
              : 'bg-zinc-500/15 text-zinc-500 dark:text-zinc-400'
          )}
        >
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
          <StatCard
            titulo="Autorizaciones"
            valor={nf(resumen.autorizaciones.total)}
            tono="auth"
            Icon={ShieldCheck}
            sub={`${resumen.autorizaciones.dg} DG · ${resumen.autorizaciones.dcm} DCM · ${resumen.autorizaciones.rechazos} rechazos`}
          />
        </div>
      )}

      {/* Chart */}
      {resumen && (
        <div className="mb-4">
          <ActividadChart resumen={resumen} onDia={() => {}} />
        </div>
      )}

      {/* Filtros */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {CHIPS.map((c) => (
          <button
            key={c.label}
            onClick={() => setCategoria(c.key)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              categoria === c.key
                ? 'bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white shadow'
                : 'bg-purple-500/10 text-purple-700 hover:bg-purple-500/20 dark:text-purple-200'
            )}
          >
            {c.label}
          </button>
        ))}
        <button
          onClick={() => setSoloImpacto((v) => !v)}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium transition-colors',
            soloImpacto ? 'bg-amber-500/20 text-amber-700 ring-1 ring-amber-500/40 dark:text-amber-300' : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-300'
          )}
        >
          Solo impacto (±caras)
        </button>
        <form
          onSubmit={(ev) => {
            ev.preventDefault();
            setUsuarioFiltro(busqueda.trim());
          }}
          className="relative ml-auto"
        >
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar persona…"
            className="w-44 rounded-full border border-purple-200/60 bg-white/70 py-1 pl-8 pr-3 text-xs text-zinc-700 outline-none focus:border-purple-400 dark:border-purple-900/40 dark:bg-[#1a1025]/70 dark:text-zinc-200"
          />
        </form>
      </div>

      {/* selección activa */}
      {(campaniaSel || semanaSel) && (
        <div className="mb-3 flex items-center gap-2 text-xs">
          <span className="text-zinc-500 dark:text-zinc-400">Filtrando:</span>
          {campaniaSel && (
            <button onClick={() => setCampaniaSel(null)} className="rounded-full bg-purple-500/15 px-2 py-0.5 text-purple-700 dark:text-purple-300">
              {campaniaSel} ✕
            </button>
          )}
          {semanaSel && (
            <button onClick={() => setSemanaSel(null)} className="rounded-full bg-purple-500/15 px-2 py-0.5 text-purple-700 dark:text-purple-300">
              {semanaSel} ✕
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Feed */}
        <div className={cn(CARD, 'lg:col-span-2')}>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-light tracking-wide text-purple-700 dark:text-purple-200">Feed de acciones</h3>
            <span className="text-xs text-zinc-400">{eventosVisibles.length} mostradas</span>
          </div>
          {error ? (
            <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              No se pudo cargar: {error}
            </div>
          ) : cargando && !eventos.length ? (
            <div className="flex h-48 items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <ul className="max-h-[560px] divide-y divide-purple-100/40 overflow-y-auto pr-1 dark:divide-purple-900/20">
              {eventosVisibles.map((e) => (
                <EventoRow key={e.id} e={e} nuevo={nuevosRef.current.has(e.id)} onCampania={setCampaniaSel} />
              ))}
              {!eventosVisibles.length && <li className="py-8 text-center text-sm text-zinc-400">Sin acciones para este filtro</li>}
            </ul>
          )}
        </div>

        {/* Drill */}
        <div className={CARD}>
          <div className="mb-3 flex gap-1 rounded-lg bg-purple-500/10 p-1">
            <button
              onClick={() => setDrill('campana')}
              className={cn('flex flex-1 items-center justify-center gap-1 rounded-md py-1 text-xs font-medium', drill === 'campana' ? 'bg-white text-purple-700 shadow dark:bg-[#241633] dark:text-purple-200' : 'text-zinc-500')}
            >
              <Building2 className="h-3.5 w-3.5" /> Por campaña
            </button>
            <button
              onClick={() => setDrill('semana')}
              className={cn('flex flex-1 items-center justify-center gap-1 rounded-md py-1 text-xs font-medium', drill === 'semana' ? 'bg-white text-purple-700 shadow dark:bg-[#241633] dark:text-purple-200' : 'text-zinc-500')}
            >
              <CalendarDays className="h-3.5 w-3.5" /> Por semana
            </button>
          </div>

          {!resumen ? (
            <div className="flex h-40 items-center justify-center"><Spinner /></div>
          ) : drill === 'campana' ? (
            <div className="space-y-2.5">
              {resumen.topCampanias.map((c) => (
                <BarraConteo
                  key={c.nombre}
                  nombre={c.nombre}
                  valor={c.valor}
                  max={resumen.topCampanias[0]?.valor || 1}
                  activo={campaniaSel === c.nombre}
                  onClick={() => setCampaniaSel(campaniaSel === c.nombre ? null : c.nombre)}
                />
              ))}
              {!resumen.topCampanias.length && <p className="text-center text-xs text-zinc-400">Sin datos</p>}
            </div>
          ) : (
            <div className="space-y-2.5">
              {semanas.map((s) => (
                <BarraConteo
                  key={s.nombre}
                  nombre={s.nombre}
                  valor={s.valor}
                  max={semanas[0]?.valor || 1}
                  activo={semanaSel === s.nombre}
                  onClick={() => setSemanaSel(semanaSel === s.nombre ? null : s.nombre)}
                />
              ))}
            </div>
          )}

          {/* Top quitadores */}
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
                    onClick={() => {
                      setBusqueda(q.nombre);
                      setUsuarioFiltro(usuarioFiltro === q.nombre ? '' : q.nombre);
                    }}
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
