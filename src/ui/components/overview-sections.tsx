import type { JSX } from 'preact';
import { ALERT_SEVERITY_VARIANT, renderBadgeIcon } from '../primitives/badge.js';

type AnyRecord = Record<string, any>;

/** Ícone SVG gerado pela primitiva de badge (marcação própria e confiável, sem entrada do usuário). */
function BadgeIcon({ severity }: { severity: string }): JSX.Element {
  return (
    <span
      class="badge-icon-slot"
      dangerouslySetInnerHTML={{ __html: renderBadgeIcon(ALERT_SEVERITY_VARIANT[severity] || 'info') }}
    />
  );
}

export function AlertListItem({ alert }: { alert: AnyRecord }): JSX.Element {
  return (
    <div class={`alerta-item alerta-${alert.nivel}`}>
      <span class="alerta-icon">
        <BadgeIcon severity={alert.severity} />
      </span>
      <span>
        <strong>{alert.reason || alert.texto}</strong> <small>{alert.recommendedAction || ''}</small>
      </span>
      {alert.severity !== 'ok' && (
        <button
          type="button"
          class="btn ghost small alert-dismiss"
          data-delegated-click={`dismissIntelligentAlert('${alert.id}')`}
        >
          Dispensar 7 dias
        </button>
      )}
    </div>
  );
}

export function OverviewAlerts({
  alerts,
  currentAction,
  additionalCount = 0,
}: {
  alerts: AnyRecord[];
  currentAction: AnyRecord | null;
  additionalCount?: number;
}): JSX.Element {
  const extra = alerts.length - 1 + additionalCount;
  return (
    <>
      <div class="overview-alert-list">
        {alerts.slice(0, 1).map(alert => (
          <article key={alert.id} class={`overview-alert alerta-${alert.severity}`}>
            {alert.topicId &&
              alert.topicId === currentAction?.topicId &&
              alert.subjectId === currentAction?.subjectId && (
                <span class="overview-alert-related">Relacionado à recomendação atual</span>
              )}
            <strong>
              <BadgeIcon severity={alert.severity} />
              {alert.reason || alert.texto}
            </strong>
            <small>{alert.recommendedAction || ''}</small>
          </article>
        ))}
      </div>
      {extra > 0 && (
        <p class="overview-alert-empty">
          + {extra} {extra === 1 ? 'alerta ativo' : 'alertas ativos'}
        </p>
      )}
    </>
  );
}

export function ExecutiveSummaryView({ summary }: { summary: AnyRecord }): JSX.Element {
  return (
    <>
      <div class="executive-kpis">
        {summary.cards.map((card: AnyRecord) => (
          <div key={card.label} class="executive-kpi">
            <strong>{card.value}</strong>
            <span>{card.label}</span>
            <small>{card.detail}</small>
          </div>
        ))}
      </div>
      <div class="executive-decision-grid">
        <section>
          <h4>Próxima ação</h4>
          <p>A prioridade do dia e o motivo ficam em Hoje.</p>
          <button
            class="btn ghost small"
            type="button"
            data-delegated-click="navigateKpi('hoje')"
          >
            Abrir Hoje
          </button>
        </section>
        <section>
          <h4>Riscos e oportunidades</h4>
          <p>
            <strong>{summary.riskCount}</strong> risco{summary.riskCount === 1 ? '' : 's'} com evidência
            atual.
          </p>
          <small>{summary.opportunityMessage}</small>
        </section>
      </div>
    </>
  );
}

export function WeeklyCloseView({
  weekly,
  period,
  formatDate,
}: {
  weekly: AnyRecord;
  period: AnyRecord | null;
  formatDate: (value: unknown) => string;
}): JSX.Element {
  const adherence = weekly.adherence?.model?.summary?.temporalAdherence;
  const accuracy = weekly.questions?.accuracy;
  const range =
    period?.start && period?.end ? ` · ${formatDate(period.start)} a ${formatDate(period.end)}` : '';
  return (
    <>
      <div class="metas-close-metrics">
        <div>
          <span>Aderência ao plano</span>
          <strong>{adherence == null ? '—' : `${Math.round(adherence)}%`}</strong>
        </div>
        <div>
          <span>Questões resolvidas</span>
          <strong>{weekly.questions?.resolved ?? 0}</strong>
        </div>
        <div>
          <span>Precisão</span>
          <strong>{accuracy == null ? '—' : `${accuracy}%`}</strong>
        </div>
      </div>
      <p>
        Resumo do fechamento{range}. Consulte o fechamento para interpretar sinais e decidir a próxima
        semana.
      </p>
    </>
  );
}
