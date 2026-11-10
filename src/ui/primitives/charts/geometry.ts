// Pure geometry for the SVG chart primitives; no DOM, so it is unit-tested directly.

export const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const clampRatio = (value: number, max: number) =>
  max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;

/** Ring arc as stroke-dasharray/offset on a circle of radius `r`; null when there is no value. */
export function ringGeometry(value: unknown, max = 100, r = 26) {
  const circumference = 2 * Math.PI * r;
  if (!isFiniteNumber(value) || !isFiniteNumber(max) || max <= 0) return null;
  const ratio = clampRatio(value, max);
  return { r, circumference, ratio, offset: circumference * (1 - ratio) };
}

/**
 * Sparkline paths: one `M…L…` run per stretch of consecutive values, so a missing
 * week breaks the line instead of being drawn as zero. With `connectGaps` the line
 * runs across missing weeks (each point keeps its place in time), for sparse series.
 */
export function sparklinePaths(
  values: unknown[],
  width: number,
  height: number,
  pad = 2,
  connectGaps = false
) {
  const points = values.map((value, index) => ({ value, index }));
  const valid = points.filter(point => isFiniteNumber(point.value)) as {
    value: number;
    index: number;
  }[];
  if (valid.length < 2) return null;
  const min = Math.min(...valid.map(point => point.value));
  const max = Math.max(...valid.map(point => point.value));
  const span = max - min || 1;
  const stepX = values.length > 1 ? (width - pad * 2) / (values.length - 1) : 0;
  const x = (index: number) => +(pad + index * stepX).toFixed(2);
  const y = (value: number) =>
    +(height - pad - ((value - min) / span) * (height - pad * 2)).toFixed(2);
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
    if (!isFiniteNumber(point.value)) {
      if (!connectGaps) close();
    } else run.push({ x: x(point.index), y: y(point.value) });
  }
  close();
  const last = valid[valid.length - 1];
  return {
    runs,
    dots,
    last: { x: x(last.index), y: y(last.value), value: last.value },
    first: valid[0].value,
    min,
    max,
    count: valid.length,
  };
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

/**
 * Column chart layout in viewBox units. A zero column keeps a 1-unit stub so the axis has
 * no holes; `separated` columns get extra space before them (e.g. an "overdue" bucket).
 */
export function columnGeometry(
  columns: { value: unknown; separated?: boolean }[],
  {
    height = 48,
    width = 8,
    gap = 2,
    separation = 8,
    max,
  }: { height?: number; width?: number; gap?: number; separation?: number; max?: number } = {}
) {
  const values = columns.map(column =>
    isFiniteNumber(column.value) && column.value > 0 ? column.value : 0
  );
  const top = Math.max(1, isFiniteNumber(max) ? max : 0, ...values);
  let x = 0;
  const bars = values.map((value, index) => {
    if (index) x += width + gap + (columns[index].separated ? separation : 0);
    const h = value ? Math.max(3, Math.round((value / top) * (height - 2))) : 1;
    return { x, y: height - h, width, height: h, value, zero: !value };
  });
  const yFor = (value: number) => +(height - Math.min(1, value / top) * (height - 2)).toFixed(2);
  return { bars, width: x + width, height, top, yFor };
}

/** Donut geometry using stroke-dasharray on circle with radius `r`. */
export function donutGeometry(slices: Array<{ ratio: number; startRatio: number }>, r = 50) {
  const circumference = +(2 * Math.PI * r).toFixed(2);
  const items = slices.map(s => {
    const len = +(Math.max(0, s.ratio) * circumference).toFixed(2);
    const offset = +(-s.startRatio * circumference).toFixed(2);
    return {
      dasharray: `${len} ${circumference}`,
      dashoffset: offset,
      length: len,
    };
  });
  return { r, circumference, items };
}

export interface StackedColumnSegmentInput {
  seconds: number;
  colorSlot: number;
  subjectName?: string;
}

export interface StackedColumnDayInput {
  date: string;
  totalSeconds: number;
  segments: StackedColumnSegmentInput[];
}

