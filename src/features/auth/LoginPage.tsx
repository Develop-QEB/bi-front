import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, LogIn, AlertCircle } from 'lucide-react';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';

export function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [ver, setVer] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await login(correo.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
      setCargando(false);
    }
  };

  return (
    <div className="bg-main-pattern relative flex min-h-svh items-center justify-center overflow-hidden p-4">
      {/* Orbes de fondo animados */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-72 w-72 animate-pulse rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 h-80 w-80 animate-pulse rounded-full bg-fuchsia-500/20 blur-3xl [animation-delay:1s]" />
        <div className="absolute left-1/3 top-1/2 h-64 w-64 animate-pulse rounded-full bg-cyan-400/10 blur-3xl [animation-delay:2s]" />
      </div>

      <div className="absolute right-4 top-4 z-10"><ThemeToggle /></div>

      <div className="relative z-10 w-full max-w-sm animate-[fadeInUp_0.5s_ease-out]">
        {/* Marca */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-2 shadow-lg shadow-purple-500/25 ring-1 ring-purple-200/60">
            <img src="/imagotipo.png" alt="QEB" className="h-full w-full object-contain" onError={(e) => { (e.currentTarget.style.display = 'none'); }} />
          </div>
          <h1 className="bg-gradient-to-r from-purple-600 to-fuchsia-500 bg-clip-text text-3xl font-bold tracking-tight text-transparent dark:from-purple-300 dark:to-fuchsia-300">
            QEBI
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Reportes de Ventas · QEB</p>
        </div>

        {/* Tarjeta */}
        <form
          onSubmit={submit}
          className={cn(
            'rounded-2xl border p-6 shadow-2xl backdrop-blur-xl',
            'border-purple-200/50 bg-white/80 shadow-purple-200/30',
            'dark:border-purple-900/40 dark:bg-[#1a1025]/80 dark:shadow-purple-900/20'
          )}
        >
          <h2 className="mb-1 text-lg font-semibold text-zinc-800 dark:text-white">Inicia sesión</h2>
          <p className="mb-5 text-xs text-zinc-500 dark:text-zinc-400">Con tu cuenta de QEB (mismo correo y contraseña).</p>

          {/* Correo */}
          <label className="mb-3 block">
            <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">Correo</span>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-400" />
              <input
                type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} autoFocus required
                placeholder="nombre.apellido@qeb.mx" autoComplete="username"
                className="w-full rounded-xl border border-purple-200/60 bg-white/70 py-2.5 pl-9 pr-3 text-sm text-zinc-800 outline-none transition-colors focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 dark:border-purple-900/40 dark:bg-[#241633]/70 dark:text-zinc-100"
              />
            </div>
          </label>

          {/* Contraseña */}
          <label className="mb-4 block">
            <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">Contraseña</span>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-400" />
              <input
                type={ver ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required
                placeholder="••••••••" autoComplete="current-password"
                className="w-full rounded-xl border border-purple-200/60 bg-white/70 py-2.5 pl-9 pr-10 text-sm text-zinc-800 outline-none transition-colors focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 dark:border-purple-900/40 dark:bg-[#241633]/70 dark:text-zinc-100"
              />
              <button type="button" onClick={() => setVer((v) => !v)} aria-label={ver ? 'Ocultar' : 'Mostrar'}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-400 hover:text-purple-500">
                {ver ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <button
            type="submit" disabled={cargando}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:shadow-purple-500/40 active:scale-[0.99] disabled:opacity-60"
          >
            {cargando ? (
              <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Entrando…</>
            ) : (
              <><LogIn className="h-4 w-4" /> Entrar</>
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] text-zinc-400 dark:text-zinc-500">
          Datos en vivo · QEB
        </p>
      </div>

      <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
