/**
 * Píldora de porcentaje dibujada encima de un grupo de barras.
 *
 * En el Power BI original el % vive en una etiqueta verde sobre la barra, no
 * como serie graficada. Replicarlo así nos deja con UN solo eje Y en vez de un
 * eje dual — que además de ser mala práctica, es lo que vuelve engañoso al
 * original cuando las dos escalas no coinciden.
 *
 * El color es de ESTADO (cumplimiento), no de serie: nunca se reutiliza para
 * identificar una serie más.
 */

interface PillTone {
  bg: string;
  fg: string;
}

function tono(pct: number, isDark: boolean): PillTone {
  if (pct >= 90) return { bg: 'rgba(16,185,129,0.18)', fg: isDark ? '#6ee7b7' : '#047857' };
  if (pct >= 70) return { bg: 'rgba(132,204,22,0.18)', fg: isDark ? '#bef264' : '#4d7c0f' };
  if (pct >= 50) return { bg: 'rgba(245,158,11,0.20)', fg: isDark ? '#fcd34d' : '#b45309' };
  return { bg: 'rgba(244,63,94,0.18)', fg: isDark ? '#fda4af' : '#be123c' };
}

interface PctPillOptions {
  /** Porcentajes alineados por índice con los datos de la gráfica. */
  pcts: number[];
  isDark: boolean;
  /**
   * Valor del tope del grupo (el más alto del par), por índice. Se usa para
   * subir la píldora arriba de la barra más alta, no de la que la ancla.
   * Si se omite, la píldora se coloca sobre la barra que la ancla.
   */
  topes?: number[];
  /**
   * Cuántas barras tiene el grupo. Con 2, la píldora se recorre media barra a
   * la izquierda para quedar centrada sobre el par en vez de sobre la segunda.
   */
  barrasPorGrupo?: number;
  /** Separación entre barras del grupo, en px (debe coincidir con `barGap`). */
  barGap?: number;
}

/**
 * Devuelve un renderer para `<LabelList content={...} />`.
 *
 * Se ancla a la ÚLTIMA barra del grupo. A partir de su geometría (`y`, `height`)
 * y su valor se reconstruye la escala del eje —`height / value` px por unidad—
 * y con ella se calcula el pixel del tope del grupo. Así la píldora siempre
 * queda arriba de la barra más alta, sin agregar una serie fantasma que
 * descentre el grupo.
 */
export function makePctPillLabel({
  pcts,
  isDark,
  topes,
  barrasPorGrupo = 1,
  barGap = 2,
}: PctPillOptions) {
  // `any` a propósito: el tipo `Props` de LabelList en Recharts admite `value`
  // nulo y otros casos que no aplican aquí; tiparlo estricto lo vuelve
  // incompatible por contravarianza.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function PctPillLabel(props: any) {
    const index = props.index ?? -1;
    const pct = pcts[index];
    if (pct == null || !Number.isFinite(pct)) return null;

    const x = Number(props.x ?? 0);
    const y = Number(props.y ?? 0);
    const width = Number(props.width ?? 0);
    const height = Number(props.height ?? 0);
    const value = Number(props.value ?? 0);

    // Tope del grupo en pixeles. Reconstruimos la escala desde la barra ancla:
    // y0 (pixel del cero) = y + height; px por unidad = height / value.
    let topeY = y;
    const tope = topes?.[index];
    if (tope != null && value > 0 && height > 0) {
      const y0 = y + height;
      const pxPorUnidad = height / value;
      topeY = y0 - tope * pxPorUnidad;
    }

    const texto = `${pct.toFixed(2)} %`;
    // Ancho aproximado: ~5.6px por carácter a 10px de fuente, + padding lateral.
    const w = texto.length * 5.6 + 10;
    const h = 15;

    // Centrar sobre el grupo completo, no sobre la barra ancla.
    const corrimiento = ((barrasPorGrupo - 1) * (width + barGap)) / 2;
    const cx = x + width / 2 - corrimiento;
    const top = topeY - h - 4;

    // Si la barra llega hasta arriba del área de dibujo, no hay lugar para la píldora.
    if (top < 0) return null;

    const { bg, fg } = tono(pct, isDark);

    return (
      <g pointerEvents="none">
        <rect x={cx - w / 2} y={top} width={w} height={h} rx={7.5} fill={bg} />
        <text
          x={cx}
          y={top + h / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill={fg}
          fontSize={10}
          fontWeight={600}
        >
          {texto}
        </text>
      </g>
    );
  };
}