/** Layout for stacked columns (e.g. daily hours broken down by subject). */
export function stackedColumnsGeometry(
  days: StackedColumnDayInput[],
  {
    width = 600,
    height = 200,
    padLeft = 45,
    padRight = 15,
    padTop = 20,
    padBottom = 30,
    minYMax = 3600, // no mínimo 1 hora de escala
  }: {
    width?: number;
    height?: number;
    padLeft?: number;
    padRight?: number;
    padTop?: number;
    padBottom?: number;
    minYMax?: number;
  } = {}
) {
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const maxSecs = Math.max(minYMax, ...days.map(d => d.totalSeconds || 0));

  const n = days.length;
  const colWidth = n > 0 ? Math.max(4, Math.min(32, Math.floor((plotW / n) * 0.65))) : 12;
  const step = n > 1 ? plotW / (n - 1) : 0;

  const yFor = (secs: number) =>
    +(padTop + plotH - (Math.min(maxSecs, Math.max(0, secs)) / maxSecs) * plotH).toFixed(1);

  const columns = days.map((day, index) => {
    const cx = n === 1 ? padLeft + plotW / 2 : padLeft + index * step;
    const x = +(cx - colWidth / 2).toFixed(1);
    const dayTotal = day.totalSeconds || 0;

    let currentBottomY = padTop + plotH;
    const segments = day.segments.map(seg => {
      const segSecs = Math.max(0, seg.seconds || 0);
      const segH = maxSecs > 0 ? +((segSecs / maxSecs) * plotH).toFixed(1) : 0;
      const y = +(currentBottomY - segH).toFixed(1);
      currentBottomY = y;
      return {
        x,
        y,
        width: colWidth,
        height: Math.max(segSecs > 0 ? 1 : 0, segH),
        colorSlot: seg.colorSlot,
        seconds: segSecs,
        subjectName: seg.subjectName || '',
      };
    });

    return {
      date: day.date,
      x,
      cx,
      width: colWidth,
      totalSeconds: dayTotal,
      zero: dayTotal <= 0,
      segments,
    };
  });

  return {
    width,
    height,
    padLeft,
    padRight,
    padTop,
    padBottom,
    plotW,
    plotH,
    maxSeconds: maxSecs,
    columns,
    yFor,
  };
}

export interface MultiLineSeriesInput {
  id: string;
  name: string;
  colorSlot: number;
  points: Array<{ periodKey: string; accuracy: number | null }>;
}

/** Layout for multi-line chart (e.g. accuracy percentage per subject over periods). */
export function multiLineGeometry(
  seriesList: MultiLineSeriesInput[],
  periodsCount: number,
  {
    width = 600,
    height = 220,
    padLeft = 35,
    padRight = 20,
    padTop = 15,
    padBottom = 30,
  }: {
    width?: number;
    height?: number;
    padLeft?: number;
    padRight?: number;
    padTop?: number;
    padBottom?: number;
  } = {}
) {
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const step = periodsCount > 1 ? plotW / (periodsCount - 1) : 0;

  const xFor = (index: number) =>
    +(padLeft + (periodsCount === 1 ? plotW / 2 : index * step)).toFixed(1);
  const yFor = (pct: number) =>
    +(padTop + plotH - (Math.max(0, Math.min(100, pct)) / 100) * plotH).toFixed(1);

  const series = seriesList.map(s => {
    const dots: Array<{ x: number; y: number; accuracy: number; periodIndex: number }> = [];
    const runs: string[] = [];
    let currentRun: Array<{ x: number; y: number }> = [];

    s.points.forEach((pt, pIdx) => {
      if (pt.accuracy === null) {
        if (currentRun.length > 1) {
          runs.push(currentRun.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' '));
        }
        currentRun = [];
      } else {
        const x = xFor(pIdx);
        const y = yFor(pt.accuracy);
        currentRun.push({ x, y });
        dots.push({ x, y, accuracy: pt.accuracy, periodIndex: pIdx });
      }
    });

    if (currentRun.length > 1) {
      runs.push(currentRun.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' '));
    }

    return {
      id: s.id,
      name: s.name,
      colorSlot: s.colorSlot,
      runs,
      dots,
    };
  });

  return {
    width,
    height,
    padLeft,
    padRight,
    padTop,
    padBottom,
    plotW,
    plotH,
    xFor,
    yFor,
    series,
  };
}

export interface PedagogicalMatrixItemInput {
  id: string;
  name: string;
  colorSlot: number;
  mastery: number;
  retention: number;
  studyMinutes: number;
}

