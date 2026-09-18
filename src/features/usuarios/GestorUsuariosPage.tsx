import { useEffect, useState } from 'react';
import { UserPlus, KeyRound, Shield, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Spinner } from '../../components/ui/spinner';
import type { Permisos } from '../../store/authStore';
import {
  listarUsuarios, crearUsuario, actualizarUsuario, resetPasswordUsuario, type UsuarioAdmin,
} from '../../services/usuarios.service';

const CARD = cn('rounded-2xl border p-4 backdrop-blur-xl shadow-xl', 'border-purple-200/50 bg-white/90 dark:border-purple-900/30 dark:bg-[#1a1025]/90');
const PESTAÑAS: { key: keyof Permisos; label: string }[] = [
  { key: 'bi', label: 'BI' }, { key: 'variaciones', label: 'Variaciones' },
  { key: 'embudo', label: 'Embudo' }, { key: 'objetivos', label: 'Objetivos' },
];

export function GestorUsuariosPage() {
  const [users, setUsers] = useState<UsuarioAdmin[] | null>(null);
  const [error, setError] = useState('');
  const [nuevo, setNuevo] = useState(false);
  const [resetId, setResetId] = useState<number | null>(null);

  const cargar = () => listarUsuarios().then(setUsers).catch((e) => setError(e.message));
  useEffect(() => { cargar(); }, []);

  const togglePermiso = async (u: UsuarioAdmin, k: keyof Permisos) => {
    const permisos = { ...u.permisos, [k]: !u.permisos[k] };
    setUsers((prev) => prev?.map((x) => (x.id === u.id ? { ...x, permisos } : x)) ?? null);
    try { await actualizarUsuario(u.id, { permisos: { [k]: permisos[k] } }); } catch { cargar(); }
  };
  const toggle = async (u: UsuarioAdmin, campo: 'esAdmin' | 'activo') => {
    const val = !u[campo];
    setUsers((prev) => prev?.map((x) => (x.id === u.id ? { ...x, [campo]: val } : x)) ?? null);
    try { await actualizarUsuario(u.id, { [campo]: val }); } catch { cargar(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-white">Gestor de usuarios</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Roles, permisos por pestaña y contraseñas · usuarios exclusivos de QEBI.</p>
        </div>
        <button onClick={() => setNuevo(true)} className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40">
          <UserPlus className="h-4 w-4" /> Nuevo usuario
        </button>
      </div>

      {error && <p className="text-sm text-rose-500">{error}</p>}
      {!users ? (
        <div className="flex h-48 items-center justify-center"><Spinner size="lg" /></div>
      ) : (
        <div className={CARD}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="text-left text-xs text-zinc-400">
                  <th className="py-2 pr-2">Usuario</th>
                  <th className="py-2 pr-2 text-center">Admin</th>
                  {PESTAÑAS.map((p) => <th key={p.key} className="py-2 pr-2 text-center">{p.label}</th>)}
                  <th className="py-2 pr-2 text-center">Activo</th>
                  <th className="py-2 text-right">Contraseña</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className={cn('border-t border-purple-100/40 dark:border-purple-900/20', !u.activo && 'opacity-50')}>
                    <td className="py-2 pr-2">
                      <div className="font-medium text-zinc-700 dark:text-zinc-200">{u.nombre}</div>
                      <div className="text-[11px] text-zinc-500">{u.correo}</div>
                    </td>
                    <td className="py-2 pr-2 text-center">
                      <button onClick={() => toggle(u, 'esAdmin')} title="Admin" className={cn('inline-flex h-6 w-6 items-center justify-center rounded-lg', u.esAdmin ? 'bg-purple-500 text-white' : 'bg-zinc-500/10 text-zinc-400')}>
                        <Shield className="h-3.5 w-3.5" />
                      </button>
                    </td>
                    {PESTAÑAS.map((p) => (
                      <td key={p.key} className="py-2 pr-2 text-center">
                        <input type="checkbox" checked={u.esAdmin || u.permisos[p.key]} disabled={u.esAdmin} onChange={() => togglePermiso(u, p.key)} className="h-4 w-4 accent-purple-600 disabled:opacity-50" title={u.esAdmin ? 'Admin ve todo' : p.label} />
                      </td>
                    ))}
                    <td className="py-2 pr-2 text-center">
                      <button onClick={() => toggle(u, 'activo')} className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', u.activo ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-zinc-500/15 text-zinc-500')}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="py-2 text-right">
                      <button onClick={() => setResetId(u.id)} title="Resetear contraseña" className="inline-flex items-center gap-1 rounded-lg border border-purple-200/60 px-2 py-1 text-xs text-purple-700 hover:bg-purple-500/10 dark:border-purple-900/40 dark:text-purple-200">
                        <KeyRound className="h-3.5 w-3.5" /> Reset
                      </button>
                    </td>
                  </tr>
                ))}
                {!users.length && <tr><td colSpan={8} className="py-6 text-center text-xs text-zinc-400">Sin usuarios</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {nuevo && <ModalNuevo onClose={() => setNuevo(false)} onSaved={() => { setNuevo(false); cargar(); }} />}
      {resetId != null && <ModalReset id={resetId} onClose={() => setResetId(null)} onSaved={() => setResetId(null)} />}
    </div>
  );
}

