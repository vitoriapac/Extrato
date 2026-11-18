export function renderCollectionFooter({
  total,
  visible,
  step = 0,
  showMoreAction = '',
  showAllAction = '',
  showLessAction = '',
  colspan = 1,
  label = 'itens',
  variant = 'table',
  mode = 'more',
  page = 1,
  pageSize = 10,
  prevAction = '',
  nextAction = '',
}: {
  total: number;
  visible: number;
  step?: number;
  showMoreAction?: string;
  showAllAction?: string;
  showLessAction?: string;
  colspan?: number;
  label?: string;
  variant?: string;
  mode?: 'more' | 'pages';
  page?: number;
  pageSize?: number;
  prevAction?: string;
  nextAction?: string;
}) {
  const wrap = (controls: string) =>
    variant === 'block'
      ? `<div class="list-summary-footer">${controls}</div>`
      : `<tr class="list-view-footer"><td colspan="${colspan}">${controls}</td></tr>`;
  if (mode === 'pages') {
    const pageCount = Math.ceil(total / pageSize);
    if (pageCount <= 1) return '';
    const current = Math.min(pageCount, Math.max(1, page));
    const from = (current - 1) * pageSize + 1;
    const to = Math.min(total, current * pageSize);
    // Sem data-delegated-click quando desabilitado: o clique não dispara nada nas pontas.
    const button = (text: string, action: string, off: boolean) =>
      `<button class="list-page-btn" type="button"${off ? ' aria-disabled="true"' : ` data-delegated-click="${action}"`}>${text}</button>`;
    return wrap(`<nav class="list-view-controls list-pagination" aria-label="Paginação de ${label}">
    <span class="list-view-count" aria-live="polite">Exibindo ${from}–${to} de ${total} ${label}</span>
    ${button('‹ Anterior', prevAction, current <= 1)}
    <span class="list-page-status">Página ${current} de ${pageCount}</span>
    ${button('Próxima ›', nextAction, current >= pageCount)}
  </nav>`);
  }
  if (total <= visible && visible <= 0) return '';
  const shown = Math.min(total, visible);
  if (total <= shown && shown <= 0) return '';
  if (step > 0 && total <= shown && shown <= step) return '';
  const controls = `<div class="list-view-controls">
    <span class="list-view-count">Exibindo ${shown} de ${total} ${label}</span>
    ${shown < total && (showAllAction || showMoreAction) ? `<button class="progressive-list-toggle" type="button" aria-expanded="false" data-progressive-legacy data-delegated-click="${showAllAction || showMoreAction}">Mostrar mais · +${total - shown} ↓</button>` : ''}
    ${shown >= total && showLessAction ? `<button class="progressive-list-toggle" type="button" aria-expanded="true" data-progressive-legacy data-delegated-click="${showLessAction}">Mostrar menos ↑</button>` : ''}
  </div>`;
  return wrap(controls);
}

export function renderGroupHeader({
  title,
  count,
  tone = 'neutral',
  expanded = true,
  toggleAction = '',
  colspan = 8,
}: {
  title: string;
  count: number | string;
  tone?: string;
  expanded?: boolean;
  toggleAction?: string;
  colspan?: number;
}) {
  const content = `<span class="review-group-title">${title}</span><span class="review-group-meta"><span class="count-badge">${count}</span>${toggleAction ? `<span class="review-group-chevron" aria-hidden="true">›</span>` : ''}</span>`;
  return `<tr class="review-group-row ${tone}"><td colspan="${colspan}">${toggleAction ? `<button type="button" class="review-group-header" aria-expanded="${expanded}" data-delegated-click="${toggleAction}">${content}</button>` : `<div class="review-group-header static">${content}</div>`}</td></tr>`;
}
