import type { JSX } from 'preact';

export interface HelpSearchHeroProps {
  chips?: Array<{ label: string; query: string }>;
}

const DEFAULT_CHIPS = [
  { label: '#revisão', query: 'revisão' },
  { label: '#prontidão', query: 'prontidão' },
  { label: '#planejamento', query: 'planejamento' },
  { label: '#aderência', query: 'aderência' },
  { label: '#backup', query: 'backup' },
  { label: '#simulados', query: 'simulados' },
  { label: '#edital', query: 'edital' },
];

export function HelpSearchHero({ chips = DEFAULT_CHIPS }: HelpSearchHeroProps = {}): JSX.Element {
  return (
    <header class="help-hero">
      <div class="module-heading">
        <div class="help-hero-head">
          <div>
            <span class="module-heading__eyebrow">Instruções · Central de Ajuda</span>
            <h2 class="module-heading__title">Como usar o StudyTrack</h2>
          </div>
          <button
            class="btn ghost small help-tour-btn"
            type="button"
            data-guided-tour-start="true"
            aria-label="Iniciar tour guiado pelo aplicativo"
          >
            🧭 Tour guiado
          </button>
        </div>
        <p class="module-heading__description">
          O StudyTrack transforma seu histórico de estudos, desempenho e informações da prova em
          prioridades e próximas ações. Use este guia para conhecer os recursos e entender como
          trabalham juntos.
        </p>
      </div>

      <label class="help-search-label" for="helpSearch">
        O que você quer aprender?
      </label>
      <div class="help-search-row">
        <input
          id="helpSearch"
          class="select-control help-search"
          type="search"
          autocomplete="off"
          placeholder="Busque por prontidão, revisão, aderência, backup..."
          aria-controls="helpGroups"
        />
        <button
          id="helpSearchClear"
          class="help-search-clear"
          type="button"
          aria-label="Limpar busca das instruções"
          hidden
        >
          Limpar ×
        </button>
      </div>

      <div
        class="help-search-chips flex flex-wrap gap-1.5 mt-2"
        role="group"
        aria-label="Filtros rápidos de busca"
      >
        <span class="text-xs text-secondary self-center mr-1">Atalhos rápidos:</span>
        {chips.map((chip, index) => (
          <button
            key={index}
            type="button"
            class="btn ghost small help-chip text-xs py-0.5 px-2 rounded-full border border-border-default hover:border-gold hover:text-gold transition-colors"
            data-help-chip={chip.query}
            aria-label={`Filtrar instruções por ${chip.query}`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <p class="help-search-status" id="helpSearchStatus" role="status" aria-live="polite"></p>
    </header>
  );
}
