import type { JSX } from 'preact';

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

export interface CollectionFooterProps {
  total: number;
  page?: number;
  pageSize?: number;
  pageAction?: (page: number) => string;
  label?: string;
}

export function CollectionFooter({
  total,
  page = 1,
  pageSize = 10,
  pageAction = (n: number) => String(n),
  label = 'itens',
}: CollectionFooterProps): JSX.Element | null {
  const pageCount = Math.ceil(total / pageSize);
  if (pageCount <= 1) return null;
  const current = Math.min(pageCount, Math.max(1, page));
  const from = (current - 1) * pageSize + 1;
  const to = Math.min(total, current * pageSize);

  return (
    <div class="list-summary-footer">
      <nav class="list-pagination" aria-label={`Paginação de ${label}`}>
        <span class="list-view-count" aria-live="polite">
          Exibindo {from}–{to} de {total} {label}
        </span>
        <div class="list-pagination-buttons">
          <button
            class="list-page-btn"
            type="button"
            aria-label="Página anterior"
            aria-disabled={current <= 1 ? 'true' : undefined}
            data-delegated-click={current <= 1 ? undefined : pageAction(current - 1)}
          >
            ‹
          </button>
          {pageWindow(current, pageCount).map((item, idx) =>
            item === 'gap' ? (
              <span key={`gap-${idx}`} class="list-page-gap" aria-hidden="true">
                …
              </span>
            ) : (
              <button
                key={item}
                class="list-page-btn"
                type="button"
                aria-label={`Página ${item}`}
                aria-current={item === current ? 'page' : undefined}
                data-hide-sm={
                  pageCount > 5 && item !== 1 && item !== pageCount && item !== current
                    ? ''
                    : undefined
                }
                data-delegated-click={pageAction(item)}
              >
                {item}
              </button>
            )
          )}
          <button
            class="list-page-btn"
            type="button"
            aria-label="Próxima página"
            aria-disabled={current >= pageCount ? 'true' : undefined}
            data-delegated-click={current >= pageCount ? undefined : pageAction(current + 1)}
          >
            ›
          </button>
        </div>
      </nav>
    </div>
  );
}