/** Layout for Pedagogical Matrix (Domain × Retention 4-quadrant bubble plot). */
export function pedagogicalMatrixGeometry(
  items: PedagogicalMatrixItemInput[],
  {
    width = 540,
    height = 360,
    padLeft = 40,
    padRight = 25,
    padTop = 25,
    padBottom = 40,
    thresholdMastery = 70,
    thresholdRetention = 60,
    zoom = false,
  }: {
    zoom?: boolean;
    width?: number;
    height?: number;
    padLeft?: number;
    padRight?: number;
    padTop?: number;
    padBottom?: number;
    thresholdMastery?: number;
    thresholdRetention?: number;
  } = {}
) {
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  // Com zoom, a escala acompanha o intervalo real das disciplinas (e os dois limites), em passos de 10.
  const domainOf = (values: number[]) => {
    if (!zoom || !values.length) return [0, 100] as const;
    let low = Math.max(0, Math.floor((Math.min(...values) - 8) / 10) * 10);
    let high = Math.min(100, Math.ceil((Math.max(...values) + 8) / 10) * 10);
    if (high - low < 30) {
      low = Math.max(0, low - 10);
      high = Math.min(100, Math.max(high, low + 30));
    }
    return [low, high] as const;
  };
  const [xMin, xMax] = domainOf([...items.map(it => it.retention), thresholdRetention]);
  const [yMin, yMax] = domainOf([...items.map(it => it.mastery), thresholdMastery]);
  const clampTo = (value: number, low: number, high: number) =>
    (Math.max(low, Math.min(high, value)) - low) / (high - low);
  const xFor = (ret: number) => +(padLeft + clampTo(ret, xMin, xMax) * plotW).toFixed(1);
  const yFor = (dom: number) => +(padTop + plotH - clampTo(dom, yMin, yMax) * plotH).toFixed(1);

  const maxMinutes = Math.max(60, ...items.map(it => it.studyMinutes || 0));

  const bubbles = items.map(it => {
    const cx = xFor(it.retention);
    const cy = yFor(it.mastery);
    const frac = Math.max(0, it.studyMinutes || 0) / maxMinutes;
    // Raio entre 8px e 18px: com muitas disciplinas, esferas maiores se sobrepõem.
    const r = +(8 + frac * 10).toFixed(1);
    return {
      id: it.id,
      name: it.name,
      colorSlot: it.colorSlot,
      cx,
      cy,
      r,
      mastery: it.mastery,
      retention: it.retention,
      studyMinutes: it.studyMinutes,
    };
  });

  return {
    width,
    height,
    padLeft,
    padRight,
    padTop,
    padBottom,
    plotW,
    plotH,
    domain: { xMin, xMax, yMin, yMax, zoomed: zoom },
    thresholdX: xFor(thresholdRetention),
    thresholdY: yFor(thresholdMastery),
    bubbles,
  };
}

export interface GroupedBarItemInput {
  label: string;
  planned: number;
  actual: number;
  colorSlot: number;
}

/** Layout for horizontal grouped bars (e.g. Planned vs Actual hours per subject). */
export function groupedBarsGeometry(
  items: GroupedBarItemInput[],
  {
    maxVal,
  }: {
    maxVal?: number;
  } = {}
) {
  const ceiling = Math.max(
    1,
    isFiniteNumber(maxVal) ? maxVal : 0,
    ...items.map(it => Math.max(it.planned || 0, it.actual || 0))
  );

  const bars = items.map(it => {
    const plannedRatio = Math.max(0, it.planned) / ceiling;
    const actualRatio = Math.max(0, it.actual) / ceiling;
    return {
      label: it.label,
      colorSlot: it.colorSlot,
      planned: it.planned,
      actual: it.actual,
      plannedWidthPct: +(plannedRatio * 100).toFixed(1),
      actualWidthPct: +(actualRatio * 100).toFixed(1),
      isExceeded: it.actual > it.planned && it.planned > 0,
      isDeficit: it.actual < it.planned,
    };
  });

  return { ceiling, bars };
}

/** Layout for Phase Roadmap timeline in SVG units. */
export function phaseRoadmapGeometry(progressPct: number, phasesCount = 4, width = 600, padX = 30) {
  const plotW = width - padX * 2;
  const clampedProgress = Math.max(0, Math.min(100, progressPct));
  const currentX = +(padX + (clampedProgress / 100) * plotW).toFixed(1);

  const nodeStep = phasesCount > 1 ? plotW / (phasesCount - 1) : 0;
  const nodes = Array.from({ length: phasesCount }, (_, i) => ({
    index: i,
    x: +(padX + i * nodeStep).toFixed(1),
  }));

  return {
    width,
    padX,
    plotW,
    progressPct: clampedProgress,
    currentX,
    nodes,
  };
}

