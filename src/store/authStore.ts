import { create } from 'zustand';
import { API_URL, getToken, setToken, clearToken } from '../lib/api';

export interface Permisos { bi: boolean; variaciones: boolean; embudo: boolean; objetivos: boolean }
export interface Usuario {
  userId: number;
  nombre: string;
  email: string;
  esAdmin: boolean;
  permisos: Permisos;
}

const PERMISOS_VACIOS: Permisos = { bi: false, variaciones: false, embudo: false, objetivos: false };

interface AuthState {
  token: string | null;
  user: Usuario | null;
  cargando: boolean;
  login: (correo: string, password: string) => Promise<void>;
  logout: () => void;
  hidratar: () => Promise<void>;
}

function normalizar(u: Partial<Usuario> | undefined): Usuario {
  return {
    userId: u?.userId ?? 0,
    nombre: u?.nombre ?? '',
    email: u?.email ?? '',
    esAdmin: !!u?.esAdmin,
    permisos: { ...PERMISOS_VACIOS, ...(u?.permisos ?? {}) },
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  token: getToken(),
  user: null,
  cargando: true,

  async login(correo, password) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, password }),
    });
    if (!res.ok) throw new Error(res.status === 401 ? 'Correo o contraseña incorrectos' : 'No se pudo iniciar sesión');
    const data = (await res.json()) as { token: string; user: Partial<Usuario> };
    setToken(data.token);
    set({ token: data.token, user: normalizar(data.user), cargando: false });
  },

  logout() {
    clearToken();
    set({ token: null, user: null, cargando: false });
  },

  async hidratar() {
    const token = getToken();
    if (!token) { set({ token: null, user: null, cargando: false }); return; }
    try {
      const res = await fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('sesión inválida');
      const data = (await res.json()) as { user: Partial<Usuario> };
      set({ token, user: normalizar(data.user), cargando: false });
    } catch {
      clearToken();
      set({ token: null, user: null, cargando: false });
    }
  },
}));
