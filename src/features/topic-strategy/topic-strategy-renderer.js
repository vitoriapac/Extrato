import {resolveTopicExamImpact,wouldCreatePrerequisiteCycle} from '../../domain/analytics/topic-strategy.js';

const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
const escapeAttr=escapeHtml;

export function renderTopicStrategyEditor({subject,topic,subjectConfig=null,activeExamTags=[],topics=[]}={}){
  const impact=resolveTopicExamImpact({topic,subjectConfig,activeExamTags});
  const prerequisites=new Set(topic?.prerequisites||[]);
  const choices=topics.filter(candidate=>candidate.id!==topic?.id&&!candidate.subjectArchived&&!candidate.topicArchived).map(candidate=>{
    const checked=prerequisites.has(candidate.id);
    const cyclic=!checked&&wouldCreatePrerequisiteCycle(topic.id,candidate.id,topics);
    return `<label class="topic-prerequisite-choice"><input type="checkbox" ${checked?'checked':''} ${cyclic?'disabled':''} data-delegated-change="toggleTopicPrerequisite('${escapeAttr(subject.id)}','${escapeAttr(topic.id)}','${escapeAttr(candidate.id)}',this.checked)"><span>${escapeHtml(candidate.subjectName)} — ${escapeHtml(candidate.name||'Tópico sem nome')}${cyclic?' · criaria ciclo':''}</span></label>`;
  }).join('');
  const value=impact.value==null?'—':`${Math.round(impact.value)}%`;
  return `<div class="topic-strategy-summary"><strong>Impacto usado na prioridade: ${value}</strong><span>${escapeHtml(impact.sourceLabel)}. Alterações invalidam a proposta semanal ainda não confirmada.</span></div><div class="topic-strategy-fields"><label>Importância na prova (%)<input type="number" min="0" max="100" step="1" placeholder="Herdar automaticamente" value="${topic.examImportance==null?'':Math.round(topic.examImportance*100)}" data-delegated-blur="updateTopicStrategy('${escapeAttr(subject.id)}','${escapeAttr(topic.id)}','examImportance',this.value)"><small>Deixe vazio para usar catálogo ou peso da disciplina.</small></label><label>Esforço total estimado (min)<input type="number" min="1" step="5" placeholder="Não definido" value="${topic.estimatedStudyMinutes==null?'':topic.estimatedStudyMinutes}" data-delegated-blur="updateTopicStrategy('${escapeAttr(subject.id)}','${escapeAttr(topic.id)}','estimatedStudyMinutes',this.value)"><small>Define a carga restante, sem limitar cada sessão.</small></label></div><details class="topic-prerequisites"><summary>Pré-requisitos (${prerequisites.size})</summary><p>O tópico só entra no plano quando as bases estiverem concluídas ou com domínio suficiente.</p><div>${choices||'<small>Não há outros tópicos disponíveis.</small>'}</div></details>`;
}
