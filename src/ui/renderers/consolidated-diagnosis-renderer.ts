import { renderDiagnosticSummary } from './diagnostic-summary-renderer.js';

export function renderConsolidatedDiagnosis(
  model: Record<string, any>,
  { studyActionForItem, escapeHtml, escapeAttr }: any
) {
  const rows = [...(model.topics || []), ...(model.subjects || [])].filter(
    item => item.primarySignal
  );
  if (!rows.length)
    return '<div class="empty-state empty-state--compact diagnosis-empty-state" role="status"><strong>Nenhum diagnóstico principal disponível</strong><p>Registre sessões, questões e revisões para reunir evidências no concurso ativo. A ausência de alerta não confirma consolidação.</p></div>';
  const renderRow = (item: Record<string, any>, index: number) => {
    const primary = item.signals.find(
      (signal: any) => signal.kind === item.primarySignal && signal.active
    );
    const action = studyActionForItem(item);
    return `<article class="diagnostic-row consolidated-diagnosis-row" tabindex="-1" data-diagnosis-subject-id="${escapeAttr(item.subjectId)}" ${item.topicId ? `data-diagnosis-topic-id="${escapeAttr(item.topicId)}"` : ''} data-consolidated-state="${escapeAttr(item.state)}" data-consolidated-signal="${escapeAttr(item.primarySignal)}" data-consolidated-evidence-quality="${escapeAttr(item.evidenceQuality)}" ${action ? `data-study-action-source="${escapeAttr(action.source)}" data-study-action-id="${escapeAttr(action.id)}" data-activity-type="${escapeAttr(action.activityType)}"` : ''}>
      <div class="diagnostic-row-heading"><div class="diagnostic-row-identity"><span class="diagnostic-kicker">${index + 1} · ${item.granularity === 'subject' ? 'DISCIPLINA' : 'TÓPICO'}</span><strong>${escapeHtml(item.name || 'Conteúdo sem nome')}</strong>${item.granularity === 'topic' && item.subjectName ? `<small>${escapeHtml(item.subjectName)}</small>` : ''}</div><span class="status-badge status-badge--${item.severity === 'critical' ? 'danger' : item.severity === 'important' ? 'warning' : 'info'}">${escapeHtml(item.severityLabel)}</span></div>
      ${renderDiagnosticSummary(item, primary, { escapeHtml })}
      <div class="diagnostic-row-action"><span>PRÓXIMO PASSO</span><div class="diagnostic-row-buttons">${action ? `<button class="btn ghost small" type="button" data-study-action-source="${escapeAttr(action.source)}" data-study-action-id="${escapeAttr(action.id)}" data-activity-type="${escapeAttr(action.activityType)}" data-delegated-click="executeStudyRecommendation('${escapeAttr(action.id)}','${escapeAttr(action.source)}')">${escapeHtml(action.label)}</button>` : ''}<button class="btn ghost small" type="button" data-analysis-nav="desempenho" data-subject-id="${escapeAttr(item.subjectId)}" ${item.topicId ? `data-topic-id="${escapeAttr(item.topicId)}"` : ''}>Ver evolução</button><button class="btn ghost small" type="button" data-analysis-nav="metas" data-subject-id="${escapeAttr(item.subjectId)}" ${item.topicId ? `data-topic-id="${escapeAttr(item.topicId)}"` : ''}>Planejar ação</button></div></div>
    </article>`;
  };
  // Conteúdos sem evidência suficiente viram uma linha só: listá-los um a um repete o mesmo aviso.
  const evidenced = rows.filter(item => item.state !== 'insufficient'),
    insufficient = rows.filter(item => item.state === 'insufficient');
  const first = evidenced.slice(0, 5),
    remaining = evidenced.slice(5);
  const insufficientHtml = insufficient.length
    ? `<details class="performance-more diagnosis-insufficient"><summary>${insufficient.length} ${insufficient.length === 1 ? 'conteúdo' : 'conteúdos'} sem evidência suficiente · registre questões e sessões para diagnosticar</summary><div class="diagnosis-consolidated-list">${insufficient.map((item, index) => renderRow(item, evidenced.length + index)).join('')}</div></details>`
    : '';
  return `<div class="diagnosis-consolidated"><p class="analytics-note">Um diagnóstico principal por conteúdo, com evidências disponíveis para consulta.</p>${first.length ? `<div class="diagnosis-consolidated-list">${first.map(renderRow).join('')}</div>` : ''}${remaining.length ? `<details class="performance-more"><summary>Mostrar mais diagnósticos · +${remaining.length}</summary><div class="diagnosis-consolidated-list">${remaining.map((item, index) => renderRow(item, index + 5)).join('')}</div></details>` : ''}${insufficientHtml}<p class="confidence-note">Diagnóstico estimado a partir dos registros disponíveis; não representa certeza de resultado.</p></div>`;
}
