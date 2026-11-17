import { formatLocalDate } from '../../core/date-utils.js';
import {
  buildVoluntaryTelemetryExport,
  createEmptyUsageTelemetry,
  normalizeUsageTelemetryState,
  recordUsageEvent,
  type LocalUsageTelemetryState,
  type TelemetryEventKind,
  type VoluntaryTelemetryReport,
} from '../../domain/telemetry/local-usage-telemetry.js';

export const USAGE_TELEMETRY_STORAGE_KEY = 'extrato:local-usage-telemetry:v1';

export interface UsageTelemetryStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem?: (key: string) => void;
}

export interface UsageTelemetryService {
  track: (kind: TelemetryEventKind, feature: string) => LocalUsageTelemetryState;
  getSummary: () => LocalUsageTelemetryState;
  exportVoluntaryReport: () => VoluntaryTelemetryReport;
  clear: () => void;
}

/** Orquestra métricas locais agregadas de uso de interface em localStorage sem alterar AppState. */
export function createUsageTelemetryService({
  storage = null,
  todayISO = () => formatLocalDate(new Date()) || '',
}: {
  storage?: UsageTelemetryStorage | null;
  todayISO?: () => string;
} = {}): UsageTelemetryService {
  let memoryFallback = createEmptyUsageTelemetry();

  const read = (): LocalUsageTelemetryState => {
    if (!storage) return memoryFallback;
    try {
      const raw = storage.getItem(USAGE_TELEMETRY_STORAGE_KEY);
      if (!raw) return createEmptyUsageTelemetry();
      return normalizeUsageTelemetryState(JSON.parse(raw));
    } catch {
      return memoryFallback;
    }
  };

  const write = (next: LocalUsageTelemetryState): void => {
    memoryFallback = next;
    if (!storage) return;
    try {
      storage.setItem(USAGE_TELEMETRY_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Falha silenciosa em ambientes com cota cheia ou modo restrito.
    }
  };

  return {
    track(kind: TelemetryEventKind, feature: string): LocalUsageTelemetryState {
      const current = read();
      const next = recordUsageEvent(current, {
        kind,
        feature,
        date: todayISO(),
      });
      write(next);
      return next;
    },
    getSummary(): LocalUsageTelemetryState {
      return read();
    },
    exportVoluntaryReport(): VoluntaryTelemetryReport {
      return buildVoluntaryTelemetryExport(read(), todayISO());
    },
    clear(): void {
      memoryFallback = createEmptyUsageTelemetry();
      try {
        storage?.removeItem?.(USAGE_TELEMETRY_STORAGE_KEY);
      } catch {
        // Ignora indisponibilidade de storage.
      }
    },
  };
}

let defaultService: UsageTelemetryService | null = null;

/** Retorna o serviço padrão de telemetria local usando localStorage quando disponível. */
export function getDefaultUsageTelemetryService(): UsageTelemetryService {
  if (defaultService) return defaultService;
  const storage =
    typeof globalThis !== 'undefined' && 'localStorage' in globalThis
      ? (globalThis.localStorage as UsageTelemetryStorage)
      : null;
  defaultService = createUsageTelemetryService({ storage });
  return defaultService;
}
