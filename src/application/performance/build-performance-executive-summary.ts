type Row = Record<string, any>;

export interface PerformanceExecutiveSummary {
  rangeLabel: string;
  /** Situação da meta, vinda da projeção; "none" quando ela não foi calculada. */
  situation: {
    status: 'on_track' | 'attention' | 'at_risk' | 'insufficient_data' | 'none';
    confidence: string | null;
    target: number | null;
    simulationAccuracy: number | null;
    band: { low: number; high: number } | null;
    /** Simulados comparáveis que sustentam o resultado central (todo o histórico). */
    simulationCount: number | null;
  };
  /** A principal mudança medida contra o período anterior, quando há base comparável. */
  change: { label: string; delta: number; unit: string; detail?: string } | null;
  base: { resolved: number; sessions: number; smallSample: boolean };
}

const finite = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

/**
 * Resumo executivo da Visão geral de Desempenho: situação da meta, principal mudança no
 * período e a base da leitura. Só organiza números já calculados; não cria regra nova.
 */
export function buildPerformanceExecutiveSummary({
  model = {},
  range = {},
  projection = null,
}: {
  model?: Row;
  range?: Row;
  projection?: Row | null;
} = {}): PerformanceExecutiveSummary {
  const current = model.current || {};
  const band = projection?.projection?.calibratedSimulationBand;
  const low = finite(band?.low),
    high = finite(band?.high);
  // A Prontidão já está na Leitura da preparação; aqui entra a primeira mudança medida que ela não cobre.
  const first =
    (model.changes || []).find((item: Row) => !/^Prontidão/.test(String(item.label))) ?? null;
  const resolved = Number(current.resolved) || 0;
  return {
    rangeLabel: String(range.label || ''),
    situation: {
      status: projection?.status || 'none',
      confidence: projection?.confidence?.level ?? null,
      target: finite(projection?.current?.targetScore),
      simulationAccuracy: finite(projection?.current?.simulationAccuracy),
      band: low != null && high != null ? { low, high } : null,
      simulationCount: finite(projection?.evidence?.observationCount),
    },
    change: first
      ? { label: first.label, delta: first.delta, unit: first.unit, detail: first.detail }
      : null,
    base: {
      resolved,
      sessions: Number(current.sessionCount) || 0,
      smallSample: resolved > 0 && resolved < 30,
    },
  };
}
