export function renderDecisionCoherenceDebug(report,{escapeHtml}={}){
  const safe=value=>escapeHtml(String(value??''));
  const rows=report.signals.map(signal=>`<li>${safe(signal.subjectId)} / ${safe(signal.topicId)} · trajetória ${signal.trajectoryRisk?'✓':'—'} · prova ${signal.highExamImpact?'✓':'—'} · plano ${signal.planned?'✓':'—'} · ação ${signal.nextAction?'✓':'—'}</li>`).join('');
  const divergences=report.divergences.map(item=>`<li>${safe(item.type)}: ${safe(item.riskTopicId)} → ${safe(item.actionTopicId)} · ${safe(item.reasonCode)}${item.reason?` (${safe(item.reason)})`:''}</li>`).join('');
  return `<details class="diagnosis-method-details" data-decision-debug><summary>Diagnóstico de decisões · ${safe(report.status)}</summary><p>Riscos: ${report.summary.risks} · Alinhados: ${report.summary.aligned} · Explicados: ${report.summary.explained} · A investigar: ${report.summary.unexplained}</p><ul>${rows||'<li>Sem riscos comparáveis.</li>'}</ul>${divergences?`<h4>Divergências</h4><ul>${divergences}</ul>`:''}</details>`;
}
