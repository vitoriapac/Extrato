import {renderQuestionEvolution} from '../renderers/question-evolution-renderer.js';
import {renderPerformanceStory,renderPerformanceSummary,renderPerformanceDetails} from './performance-story.js';

const number=value=>value==null?'—':String(value);
const percent=value=>value==null?'—':`${value}%`;
const delta=value=>value==null?'Sem base anterior':`${value>0?'+':''}${Math.round(value*10)/10} p.p.`;

export function renderPerformanceQuestions({evolution,analysis,previousAccuracy=null,range,formatDate,escapeHtml}={}){
  if(!analysis.questionCount)return '<div class="empty-state empty-state--compact" role="status"><strong>Sem questões neste período</strong><p>Registre questões pessoais vinculadas a tópicos do concurso ativo para acompanhar precisão, volume e erros.</p><button type="button" class="btn ghost small" data-performance-open="questoes">Registrar questões</button></div>';
  const trend=range.comparePrevious&&analysis.accuracy!=null&&previousAccuracy!=null?analysis.accuracy-previousAccuracy:null;
  const kpis=`<section class="performance-kpis" aria-label="Indicadores de questões">
    <article class="performance-kpi"><span>Questões resolvidas</span><strong>${analysis.questionCount}</strong><small>Respostas pessoais no período</small></article>
    <article class="performance-kpi"><span>Precisão</span><strong>${percent(analysis.accuracy)}</strong><small>Acertos ÷ questões resolvidas</small></article>
    <article class="performance-kpi"><span>Erros</span><strong>${analysis.errors}</strong><small>Inclui erros sem categoria</small></article>
    <article class="performance-kpi"><span>Evolução</span><strong>${delta(trend)}</strong><small>${range.comparePrevious?'Precisão × período anterior':'Comparação desativada'}</small></article>
  </section>`;
  const buckets=evolution.buckets.map(row=>`<tr><th scope="row">${escapeHtml(row.key)}</th><td>${row.resolved}</td><td>${row.correct}</td><td>${row.errors}</td><td>${percent(row.accuracy)}</td></tr>`).join('');
  const volume=`<section class="performance-block"><h3>Volume × precisão</h3>${buckets?`<div class="performance-table-scroll"><table><caption>Acertos, erros e precisão por período; a média móvel exige amostra mínima.</caption><thead><tr><th>Período</th><th>Questões</th><th>Acertos</th><th>Erros</th><th>Precisão</th></tr></thead><tbody>${buckets}</tbody></table></div>`:'<p class="empty-state empty-state--compact">Sem questões neste período.</p>'}</section>`;
  const categories=analysis.errorCategories.filter(item=>item.count>0);
  const errors=`<section class="performance-block"><h3>Perfil de erros</h3>${categories.length?`<ul class="performance-changes">${categories.map(row=>`<li><strong>${escapeHtml(row.label)}</strong><span>${row.count}</span></li>`).join('')}${analysis.uncategorizedErrors?`<li><strong>Sem categoria</strong><span>${analysis.uncategorizedErrors}</span></li>`:''}</ul>`:'<p class="empty-state empty-state--compact">Nenhum erro categorizado neste período.</p>'}</section>`;
  const comparable=analysis.topics.filter(item=>item.delta!=null);
  const grouped=(title,rows)=>`<div><h4>${title}</h4>${rows.length?`<ul class="performance-changes">${rows.map(row=>`<li><strong>${escapeHtml(row.name)}</strong><span>${delta(row.delta)} · ${row.beforeTotal} → ${row.afterTotal} questões</span></li>`).join('')}</ul>`:'<p class="analytics-note">Nenhum tópico com 30 questões em cada metade do período.</p>'}</div>`;
  const topics=`<section class="performance-block"><h3>Tópicos em evolução</h3><p class="analytics-note">Comparação entre metades do período. Cada metade precisa de pelo menos 30 questões; a mudança na dificuldade das questões também pode afetar a precisão.</p><div class="performance-topic-groups">${grouped('Maiores evoluções',comparable.filter(item=>item.delta>0).sort((a,b)=>b.delta-a.delta).slice(0,5))}${grouped('Maiores quedas',comparable.filter(item=>item.delta<0).sort((a,b)=>a.delta-b.delta).slice(0,5))}</div></section>`;
  const summary=analysis.accuracy==null?'Ainda não há precisão calculável.':`Precisão de ${analysis.accuracy}% em ${analysis.questionCount} questões respondidas.`;
  return `${renderPerformanceSummary(renderPerformanceStory({title:'Resultado das questões',summary,details:[trend==null?'Evolução sem base comparável.':`Variação de ${delta(trend)} frente ao período anterior.`,`${analysis.errors} erros no período.`]},escapeHtml),kpis)}<section class="performance-block"><h3>Precisão ao longo do tempo</h3>${renderQuestionEvolution(evolution,{formatDate})}</section>${renderPerformanceDetails('Volume, erros e tópicos',volume+errors+topics)}`;
}
