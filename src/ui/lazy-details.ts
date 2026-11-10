// Listas longas dentro de <details> chegam como <template data-lazy> e só entram no DOM ao abrir.
// ownOnly: ao abrir um <details>, hidrata só o que é dele; listas dentro de <details> fechados aninhados esperam a própria abertura.
export function hydrateLazy(root: ParentNode, { ownOnly = false } = {}): void {
  root.querySelectorAll<HTMLTemplateElement>('template[data-lazy]').forEach(template => {
    if (ownOnly && template.closest('details') !== root) return;
    template.replaceWith(template.content);
  });
}

export function initLazyDetails(doc: Document): void {
  // 'toggle' não borbulha; a captura pega todos os <details> da página.
  doc.addEventListener(
    'toggle',
    event => {
      const target = event.target as HTMLDetailsElement;
      if (target?.tagName === 'DETAILS' && target.open) hydrateLazy(target, { ownOnly: true });
    },
    true
  );
}

const SEARCH_MIN_OPTIONS = 9;

// Selects com muitas disciplinas ganham um campo de busca que esconde as opções sem correspondência.
export function initSearchableSelects(doc: Document): void {
  doc.querySelectorAll<HTMLSelectElement>('select[data-searchable]').forEach(select => {
    const input = doc.createElement('input');
    input.type = 'search';
    input.className = 'select-search';
    input.placeholder = 'Buscar disciplina';
    input.setAttribute('aria-label', `${select.getAttribute('aria-label') || 'Lista'}: buscar`);
    input.hidden = true;
    select.before(input);
    const sync = () => {
      const options = [...select.options];
      input.hidden = options.length < SEARCH_MIN_OPTIONS;
      const term = input.value.trim().toLowerCase();
      options.forEach((option, index) => {
        option.hidden = Boolean(term) && index > 0 && !option.text.toLowerCase().includes(term);
      });
    };
    input.addEventListener('input', sync);
    // As opções são preenchidas depois da carga; reavalia a cada mudança da lista.
    new MutationObserver(sync).observe(select, { childList: true });
    sync();
  });
}
