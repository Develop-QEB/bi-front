import { useEffect, useRef, useState } from 'react';
import { suscribirEventos, type EstadoWS } from '../services/historial.service';

/**
 * Suscribe la vista al WebSocket del historial (`/ws/historial`). Cada vez que
 * llegan eventos nuevos (ediciones, aprobaciones, altas, POST a SAP…) dispara
 * `onPing` — con debounce para coalescer ráfagas — para que la vista re-cargue
 * sus datos (KPIs, gráficas, tablas) en vivo. Devuelve el estado de conexión.
 */
export function useLiveRefresh(onPing: () => void, debounceMs = 800): EstadoWS {
  const [estado, setEstado] = useState<EstadoWS>('desconectado');
  const cb = useRef(onPing);
  cb.current = onPing;

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null;
    const unsub = suscribirEventos(
      () => {
        if (t) clearTimeout(t);
        t = setTimeout(() => cb.current(), debounceMs);
      },
      setEstado
    );
    return () => {
      if (t) clearTimeout(t);
      unsub();
    };
  }, [debounceMs]);

  return estado;
}
