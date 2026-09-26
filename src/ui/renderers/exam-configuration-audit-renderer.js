const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
const labels={divergent:'Divergente',review:'Revisar',aligned:'Alinhado',insufficient:'Evidência limitada',unconfigured:'Sem configuração'};

export function renderExamConfigurationAudit(model){
  const candidates=model.rows.filter(row=>row.status==='divergent'||row.status==='review').slice(0,6);
  const items=candidates.map(row=>`<li><button class="btn ghost small" type="button" data-audit-topic="${escape(row.topicId)}">${escape(row.subjectName)} — ${escape(row.name)}</button><span>${escape(labels[row.status])} · diferença ${row.divergence} pontos · ${escape(row.confidenceLabel.toLowerCase())}</span></li>`).join('');
  return `<section class="exam-configuration-audit" aria-label="Configurado e histórico observado"><h4>Configurado × histórico</h4><p class="analytics-note">${model.alignedCount} alinhados · ${model.reviewCount} para revisar · ${model.divergentCount} divergentes. A comparação usa uma estimativa histórica na escala de impacto, não o peso oficial por questão. Ela não altera configurações.</p>${items?`<ul>${items}</ul>`:'<p class="analytics-note">Nenhuma divergência sustentada por histórico suficiente. Abra um tópico na matriz para ver os valores disponíveis.</p>'}</section>`;
}
