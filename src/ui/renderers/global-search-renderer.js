export function renderGlobalSearchPanel({query,commands,results,escapeHtml,escapeAttr}){
  if(results.length===0&&commands.length===0)return `<div class="search-result-empty">Nada encontrado pra "${escapeHtml(query)}"</div>`;
  const commandItems=commands.map(command=>`<button type="button" role="option" aria-selected="false" class="search-result-item search-command" data-search-tab="${escapeAttr(command.tab||'')}" data-search-action="${escapeAttr(command.action||'')}"><strong>${escapeHtml(command.label)}</strong><span>Ação da aplicação</span></button>`);
  const topicItems=results.map(result=>`<button type="button" role="option" aria-selected="false" class="search-result-item" data-search-topic="${escapeAttr(result.topicId)}" data-search-subject="${escapeAttr(result.subjectId)}"><strong>${escapeHtml(result.topicName)}</strong><span>${escapeHtml(result.subjectName)}</span></button>`);
  return [...commandItems,...topicItems].join('');
}
