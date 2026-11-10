/** Botão "Copiar link" de um bloco com âncora (`#desempenho/<seção>/<bloco>`). */
export const renderCopyBlockLink = (block: string) =>
  `<button type="button" class="btn ghost small performance-block-link" data-performance-copy-link="${block}" aria-label="Copiar link deste bloco">Copiar link</button>`;
