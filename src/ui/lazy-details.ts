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
