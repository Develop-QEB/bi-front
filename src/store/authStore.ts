import { create } from 'zustand';
import { API_URL, getToken, setToken, clearToken } from '../lib/api';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  area?: string | null;
  puesto?: string | null;
  foto_perfil?: string | null;
}

interface AuthState {
  token: string | null;
  user: Usuario | null;
  cargando: boolean; // verificando sesión al arrancar
  login: (correo: string, password: string) => Promise<void>;
  logout: () => void;
  hidratar: () => Promise<void>;
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
    if (!res.ok) {
      throw new Error(res.status === 401 ? 'Correo o contraseña incorrectos' : 'No se pudo iniciar sesión');
    }
    const data = (await res.json()) as { token: string; user: Usuario };
    setToken(data.token);
    set({ token: data.token, user: data.user, cargando: false });
  },

  logout() {
    clearToken();
    set({ token: null, user: null, cargando: false });
  },

  // Al arrancar: si hay token, valida contra /auth/me; si no, queda deslogueado.
  async hidratar() {
    const token = getToken();
    if (!token) { set({ token: null, user: null, cargando: false }); return; }
    try {
      const res = await fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('sesión inválida');
      const data = (await res.json()) as { user: { nombre?: string; email?: string; rol?: string } };
      const u = data.user ?? {};
      set({
        token,
        user: { id: 0, nombre: u.nombre ?? '', email: u.email ?? '', rol: u.rol ?? 'Normal' },
        cargando: false,
      });
    } catch {
      clearToken();
      set({ token: null, user: null, cargando: false });
    }
  },
}));
