/**
 * URL base del backend (bi-back). En dev usa el back local; en el build de
 * producción, el back en Render. `VITE_API_URL` gana si se define.
 */
export const API_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? 'http://localhost:3001' : 'https://bi-back-96j5.onrender.com');

/** Misma base pero en ws:// o wss:// para el WebSocket del historial. */
export const WS_URL = API_URL.replace(/^http/, 'ws');
