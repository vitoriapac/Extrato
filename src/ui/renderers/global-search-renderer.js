export function renderGlobalSearchPanel({query,commands,results,escapeHtml,escapeAttr}){
  if(results.length===0&&commands.length===0)return `<div class="search-result-empty">Nada encontrado pra "${escapeHtml(query)}"</div>`;
  const commandItem=command=>`<button type="button" role="option" aria-selected="false" class="search-result-item search-command" data-search-tab="${escapeAttr(command.tab||'')}" data-search-action="${escapeAttr(command.action||'')}"><strong>${escapeHtml(command.label)}</strong><span>${command.action?'Ação':'Navegação'}</span></button>`;
  const topicItems=results.map(result=>`<button type="button" role="option" aria-selected="false" class="search-result-item" data-search-topic="${escapeAttr(result.topicId)}" data-search-subject="${escapeAttr(result.subjectId)}"><strong>${escapeHtml(result.topicName)}</strong><span>${escapeHtml(result.subjectName)}</span></button>`);
  const group=(label,items)=>items.length?`<div role="group" aria-label="${label}"><div class="search-group-title" aria-hidden="true">${label}</div>${items.join('')}</div>`:'';
  return group('Ações',commands.filter(item=>item.action).map(commandItem))+group('Navegação',commands.filter(item=>item.tab).map(commandItem))+group('Tópicos',topicItems);
}
