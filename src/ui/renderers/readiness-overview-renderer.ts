import { h } from 'preact';
import { render as renderToString } from 'preact-render-to-string';
import { ReadinessOverviewView } from '../components/readiness-overview.js';

// Presentation only: the application supplies measured values and frozen history.
// Marcação declarativa em Preact; o contrato de string dos controllers permanece. escapeHtml/escapeAttr
// seguem aceitos por compatibilidade, pois o Preact escapa o conteúdo.
export function renderReadinessOverview(
  {
    m,
    level,
    confidence,
    projection,
    projectionHistory,
    factors,
    approvalState,
    approvalLabel,
    diagnostics,
    candidates,
  }: any,
  { getMetricDataState, metricStateLabel }: any
) {
  return renderToString(
    h(ReadinessOverviewView, {
      m,
      level,
      confidence,
      projection,
      projectionHistory,
      factors,
      approvalState,
      approvalLabel,
      diagnostics,
      candidates,
      getMetricDataState,
      metricStateLabel,
    })
  );
}
