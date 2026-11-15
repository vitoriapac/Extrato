// "Mostrar mais N": as linhas além do limite ficam num <template> e só entram no DOM ao clicar.
let counter = 0;

export function lazyMore(html: string, count: number, { inList = false } = {}) {
  if (!html) return '';
  const key = `lm${++counter}`;
  const button = `<button type="button" class="btn ghost small" data-lazy-more="${key}">Mostrar mais ${count}</button>`;
  return `<template data-lazy-more-body="${key}">${html}</template>${inList ? `<li class="lazy-more-item">${button}</li>` : button}`;
}

export function bindLazyMore(doc: Document) {
  doc.addEventListener('click', event => {
    const button = (event.target as HTMLElement).closest?.<HTMLElement>('[data-lazy-more]');
    if (!button) return;
    const template = doc.querySelector<HTMLTemplateElement>(
      `template[data-lazy-more-body="${button.dataset.lazyMore}"]`
    );
    template?.replaceWith(template.content);
    (button.closest('.lazy-more-item') || button).remove();
  });
}
