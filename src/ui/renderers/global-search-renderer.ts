import { renderIconSvg } from '../primitives/icon.js';

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
  const footer =
    `<div class="command-palette-footer" aria-hidden="true">` +
    `<div class="command-palette-footer-hints">` +
    `<span><kbd>↑</kbd><kbd>↓</kbd> Navegar</span>` +
    `<span><kbd>↵</kbd> Selecionar</span>` +
    `<span><kbd>ESC</kbd> Fechar</span>` +
    `</div>` +
    `<div class="command-palette-footer-meta">Paleta de Comandos</div>` +
    `</div>`;

  if (results.length === 0 && commands.length === 0) {
    const emptyIcon = renderIconSvg('search', { size: 28, className: 'command-palette-empty-icon' });
    return (
      `<div class="search-result-empty">` +
      emptyIcon +
      `<p>Nada encontrado para "${escapeHtml(query)}". Tente uma palavra mais curta ou o nome de uma aba; a Central de Ajuda fica em Instruções.</p>` +
      `</div>` +
      footer
    );
  }

  const commandItem = (command: Record<string, any>) => {
    const iconName = command.icon || (command.action ? 'bolt' : 'compass');
    const iconSvg = renderIconSvg(iconName, { size: 16, className: 'command-palette-item-icon' });
    const isAction = Boolean(command.action);
    const badgeLabel = isAction ? 'Ação' : 'Navegação';
    const badgeClass = isAction ? 'command-badge-action' : 'command-badge-nav';

    return (
      `<button type="button" role="option" aria-selected="false" class="search-result-item search-command" data-search-tab="${escapeAttr(command.tab || '')}" data-search-action="${escapeAttr(command.action || '')}">` +
      `<span class="command-palette-item-lead">${iconSvg}<strong>${escapeHtml(command.label)}</strong></span>` +
      `<span class="command-palette-item-trail"><span class="command-palette-badge ${badgeClass}">${badgeLabel}</span><span class="command-palette-shortcut" aria-hidden="true">↵</span></span>` +
      `</button>`
    );
  };

  const topicItems = results.map((result: any) => {
    const colorSlot = result.colorSlot || 1;
    const swatch = `<span class="command-palette-topic-swatch subject-bg-${colorSlot}" aria-hidden="true"></span>`;
    return (
      `<button type="button" role="option" aria-selected="false" class="search-result-item search-topic" data-search-topic="${escapeAttr(result.topicId)}" data-search-subject="${escapeAttr(result.subjectId)}">` +
      `<span class="command-palette-item-lead">${swatch}<strong>${escapeHtml(result.topicName)}</strong></span>` +
      `<span class="command-palette-item-trail"><span class="command-palette-subject-name">${escapeHtml(result.subjectName)}</span><span class="command-palette-shortcut" aria-hidden="true">↵</span></span>` +
      `</button>`
    );
  });

  const group = (label: string, items: string[]) =>
    items.length
      ? `<div role="group" aria-label="${label}" class="command-palette-group"><div class="search-group-title" aria-hidden="true"><span>${label}</span><span class="command-palette-group-count">${items.length}</span></div><div class="command-palette-group-items">${items.join('')}</div></div>`
      : '';

  const groupsHtml =
    group('Ações', commands.filter((item: any) => item.action).map(commandItem)) +
    group('Navegação', commands.filter((item: any) => item.tab).map(commandItem)) +
    group('Tópicos', topicItems);

  return `<div class="command-palette-body">${groupsHtml}</div>` + footer;
}
