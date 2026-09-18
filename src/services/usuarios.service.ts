import { authFetch } from '../lib/api';
import type { Permisos } from '../store/authStore';

export interface UsuarioAdmin {
  id: number;
  nombre: string;
  correo: string;
  esAdmin: boolean;
  activo: boolean;
  permisos: Permisos;
}

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await authFetch(path, init);
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try { msg = (await res.json()).error ?? msg; } catch { /* noop */ }
    throw new Error(msg);
  }
  return (await res.json()) as T;
}
const post = (path: string, body: unknown) =>
  json(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

export const listarUsuarios = () => json<UsuarioAdmin[]>('/usuarios');

export const crearUsuario = (u: { nombre: string; correo: string; password: string; esAdmin: boolean; permisos: Permisos }) =>
  post('/usuarios', u);

export const actualizarUsuario = (id: number, u: { nombre?: string; esAdmin?: boolean; activo?: boolean; permisos?: Partial<Permisos> }) =>
  json(`/usuarios/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(u) });

export const resetPasswordUsuario = (id: number, password: string) =>
  post(`/usuarios/${id}/password`, { password });

export const cambiarMiPassword = (actual: string, nueva: string) =>
  post('/auth/cambiar-password', { actual, nueva });
