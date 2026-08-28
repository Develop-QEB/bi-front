import { API_URL, WS_URL } from '../lib/api';
import type { EventoHistorial, FiltrosHistorial, ResumenHistorial } from '../types/historial';

function qs(f: Partial<FiltrosHistorial>): string {
  const p = new URLSearchParams();
  if (f.categoria) p.set('categoria', f.categoria);
  if (f.campaniaId) p.set('campaniaId', String(f.campaniaId));
  if (f.usuario) p.set('usuario', f.usuario);
  if (f.soloImpacto) p.set('soloImpacto', '1');
  if (f.desde) p.set('desde', f.desde);
  if (f.hasta) p.set('hasta', f.hasta);
  if (f.limit) p.set('limit', String(f.limit));
  return p.toString();
}

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`El back respondió ${res.status} en ${path}`);
  return (await res.json()) as T;
}

export function getEventos(f: Partial<FiltrosHistorial>): Promise<EventoHistorial[]> {
  return getJSON<EventoHistorial[]>(`/historial/eventos?${qs(f)}`);
}

export function getResumenHistorial(f: Partial<FiltrosHistorial> = {}): Promise<ResumenHistorial> {
  return getJSON<ResumenHistorial>(`/historial/resumen?${qs(f)}`);
}

export type EstadoWS = 'conectado' | 'desconectado';

/**
 * Suscripción en vivo a eventos nuevos del historial (WebSocket con reconexión).
 * Devuelve una función para cancelar la suscripción.
 */
export function suscribirEventos(
  onEventos: (eventos: EventoHistorial[]) => void,
  onEstado: (estado: EstadoWS) => void
): () => void {
  let ws: WebSocket | null = null;
  let cerrado = false;
  let reconnect: ReturnType<typeof setTimeout> | null = null;

  const conectar = () => {
    if (cerrado) return;
    ws = new WebSocket(`${WS_URL}/ws/historial`);

    ws.onopen = () => onEstado('conectado');
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data as string);
        if (msg.tipo === 'conectado') onEstado('conectado');
        if (msg.tipo === 'eventos' && Array.isArray(msg.eventos)) onEventos(msg.eventos);
      } catch {
        /* ignora mensajes no-JSON */
      }
    };
    ws.onclose = () => {
      onEstado('desconectado');
      if (!cerrado) reconnect = setTimeout(conectar, 3000);
    };
    ws.onerror = () => ws?.close();
  };

  conectar();
  return () => {
    cerrado = true;
    if (reconnect) clearTimeout(reconnect);
    ws?.close();
  };
}
