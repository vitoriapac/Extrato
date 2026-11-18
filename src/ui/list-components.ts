// Números da paginação: até 7 páginas mostra todas; acima disso, primeira, última e vizinhas da atual.
function pageWindow(current: number, count: number): Array<number | 'gap'> {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const wanted = [...new Set([1, count, current - 1, current, current + 1])]
    .filter(n => n >= 1 && n <= count)
    .sort((x, y) => x - y);
  const out: Array<number | 'gap'> = [];
  wanted.forEach((n, i) => {
    const gap = i ? n - wanted[i - 1] : 1;
    if (gap === 2) out.push(n - 1);
    else if (gap > 2) out.push('gap');
    out.push(n);
  });
  return out;
}

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
  pageAction = (n: number) => String(n),
  actionAttr = 'data-delegated-click',
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
  // Ação do botão que leva à página n (as pontas e os números usam a mesma função).
  pageAction?: (page: number) => string;
  // Atributo que carrega a ação dos botões de página (listas montadas no DOM usam o seu próprio).
  actionAttr?: string;
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
    // Setas nas pontas e números no meio; botão sem ação nas pontas e na página atual não dispara nada.
    const button = (text: string, target: number, attrs: string, off: boolean) =>
      `<button class="list-page-btn" type="button" ${attrs}${off ? ' aria-disabled="true"' : ` ${actionAttr}="${pageAction(target)}"`}>${text}</button>`;
    const numbers = pageWindow(current, pageCount)
      .map(item =>
        item === 'gap'
          ? '<span class="list-page-gap" aria-hidden="true">…</span>'
          : button(
              String(item),
              item,
              `aria-label="Página ${item}"${item === current ? ' aria-current="page"' : ''}${pageCount > 5 && item !== 1 && item !== pageCount && item !== current ? ' data-hide-sm' : ''}`,
              false
            )
      )
      .join('');
    return wrap(`<nav class="list-pagination" aria-label="Paginação de ${label}">
    <span class="list-view-count" aria-live="polite">Exibindo ${from}–${to} de ${total} ${label}</span>
    <span class="sr-only">Página ${current} de ${pageCount}</span>
    <div class="list-page-group">
      ${button('‹', current - 1, 'aria-label="Página anterior" data-page-dir="prev"', current <= 1)}${numbers}${button('›', current + 1, 'aria-label="Próxima página" data-page-dir="next"', current >= pageCount)}
    </div>
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
