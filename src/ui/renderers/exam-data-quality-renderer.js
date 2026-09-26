const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
const labels={insufficient:'Evidência limitada',low:'Base em revisão',moderate:'Base utilizável',high:'Base consistente'};

export function renderExamDataQuality(model){
  const coverage=model.coveragePercent==null?'Indisponível':`${model.coveragePercent}%`;
  const warningItems=model.warnings.map(warning=>`<li>${escape(warning)}</li>`).join('');
  return `<section class="exam-data-quality" aria-label="Qualidade do histórico"><header><h4>Qualidade do histórico</h4><strong>${escape(labels[model.confidence])}</strong></header><div class="exam-data-quality-metrics"><p><b>${model.examCount}</b><span>provas · ${model.completeExamCount} completas</span></p><p><b>${model.questionCount}</b><span>questões classificadas</span></p><p><b>${coverage}</b><span>cobertura conhecida da base</span></p><p><b>${model.unresolvedQuestions}</b><span>sem classificação</span></p></div><p class="analytics-note">${model.mappedTopics} tópicos mapeados · ${model.lowConfidenceQuestions} classificações de baixa confiança · ${model.unreviewedQuestions} importadas sem revisão.</p>${warningItems?`<ul class="exam-data-quality-warnings">${warningItems}</ul>`:''}<button class="btn ghost small" type="button" id="openExamClassificationReview">Revisar classificações</button></section>`;
}
