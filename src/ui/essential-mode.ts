// Essential mode (F10) decorations: one-click reveals for advanced analyses and short term hints.
export const TERM_HINTS: Readonly<Record<string, string>> = Object.freeze({
  prontidao:
    'Nota de 0 a 100 que junta cobertura, domínio, retenção, consistência e simulados. Não é chance de aprovação.',
  conteudo: 'Parte dos tópicos do edital que você já concluiu.',
  revisoes: 'Revisões marcadas de hoje em diante, na agenda e no calendário.',
  sequencia: 'Dias seguidos com estudo, questões ou simulado registrados.',
});

let hintCount = 0;

/** Adds a "?" next to each [data-term] label that shows its short hint when pressed. */
export function decorateTermHints(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-term]:not([data-term-ready])').forEach(label => {
    const hint = TERM_HINTS[label.dataset.term || ''];
    if (!hint) return;
    label.dataset.termReady = '';
    const doc = label.ownerDocument;
    const id = `termHint${++hintCount}`;
    const button = doc.createElement('button');
    button.type = 'button';
    button.className = 'term-hint';
    button.setAttribute('aria-label', `O que é ${label.textContent?.trim()}?`);
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', id);
    const text = doc.createElement('span');
    text.id = id;
    text.className = 'term-hint-text';
    text.hidden = true;
    text.textContent = hint;
    button.addEventListener('click', () => {
      text.hidden = !text.hidden;
      button.setAttribute('aria-expanded', String(!text.hidden));
    });
    // The "?" is drawn by CSS and the hint sits after the label, so the label text stays the term itself.
    label.append(button);
    label.after(text);
  });
}

/** Opens an essential-mode [data-advanced] block and hides its "Mostrar …" button; callers that jump to a block (Ctrl+K, deep links) use this so essential mode never strands them. */
export function revealAdvanced(block: HTMLElement | null | undefined, focus = true) {
  if (!block) return;
  block.classList.add('is-advanced-open');
  const before = block.previousElementSibling as HTMLElement | null;
  if (before?.classList.contains('advanced-reveal')) before.hidden = true;
  if (!focus) return;
  if (!block.matches('button,a,summary,input,select,textarea,[tabindex]')) block.tabIndex = -1;
  block.focus({ preventScroll: true });
}

/** Puts a "Mostrar …" button before each [data-advanced] block; in essential mode it opens that block. */
export function decorateAdvancedReveals(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-advanced]:not([data-advanced-ready])').forEach(block => {
    block.dataset.advancedReady = '';
    const button = block.ownerDocument.createElement('button');
    button.type = 'button';
    button.className = 'btn ghost small advanced-reveal';
    button.textContent = `Mostrar ${block.dataset.advanced}`;
    button.addEventListener('click', () => revealAdvanced(block));
    block.before(button);
  });
}