function ModalShell({ titulo, onClose, children }: { titulo: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className={cn(CARD, 'w-full max-w-sm !shadow-2xl')} onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-zinc-800 dark:text-white">{titulo}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:text-zinc-600"><X className="h-4 w-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputCls = 'w-full rounded-xl border border-purple-200/60 bg-white/70 px-3 py-2 text-sm outline-none focus:border-purple-400 dark:border-purple-900/40 dark:bg-[#241633]/70 dark:text-zinc-100';

function ModalNuevo({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [esAdmin, setEsAdmin] = useState(false);
  const [permisos, setPermisos] = useState<Permisos>({ bi: true, variaciones: true, embudo: true, objetivos: false });
  const [err, setErr] = useState('');
  const [guardando, setGuardando] = useState(false);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setGuardando(true);
    try { await crearUsuario({ nombre, correo: correo.trim(), password, esAdmin, permisos }); onSaved(); }
    catch (x) { setErr(x instanceof Error ? x.message : 'Error'); setGuardando(false); }
  };
  return (
    <ModalShell titulo="Nuevo usuario" onClose={onClose}>
      <form onSubmit={guardar} className="space-y-3">
        <input className={inputCls} placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required autoFocus />
        <input className={inputCls} type="email" placeholder="Correo" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
        <input className={inputCls} placeholder="Contraseña (mín. 6)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
          <input type="checkbox" checked={esAdmin} onChange={(e) => setEsAdmin(e.target.checked)} className="h-4 w-4 accent-purple-600" /> Administrador (ve todo + gestiona)
        </label>
        {!esAdmin && (
          <div className="flex flex-wrap gap-3 rounded-xl bg-purple-500/5 p-2 text-xs">
            {PESTAÑAS.map((p) => (
              <label key={p.key} className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-200">
                <input type="checkbox" checked={permisos[p.key]} onChange={(e) => setPermisos((v) => ({ ...v, [p.key]: e.target.checked }))} className="h-4 w-4 accent-purple-600" /> {p.label}
              </label>
            ))}
          </div>
        )}
        {err && <p className="text-xs text-rose-500">{err}</p>}
        <button disabled={guardando} className="w-full rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {guardando ? 'Guardando…' : 'Crear usuario'}
        </button>
      </form>
    </ModalShell>
  );
}

function ModalReset({ id, onClose, onSaved }: { id: number; onClose: () => void; onSaved: () => void }) {
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [guardando, setGuardando] = useState(false);
  const guardar = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setGuardando(true);
    try { await resetPasswordUsuario(id, password); onSaved(); }
    catch (x) { setErr(x instanceof Error ? x.message : 'Error'); setGuardando(false); }
  };
  return (
    <ModalShell titulo="Resetear contraseña" onClose={onClose}>
      <form onSubmit={guardar} className="space-y-3">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Escribe la nueva contraseña para este usuario.</p>
        <input className={inputCls} placeholder="Nueva contraseña (mín. 6)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoFocus />
        {err && <p className="text-xs text-rose-500">{err}</p>}
        <button disabled={guardando} className="w-full rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {guardando ? 'Guardando…' : 'Guardar contraseña'}
        </button>
      </form>
    </ModalShell>
  );
}
