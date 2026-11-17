import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TELEMETRY_EVENT_KINDS,
  buildVoluntaryTelemetryExport,
  createEmptyUsageTelemetry,
  recordUsageEvent,
  sanitizeTelemetryFeatureKey,
} from '../../src/domain/telemetry/local-usage-telemetry.js';
import {
  USAGE_TELEMETRY_STORAGE_KEY,
  createUsageTelemetryService,
} from '../../src/application/telemetry/usage-telemetry-service.js';

test('local-usage-telemetry registra os 6 indicadores e conta retorno em dias distintos', () => {
  let state = createEmptyUsageTelemetry();
  state = recordUsageEvent(state, { kind: 'tab_open', feature: 'desempenho:overview', date: '2026-11-10' });
  state = recordUsageEvent(state, { kind: 'chart_filter_interaction', feature: 'desempenho:overview', date: '2026-11-10' });
  // Mesmo dia não dispara feature_return automático
  assert.equal(state.totals.feature_return, 0);

  // Novo dia no mesmo recurso registra retorno automático
  state = recordUsageEvent(state, { kind: 'detail_access', feature: 'desempenho:overview', date: '2026-11-12' });
  state = recordUsageEvent(state, { kind: 'recommendation_click', feature: 'desempenho:overview', date: '2026-11-12' });
  state = recordUsageEvent(state, { kind: 'plan_adjust_after_analysis', feature: 'desempenho:overview', date: '2026-11-12' });

  assert.equal(state.totals.tab_open, 1);
  assert.equal(state.totals.chart_filter_interaction, 1);
  assert.equal(state.totals.detail_access, 1);
  assert.equal(state.totals.recommendation_click, 1);
  assert.equal(state.totals.plan_adjust_after_analysis, 1);
  assert.equal(state.totals.feature_return, 1);

  const report = buildVoluntaryTelemetryExport(state, '2026-11-12');
  assert.equal(report.privacyGuarantee, 'aggregated_local_only_no_study_content');
  assert.equal(report.exportedDate, '2026-11-12');
  assert.equal(report.features.length, 1);
  assert.equal(report.features[0].returnDaysCount, 2);
  assert.equal(report.features[0].totalInteractions, 5);
  assert.deepEqual(Object.keys(report.totals), [...TELEMETRY_EVENT_KINDS]);
});

test('sanitizeTelemetryFeatureKey impede gravação de caracteres de conteúdo pessoal', () => {
  assert.equal(sanitizeTelemetryFeatureKey('Desempenho:Questions!@#'), 'desempenho:questions-');
  assert.equal(sanitizeTelemetryFeatureKey(''), 'unknown');
});

test('createUsageTelemetryService persiste no storage local de forma isolada e permite limpeza', () => {
  const store = new Map();
  const storage = {
    getItem: key => store.get(key) ?? null,
    setItem: (key, val) => store.set(key, val),
    removeItem: key => store.delete(key),
  };
  let today = '2026-11-10';
  const service = createUsageTelemetryService({ storage, todayISO: () => today });
  service.track('tab_open', 'planejamento:semana');
  today = '2026-11-11';
  service.track('chart_filter_interaction', 'planejamento:semana');

  assert.ok(store.has(USAGE_TELEMETRY_STORAGE_KEY));
  const report = service.exportVoluntaryReport();
  assert.equal(report.totals.tab_open, 1);
  assert.equal(report.totals.chart_filter_interaction, 1);
  assert.equal(report.totals.feature_return, 1);

  service.clear();
  assert.equal(store.has(USAGE_TELEMETRY_STORAGE_KEY), false);
  assert.equal(service.getSummary().totals.tab_open, 0);
});
