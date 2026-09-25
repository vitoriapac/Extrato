const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));

export function renderExamIntelligence(model){
  if(model.state==='empty')return '<p class="analytics-note">Nenhuma prova histórica completa no concurso ativo. Provas parciais não contam como ausência de tópicos.</p>';
  const rows=model.rows.map(row=>`<li class="exam-intelligence-item"><strong>${escapeHtml(row.subjectName)} — ${escapeHtml(row.name)}</strong><span>Presença ${row.presencePercent}% · ${row.presentExamCount} de ${row.analyzedExamCount} provas · ${row.questionCount} questões</span><span>Participação ${row.participationPercent??'—'}% · Confiança ${escapeHtml(row.confidenceLabel.toLowerCase())}</span></li>`).join('');
  return `<p class="analytics-note">${model.completeExamCount} provas completas analisadas${model.scopedExamCount>model.completeExamCount?` · ${model.scopedExamCount-model.completeExamCount} parciais ou sem cobertura`:''}. Histórico usado apenas para explicar o impacto; a prioridade continua com o cálculo atual.</p>${rows?`<ol class="exam-intelligence-list">${rows}</ol>`:'<p class="analytics-note">Nenhuma questão histórica foi vinculada aos tópicos deste concurso.</p>'}`;
}
