import { useEffect, useState } from 'react';
import { onLoading } from '../../lib/api';
import { cn } from '../../lib/utils';

/**
 * Barra de progreso indeterminada fija arriba. Aparece cuando hay peticiones al
 * back en curso (via authFetch/onLoading). Anti-parpadeo: solo se muestra si la
 * carga dura más de 120 ms, para no destellar en respuestas instantáneas.
 */
export function TopLoadingBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const off = onLoading((n) => {
      if (n > 0) {
        if (!t && !visible) t = setTimeout(() => { setVisible(true); t = undefined; }, 120);
      } else {
        if (t) { clearTimeout(t); t = undefined; }
        setVisible(false);
      }
    });
    return () => { if (t) clearTimeout(t); off(); };
  }, [visible]);

  return (
    <div
      className={cn('pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] overflow-hidden transition-opacity duration-300', visible ? 'opacity-100' : 'opacity-0')}
      aria-hidden
    >
      <div
        className="h-full w-1/3 rounded-r-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.6)]"
        style={{ animation: 'qebi-loading 1.1s ease-in-out infinite' }}
      />
      <style>{`@keyframes qebi-loading { 0% { transform: translateX(-110%); } 60% { transform: translateX(220%); } 100% { transform: translateX(420%); } }`}</style>
    </div>
  );
}
