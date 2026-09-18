import { useEffect, useRef } from 'react';

/**
 * Cierra un menú/panel cuando cambia la ORIENTACIÓN o el ANCHO del viewport
 * (voltear el celular). Ignora cambios de solo alto para NO cerrarlo al hacer
 * scroll — en móvil la barra de URL aparece/desaparece y dispara `resize` por
 * alto. Sólo se suscribe mientras `activo` es true.
 */
export function useCloseOnRotate(activo: boolean, cerrar: () => void) {
  const ref = useRef(cerrar);
  ref.current = cerrar;
  useEffect(() => {
    if (!activo) return;
    let w = window.innerWidth;
    const onOrient = () => ref.current();
    const onResize = () => {
      if (window.innerWidth !== w) { w = window.innerWidth; ref.current(); }
    };
    window.addEventListener('orientationchange', onOrient);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('orientationchange', onOrient);
      window.removeEventListener('resize', onResize);
    };
  }, [activo]);
}
