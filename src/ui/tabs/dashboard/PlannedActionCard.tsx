import type { JSX } from 'preact';

export function PlannedActionCard({ next, own, blocked, minutes, typeLabel, reasons, suggestion, aligned, matchesAction, resumeLabel }: {
  next: Record<string, any>; own: boolean; blocked: boolean; minutes: string; typeLabel: string;
  reasons: string[]; suggestion: Record<string, any> | null; aligned: boolean; matchesAction: boolean; resumeLabel: string;
}): JSX.Element {
  return (
    <article class={`card card--action overview-action-card${own ? ' is-in-progress' : ''}`} data-decision-role="planned" data-plan-item-id={next.id} data-recommendation-action-id={suggestion?.actionId || undefined}>
      <div>
        <h3>{next.subjectName || 'Disciplina'} · {next.topicName || 'Sem tópico'}</h3>
        {reasons[0] && <p class="overview-action-reason">{reasons[0]}</p>}
        <p class="daily-execution-metadata"><strong>{minutes}</strong> · {typeLabel} · prevista no plano de hoje</p>
        {resumeLabel && <p class="overview-action-resume">Continuar de: {resumeLabel}</p>}
        {own && <span class="active-study-status">Em andamento</span>}
        {blocked && <p>Retome ou finalize a sessão em andamento antes de iniciar outra.</p>}
      </div>
      <div class="overview-action-buttons">
        {own ? <button type="button" class="btn" data-daily-resume>Retomar sessão</button> : blocked ?
          <button type="button" class="btn" title="Retome ou finalize a sessão em andamento antes de iniciar outra." disabled>Finalize a sessão atual</button> :
          <button type="button" class="btn" data-daily-start={next.id}>{next.status === 'partial' ? 'Continuar estudo' : 'Iniciar estudo'}</button>}
      </div>
      {/* Uma só resposta na Visão geral: o plano. A sugestão do diagnóstico fora do plano mora em Hoje (só o id fica em data-recommendation-action-id). */}
      {(matchesAction || aligned) && <p class="overview-action-suggestion">Prioridade principal prevista no plano.</p>}
      {reasons.length > 1 && <details class="daily-execution-reasons"><summary>Por que estudar isso agora?</summary><ul>{reasons.slice(1).map((reason, index) => <li key={index}>{reason}</li>)}</ul></details>}
    </article>
  );
}
