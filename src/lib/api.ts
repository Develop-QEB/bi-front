/**
 * URL base del backend (bi-back) + manejo de sesión (JWT).
 */
export const API_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? 'http://localhost:3001' : 'https://bi-back-96j5.onrender.com');

/** Misma base pero en ws:// o wss:// para el WebSocket del historial. */
export const WS_URL = API_URL.replace(/^http/, 'ws');

const TOKEN_KEY = 'qebi_token';

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function setToken(token: string): void {
  try { localStorage.setItem(TOKEN_KEY, token); } catch { /* private mode */ }
}
export function clearToken(): void {
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* private mode */ }
}

/** Se dispara cuando el back responde 401 (sesión expirada/inválida). */
type Handler = () => void;
let onUnauthorized: Handler | null = null;
export function setOnUnauthorized(h: Handler | null): void { onUnauthorized = h; }

/**
 * Indicador global de carga: cuenta las peticiones en curso para pintar una barra
 * de progreso arriba (ver TopLoadingBar). Cada quien se suscribe con onLoading.
 */
let peticionesEnCurso = 0;
const loadingSubs = new Set<(n: number) => void>();
function notificarCarga(): void { loadingSubs.forEach((f) => f(peticionesEnCurso)); }
/** Suscribe un callback al # de peticiones en curso. Devuelve la baja. */
export function onLoading(cb: (n: number) => void): () => void {
  loadingSubs.add(cb);
  cb(peticionesEnCurso);
  return () => { loadingSubs.delete(cb); };
}

/**
 * fetch al backend con la base URL + Authorization: Bearer. Si el back responde
 * 401, limpia el token y avisa (para volver al login). Cuenta peticiones en curso
 * para el indicador de carga global.
 */
export async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  peticionesEnCurso += 1; notificarCarga();
  try {
    const res = await fetch(`${API_URL}${path}`, { ...init, headers });
    if (res.status === 401) {
      clearToken();
      onUnauthorized?.();
    }
    return res;
  } finally {
    peticionesEnCurso = Math.max(0, peticionesEnCurso - 1); notificarCarga();
  }
}