export interface WeeklyTrendPointGeomInput {
  label: string;
  resolved: number;
  accuracy: number | null;
}

/** Layout for Weekly Trend chart: accuracy line (0..100%) + volume bars on the bottom. */
export function weeklyTrendGeometry(
  points: WeeklyTrendPointGeomInput[],
  maxResolved = 50,
  {
    width = 500,
    height = 160,
    padLeft = 30,
    padRight = 20,
    padTop = 15,
    padBottom = 25,
  }: {
    width?: number;
    height?: number;
    padLeft?: number;
    padRight?: number;
    padTop?: number;
    padBottom?: number;
  } = {}
) {
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const n = points.length;
  const step = n > 1 ? plotW / (n - 1) : 0;
  const barW = Math.max(6, Math.min(24, n > 0 ? (plotW / n) * 0.45 : 12));

  // O volume de questões ocupa os 40% inferiores do gráfico
  const maxBarH = plotH * 0.4;
  const ceilingResolved = Math.max(1, maxResolved);

  const xFor = (index: number) => +(padLeft + (n === 1 ? plotW / 2 : index * step)).toFixed(1);
  const yForAccuracy = (acc: number) =>
    +(padTop + plotH - (Math.max(0, Math.min(100, acc)) / 100) * plotH).toFixed(1);

  const items = points.map((p, idx) => {
    const x = xFor(idx);
    const y = p.accuracy !== null ? yForAccuracy(p.accuracy) : null;
    const barH = Math.max(
      p.resolved > 0 ? 3 : 0,
      +((p.resolved / ceilingResolved) * maxBarH).toFixed(1)
    );
    const barX = +(x - barW / 2).toFixed(1);
    const barY = +(padTop + plotH - barH).toFixed(1);

    return {
      index: idx,
      label: p.label,
      resolved: p.resolved,
      accuracy: p.accuracy,
      x,
      y,
      barX,
      barY,
      barW,
      barH,
    };
  });

  const validLinePoints = items.filter(it => it.y !== null);
  let pathD = '';
  if (validLinePoints.length > 0) {
    pathD = `M ${validLinePoints[0].x} ${validLinePoints[0].y}`;
    for (let i = 1; i < validLinePoints.length; i++) {
      pathD += ` L ${validLinePoints[i].x} ${validLinePoints[i].y}`;
    }
  }

  return {
    width,
    height,
    plotW,
    plotH,
    padLeft,
    padRight,
    padTop,
    padBottom,
    items,
    pathD,
  };
}

export interface SimulationTrendPointGeomInput {
  name: string;
  date: string;
  score: number;
  onTarget: boolean;
  correct?: number;
  total?: number;
}

/** Layout for Simulation Trend chart: score line vs target score benchmark. */
export function simulationTrendGeometry(
  simulations: SimulationTrendPointGeomInput[],
  targetScore = 80,
  {
    width = 560,
    height = 160,
    padLeft = 35,
    padRight = 20,
    padTop = 15,
    padBottom = 25,
    yMin = 0,
  }: {
    width?: number;
    height?: number;
    padLeft?: number;
    padRight?: number;
    padTop?: number;
    padBottom?: number;
    /** Piso do eixo Y em %; 0 mantém a escala completa. */
    yMin?: number;
  } = {}
) {
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const n = simulations.length;
  const step = n > 1 ? plotW / (n - 1) : 0;

  const xFor = (index: number) => +(padLeft + (n === 1 ? plotW / 2 : index * step)).toFixed(1);
  const yFor = (pct: number) =>
    +(
      padTop +
      plotH -
      ((Math.max(yMin, Math.min(100, pct)) - yMin) / (100 - yMin)) * plotH
    ).toFixed(1);

  const points = simulations.map((sim, idx) => {
    const x = xFor(idx);
    const y = yFor(sim.score);
    return {
      index: idx,
      name: sim.name,
      date: sim.date,
      score: sim.score,
      onTarget: sim.onTarget,
      correct: sim.correct,
      total: sim.total,
      x,
      y,
    };
  });

  let pathD = '';
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${points[i].x} ${points[i].y}`;
    }
  }

  const targetY = yFor(targetScore);

  return {
    width,
    height,
    plotW,
    plotH,
    padLeft,
    padRight,
    padTop,
    padBottom,
    targetScore,
    targetY,
    yMin,
    points,
    pathD,
  };
}
