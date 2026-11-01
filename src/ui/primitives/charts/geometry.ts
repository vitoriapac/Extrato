// Pure geometry for the SVG chart primitives; no DOM, so it is unit-tested directly.

export const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const clampRatio = (value: number, max: number) => (max > 0 ? Math.max(0, Math.min(1, value / max)) : 0);

/** Ring arc as stroke-dasharray/offset on a circle of radius `r`; null when there is no value. */
export function ringGeometry(value: unknown, max = 100, r = 26) {
  const circumference = 2 * Math.PI * r;
  if (!isFiniteNumber(value) || !isFiniteNumber(max) || max <= 0) return null;
  const ratio = clampRatio(value, max);
  return { r, circumference, ratio, offset: circumference * (1 - ratio) };
}

/**
 * Sparkline paths: one `M…L…` run per stretch of consecutive values, so a missing
 * week breaks the line instead of being drawn as zero.
 */
export function sparklinePaths(values: unknown[], width: number, height: number, pad = 2) {
  const points = values.map((value, index) => ({ value, index }));
  const valid = points.filter(point => isFiniteNumber(point.value)) as { value: number; index: number }[];
  if (valid.length < 2) return null;
  const min = Math.min(...valid.map(point => point.value));
  const max = Math.max(...valid.map(point => point.value));
  const span = max - min || 1;
  const stepX = values.length > 1 ? (width - pad * 2) / (values.length - 1) : 0;
  const x = (index: number) => +(pad + index * stepX).toFixed(2);
  const y = (value: number) => +(height - pad - ((value - min) / span) * (height - pad * 2)).toFixed(2);
  const runs: string[] = [];
  // A value with gaps on both sides has no line to sit on; it is drawn as a dot.
  const dots: { x: number; y: number }[] = [];
  let run: { x: number; y: number }[] = [];
  const close = () => {
    if (run.length > 1) runs.push(run.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' '));
    else if (run.length === 1) dots.push(run[0]);
    run = [];
  };
  for (const point of points) {
    if (!isFiniteNumber(point.value)) close();
    else run.push({ x: x(point.index), y: y(point.value) });
  }
  close();
  const last = valid[valid.length - 1];
  return { runs, dots, last: { x: x(last.index), y: y(last.value), value: last.value }, first: valid[0].value, min, max };
}

/** Bullet bar fill and target marker as percentages of the track. */
export function bulletGeometry(value: unknown, target: unknown, max = 100) {
  if (!isFiniteNumber(value) || !isFiniteNumber(max) || max <= 0) return null;
  return {
    fill: +(clampRatio(value, max) * 100).toFixed(2),
    target: isFiniteNumber(target) ? +(clampRatio(target, max) * 100).toFixed(2) : null,
    below: isFiniteNumber(target) ? value < target : false,
  };
}

/** Stacked bar segments as percentages; negative and invalid parts count as zero. */
export function stackedSegments(parts: { value: unknown }[]) {
  const values = parts.map(part => (isFiniteNumber(part.value) && part.value > 0 ? part.value : 0));
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return null;
  let start = 0;
  return values.map(value => {
    const width = +((value / total) * 100).toFixed(2);
    const segment = { start: +start.toFixed(2), width, share: Math.round((value / total) * 100) };
    start += width;
    return segment;
  });
}
