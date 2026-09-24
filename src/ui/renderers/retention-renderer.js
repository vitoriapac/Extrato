export function renderTopicRetentionDashboard({rows,subjects,filters,showAll,renderFooter,escapeHtml,escapeAttr}){
  const toolbar=`<div class="retention-toolbar"><select aria-label="Filtrar retenção por disciplina" data-delegated-change="setRetentionFilter('subjectId',this.value)"><option value="">Todas as disciplinas</option>${subjects.map(subject=>`<option value="${escapeAttr(subject.id)}" ${filters.subjectId===subject.id?'selected':''}>${escapeHtml(subject.name)}</option>`).join('')}</select><select aria-label="Ordenar retenção" data-delegated-change="setRetentionFilter('order',this.value)"><option value="asc" ${filters.order==='asc'?'selected':''}>Menor retenção</option><option value="desc" ${filters.order==='desc'?'selected':''}>Maior retenção</option></select><select aria-label="Filtrar retenção por confiança" data-delegated-change="setRetentionFilter('confidence',this.value)"><option value="all">Todas as confianças</option><option value="alta" ${filters.confidence==='alta'?'selected':''}>Confiança alta</option><option value="média" ${filters.confidence==='média'?'selected':''}>Confiança média</option><option value="baixa" ${filters.confidence==='baixa'?'selected':''}>Confiança baixa</option></select></div>`;
  if(!rows.length)return toolbar+'<div class="upcoming-empty">Nenhum tópico corresponde aos filtros atuais.</div>';
  const visible=showAll?rows:rows.slice(0,8),scoreCounts=new Map();
  rows.forEach(row=>{const score=row.r.available?row.r.score:row.h.value;scoreCounts.set(score,(scoreCounts.get(score)||0)+1)});
  const repeated=[...scoreCounts.entries()].sort((a,b)=>b[1]-a[1])[0];
  const repeatedSummary=repeated&&repeated[1]>=4?`<div class="retention-pattern-note">${repeated[1]} tópicos apresentam retenção estimada em ${repeated[0]}%. Compare a confiança antes de interpretar o resultado como definitivo.</div>`:'';
  const items=visible.map(row=>{
    const score=row.r.available?row.r.score:row.h.value,classification=score>=70?'ok':score>=50?'warn':'';
    return `<div class="retention-row" title="${escapeAttr(row.r.detail||row.h.reasons[0])}"><div class="retention-topic"><strong>${escapeHtml(row.name)}</strong><span>${escapeHtml(row.subjectName)} · retenção ${row.r.available?row.r.score+'%':'—'} · saúde ${row.h.value===null?'—':row.h.value+'%'}</span></div><div class="retention-track"><div class="retention-fill ${classification}" style="width:${score}%"></div></div><div class="retention-value">${score}%</div></div>`;
  }).join('');
  const footer=renderFooter({variant:'block',total:rows.length,visible:visible.length,step:8,label:'tópicos',showMoreAction:'showAllRetention()',showAllAction:'showAllRetention()',showLessAction:showAll?'resetRetentionLimit()':''});
  return toolbar+repeatedSummary+items+footer;
}
