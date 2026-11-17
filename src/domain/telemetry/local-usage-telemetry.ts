import { parseLocalDate } from '../../core/date-utils.js';

export const TELEMETRY_EVENT_KINDS = [
  'tab_open',
  'chart_filter_interaction',
  'detail_access',
  'recommendation_click',
  'plan_adjust_after_analysis',
  'feature_return',
] as const;

export type TelemetryEventKind = (typeof TELEMETRY_EVENT_KINDS)[number];

export interface FeatureUsageEntry {
  counts: Record<TelemetryEventKind, number>;
  activeDays: string[];
  lastUsedDate: string | null;
}

export interface LocalUsageTelemetryState {
  schemaVersion: 1;
  totals: Record<TelemetryEventKind, number>;
  byFeature: Record<string, FeatureUsageEntry>;
  updatedDate: string | null;
}

export interface VoluntaryTelemetryFeatureSummary {
  feature: string;
  counts: Record<TelemetryEventKind, number>;
  totalInteractions: number;
  returnDaysCount: number;
  lastUsedDate: string | null;
}

export interface VoluntaryTelemetryReport {
  schemaVersion: 1;
  exportedDate: string;
  privacyGuarantee: 'aggregated_local_only_no_study_content';
  totals: Record<TelemetryEventKind, number>;
  features: VoluntaryTelemetryFeatureSummary[];
}

const MAX_ACTIVE_DAYS_PER_FEATURE = 90;

function emptyCounts(): Record<TelemetryEventKind, number> {
  return {
    tab_open: 0,
    chart_filter_interaction: 0,
    detail_access: 0,
    recommendation_click: 0,
    plan_adjust_after_analysis: 0,
    feature_return: 0,
  };
}

/** Cria um registro vazio de telemetria local agregada, sem dados pessoais. */
export function createEmptyUsageTelemetry(): LocalUsageTelemetryState {
  return {
    schemaVersion: 1,
    totals: emptyCounts(),
    byFeature: {},
    updatedDate: null,
  };
}

/** Normaliza identificadores técnicos de tela/recurso para impedir vazamento de conteúdo de estudo. */
export function sanitizeTelemetryFeatureKey(rawKey: unknown): string {
  const normalized = String(rawKey ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9:_-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 64);
  return normalized || 'unknown';
}

/** Valida e normaliza o estado recuperado do storage local. */
export function normalizeUsageTelemetryState(raw: unknown): LocalUsageTelemetryState {
  const base = createEmptyUsageTelemetry();
  if (!raw || typeof raw !== 'object') return base;
  const input = raw as Record<string, any>;
  if (input.totals && typeof input.totals === 'object') {
    for (const kind of TELEMETRY_EVENT_KINDS) {
      base.totals[kind] = Math.max(0, Math.floor(Number(input.totals[kind]) || 0));
    }
  }
  if (input.byFeature && typeof input.byFeature === 'object') {
    for (const [rawKey, entry] of Object.entries(input.byFeature)) {
      if (!entry || typeof entry !== 'object') continue;
      const key = sanitizeTelemetryFeatureKey(rawKey);
      const counts = emptyCounts();
      const rawCounts = (entry as Record<string, any>).counts || {};
      for (const kind of TELEMETRY_EVENT_KINDS) {
        counts[kind] = Math.max(0, Math.floor(Number(rawCounts[kind]) || 0));
      }
      const rawDays: unknown[] = Array.isArray((entry as Record<string, any>).activeDays)
        ? (entry as Record<string, any>).activeDays
        : [];
      const activeDays: string[] = Array.from(
        new Set<string>(
          rawDays.filter(
            (d: unknown): d is string => typeof d === 'string' && parseLocalDate(d) !== null
          )
        )
      )
        .sort()
        .slice(-MAX_ACTIVE_DAYS_PER_FEATURE);
      const lastUsed =
        typeof (entry as Record<string, any>).lastUsedDate === 'string' &&
        parseLocalDate((entry as Record<string, any>).lastUsedDate) !== null
          ? (entry as Record<string, any>).lastUsedDate
          : activeDays.at(-1) || null;
      base.byFeature[key] = {
        counts,
        activeDays,
        lastUsedDate: lastUsed,
      };
    }
  }
  base.updatedDate =
    typeof input.updatedDate === 'string' && parseLocalDate(input.updatedDate) !== null
      ? input.updatedDate
      : null;
  return base;
}

/** Registra um evento agregado de uso de componente de forma pura e determinística. */
export function recordUsageEvent(
  state: LocalUsageTelemetryState,
  {
    kind,
    feature,
    date,
  }: {
    kind: TelemetryEventKind;
    feature: string;
    date: string;
  }
): LocalUsageTelemetryState {
  if (!TELEMETRY_EVENT_KINDS.includes(kind)) return state;
  const featureKey = sanitizeTelemetryFeatureKey(feature);
  const validDate = typeof date === 'string' && parseLocalDate(date) !== null ? date : null;

  const prevFeature = state.byFeature[featureKey] || {
    counts: emptyCounts(),
    activeDays: [],
    lastUsedDate: null,
  };

  const nextCounts: Record<TelemetryEventKind, number> = {
    ...prevFeature.counts,
    [kind]: prevFeature.counts[kind] + 1,
  };
  const nextTotals: Record<TelemetryEventKind, number> = {
    ...state.totals,
    [kind]: state.totals[kind] + 1,
  };

  let nextDays = prevFeature.activeDays;
  if (validDate && !prevFeature.activeDays.includes(validDate)) {
    const hadPreviousDays = prevFeature.activeDays.length > 0;
    nextDays = [...prevFeature.activeDays, validDate]
      .sort()
      .slice(-MAX_ACTIVE_DAYS_PER_FEATURE);
    if (hadPreviousDays && kind !== 'feature_return') {
      nextCounts.feature_return += 1;
      nextTotals.feature_return += 1;
    }
  }

  return {
    schemaVersion: 1,
    totals: nextTotals,
    byFeature: {
      ...state.byFeature,
      [featureKey]: {
        counts: nextCounts,
        activeDays: nextDays,
        lastUsedDate: validDate || prevFeature.lastUsedDate,
      },
    },
    updatedDate: validDate || state.updatedDate,
  };
}

/** Gera relatório agregado higienizado para exportação voluntária sem conteúdo de estudo. */
export function buildVoluntaryTelemetryExport(
  state: LocalUsageTelemetryState,
  exportedDate: string
): VoluntaryTelemetryReport {
  const safeDate = parseLocalDate(exportedDate) ? exportedDate : state.updatedDate || '';
  const features: VoluntaryTelemetryFeatureSummary[] = Object.entries(state.byFeature)
    .map(([feature, entry]) => {
      const totalInteractions = TELEMETRY_EVENT_KINDS.reduce(
        (sum, kind) => sum + (kind === 'feature_return' ? 0 : entry.counts[kind]),
        0
      );
      return {
        feature,
        counts: { ...entry.counts },
        totalInteractions,
        returnDaysCount: entry.activeDays.length,
        lastUsedDate: entry.lastUsedDate,
      };
    })
    .sort((a, b) => b.totalInteractions - a.totalInteractions || a.feature.localeCompare(b.feature));

  return {
    schemaVersion: 1,
    exportedDate: safeDate,
    privacyGuarantee: 'aggregated_local_only_no_study_content',
    totals: { ...state.totals },
    features,
  };
}
