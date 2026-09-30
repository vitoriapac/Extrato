import {renderQuestionEvolution} from '../renderers/question-evolution-renderer.js';

const shown=(value,suffix='')=>value==null?'—':`${value}${suffix}`;

export function renderPerformanceTopicDialog(model,{formatDate,escapeHtml}={}){
  if(!model)return '';
  const topic=model.topic,profile=model.examProfile;
  const events=model.events.length?`<ol class="performance-topic-events">${model.events.map(item=>`<li><span>${escapeHtml(formatDate(item.date))}</span><strong>${escapeHtml(item.label)}</strong></li>`).join('')}</ol>`:'<p class="analytics-note">Nenhuma mudança de estado registrada para este tópico.</p>';
  return `<dialog class="performance-topic-dialog" id="performanceTopicDialog" aria-labelledby="performanceTopicTitle"><div class="performance-topic-dialog-inner"><header class="performance-topic-dialog-head"><div><span class="section-eyebrow">DISCIPLINA · TÓPICO</span><h3 id="performanceTopicTitle">${escapeHtml(topic.name)}</h3></div><button type="button" class="btn ghost small" data-performance-close-topic aria-label="Fechar detalhes do tópico">Fechar</button></header>
    <p class="analytics-note">Precisão e volume referem-se ao período selecionado. Domínio, retenção e incidência mostram a leitura atual.</p>
    <dl class="performance-topic-facts"><div><dt>Precisão</dt><dd>${shown(topic.accuracy,'%')}</dd></div><div><dt>Questões</dt><dd>${topic.questions}</dd></div><div><dt>Domínio</dt><dd>${shown(topic.mastery,'/100')}</dd></div><div><dt>Retenção</dt><dd>${shown(topic.retention,'/100')}</dd></div><div><dt>Incidência histórica</dt><dd>${escapeHtml(profile?.presenceLevel||'Sem dados')}</dd></div><div><dt>Confiança histórica</dt><dd>${escapeHtml(profile?.confidenceLabel||'Sem dados')}</dd></div></dl>
    <section class="performance-block"><h4>Evolução das questões</h4>${renderQuestionEvolution(model.evolution,{formatDate})}</section>
    <section class="performance-block"><h4>Histórico de estados registrados</h4>${events}</section>
    <footer class="performance-topic-actions"><button type="button" class="btn ghost small" data-analysis-nav="hoje" data-subject-id="${escapeHtml(model.subjectId||'')}" data-topic-id="${escapeHtml(topic.id)}">Ver diagnóstico</button><button type="button" class="btn ghost small" data-analysis-nav="metas" data-subject-id="${escapeHtml(model.subjectId||'')}" data-topic-id="${escapeHtml(topic.id)}">Ver no planejamento</button></footer></div></dialog>`;
}
