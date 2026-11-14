import { h } from 'preact';
import { render as renderToString } from 'preact-render-to-string';
import {
  AlertListItem,
  OverviewAlerts,
  WeeklyCloseView,
} from '../components/overview-sections.js';

// Marcação declarativa em Preact; as funções mantêm o contrato de string dos controllers.
// Os parâmetros escapeHtml/escapeAttr seguem aceitos por compatibilidade: o Preact já escapa o conteúdo.
export function renderIntelligentAlerts({ alerts, additional, currentAction = null }: any) {
  if (!alerts.length)
    return {
      list: '<div class="upcoming-empty">Nenhum alerta no momento.</div>',
      overview: '<p class="overview-alert-empty">Sem alertas prioritários neste momento.</p>',
    };
  const list = [...alerts, ...additional]
    .map(alert => renderToString(h(AlertListItem, { alert })))
    .join('');
  const overview = renderToString(h(OverviewAlerts, { alerts, currentAction, additionalCount: additional.length }));
  return { list, overview };
}

export function renderWeeklyCloseSummary(
  weekly: Record<string, any>,
  { period = null, formatDate = String }: any = {}
) {
  if (!weekly || weekly.state === 'insufficient')
    return '<p class="analytics-note">Ainda não há evidência suficiente para interpretar o fechamento. Registre sessões e resultados ao longo da semana.</p>';
  return renderToString(h(WeeklyCloseView, { weekly, period, formatDate }));
}
