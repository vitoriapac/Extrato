export function renderGlobalSearchPanel({
  query,
  commands,
  results,
  escapeHtml,
  escapeAttr,
}: {
  query: string;
  commands: Array<Record<string, any>>;
  results: Array<Record<string, any>>;
  escapeHtml: (value: string) => string;
  escapeAttr: (value: string) => string;
}) {
  if (results.length === 0 && commands.length === 0)
    return `<div class="search-result-empty">Nada encontrado para "${escapeHtml(query)}"</div>`;
  const commandItem = (command: Record<string, any>) =>
    `<button type="button" role="option" aria-selected="false" class="search-result-item search-command" data-search-tab="${escapeAttr(command.tab || '')}" data-search-action="${escapeAttr(command.action || '')}"><strong>${escapeHtml(command.label)}</strong><span>${command.action ? 'Ação' : 'Navegação'}</span></button>`;
  const topicItems = results.map(
    (result: any) =>
      `<button type="button" role="option" aria-selected="false" class="search-result-item" data-search-topic="${escapeAttr(result.topicId)}" data-search-subject="${escapeAttr(result.subjectId)}"><strong>${escapeHtml(result.topicName)}</strong><span>${escapeHtml(result.subjectName)}</span></button>`
  );
  const group = (label: string, items: string[]) =>
    items.length
      ? `<div role="group" aria-label="${label}"><div class="search-group-title" aria-hidden="true">${label}</div>${items.join('')}</div>`
      : '';
  return (
    group('Ações', commands.filter((item: any) => item.action).map(commandItem)) +
    group('Navegação', commands.filter((item: any) => item.tab).map(commandItem)) +
    group('Tópicos', topicItems)
  );
}
