import { render } from 'preact-render-to-string';
import { render as preactMount } from 'preact';
import { buildHelpSearchIndex } from './help-search.js';
import { renderHelpVisual } from './help-visuals.js';
import { HELP_CATEGORIES, HELP_GLOSSARY, HELP_FAQ } from './help-content.js';

export function HelpTopicCard({ entry }: { entry: any }) {
  const kind = ['feature', 'concept', 'reference'].includes(entry.kind) ? entry.kind : 'feature';
  const cardClasses = [
    'help-topic',
    entry.wide ? 'instruction-card--wide' : '',
    'instruction-card',
    `instruction-card--${kind}`,
    entry.steps?.length ? 'help-topic--steps' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const keywords = [
    ...(entry.keywords || []),
    ...(entry.concepts || []),
    ...(entry.questions || []),
  ].join(' ');

  return (
    <article
      class={cardClasses}
      id={entry.id}
      data-help-topic
      data-help-title={entry.title}
      data-help-keywords={keywords}
      data-help-search={buildHelpSearchIndex(entry)}
    >
      <h4>{entry.title}</h4>
      <p class="help-topic-summary">{entry.summary}</p>
      <div class="help-topic-body">
        {entry.visual && (
          <div dangerouslySetInnerHTML={{ __html: renderHelpVisual(entry.visual) }} />
        )}
        {(entry.paragraphs || []).map((p: string, idx: number) => (
          <p key={idx}>{p}</p>
        ))}
        {entry.steps?.length > 0 && (
          <ol class="help-timeline">
            {entry.steps.map((step: any, idx: number) => (
              <li key={idx}>
                <span>{typeof step === 'string' ? step : step.title}</span>
                {typeof step === 'object' && step.detail && <small>{step.detail}</small>}
              </li>
            ))}
          </ol>
        )}
        {entry.flow?.length > 0 && (
          <div class="help-flow" aria-label="Fluxo resumido">
            {entry.flow.map((step: string, idx: number) => (
              <>
                <span key={idx} class="help-flow-step">
                  {step}
                </span>
                {idx < entry.flow.length - 1 && (
                  <span class="help-flow-arrow" aria-hidden="true">
                    →
                  </span>
                )}
              </>
            ))}
          </div>
        )}
        {entry.bullets?.length > 0 && (
          <ul class="help-bullets">
            {entry.bullets.map((item: string, idx: number) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        )}
        {entry.note && (
          <aside class="help-note context-note context-note--tip">
            <strong>Dica</strong>
            <p>{entry.note}</p>
          </aside>
        )}
        {entry.action && (
          <button type="button" class="help-text-link" data-help-action={entry.action.target}>
            {entry.action.label} <span aria-hidden="true">→</span>
          </button>
        )}
      </div>
    </article>
  );
}

export function HelpGroupSection({ category, index }: { category: any; index: number }) {
  return (
    <section class="help-group instruction-section" id={category.id} data-help-group tabIndex={-1}>
      <header class="help-group-heading">
        <span class="help-group-marker" aria-hidden="true">
          {String(index + 1).padStart(2, '0')}
        </span>
        <div>
          <h3>{category.title}</h3>
          <p>{category.summary}</p>
        </div>
      </header>
      <div class="help-group-body instruction-card-grid">
        {category.entries.map((entry: any) => (
          <HelpTopicCard key={entry.id} entry={entry} />
        ))}
      </div>
    </section>
  );
}

export function HelpReferenceSection({
  id,
  title,
  description = '',
  items = [],
}: {
  id: string;
  title: string;
  description?: string;
  items?: any[];
}) {
  return (
    <section class="help-reference" id={id}>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      <div class="help-reference-list">
        {items.map(([term, meaning]: [string, string], idx: number) => (
          <article
            key={idx}
            class="help-reference-item instruction-card instruction-card--reference"
          >
            <h4>{term}</h4>
            <p>{meaning}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function HelpCenter({
  categories = HELP_CATEGORIES,
  glossary = HELP_GLOSSARY,
  faq = HELP_FAQ,
}: any = {}) {
  return (
    <>
      <header class="help-hero">
        <div class="module-heading">
          <span class="module-heading__eyebrow">Instruções · Central de Ajuda</span>
          <h2 class="module-heading__title">Como usar o StudyTrack</h2>
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
        <p class="help-search-status" id="helpSearchStatus" role="status" aria-live="polite" />
      </header>

      <nav class="help-card-grid" aria-label="Capítulos da ajuda">
        {categories.map((category: any, index: number) => (
          <div key={category.id} class="help-guide-card">
            <button
              type="button"
              class="help-category-link"
              data-help-category={category.id}
              aria-controls={category.id}
              aria-current={index === 0 ? 'location' : undefined}
            >
              {category.title}
            </button>
          </div>
        ))}
      </nav>

      <div id="helpGroups" class="help-groups">
        {categories.map((category: any, index: number) => (
          <>
            <HelpGroupSection key={category.id} category={category} index={index} />
            {index === 2 && (
              <aside class="help-principle" data-help-principle>
                <span class="section-eyebrow">O que torna o StudyTrack diferente</span>
                <h3>Da prova à próxima ação</h3>
                <p>
                  O StudyTrack combina a importância do conteúdo na prova com sua situação de
                  aprendizagem para orientar o próximo estudo.
                </p>
                <div
                  class="help-principle-flow"
                  aria-label="Prova e situação pessoal levam à prioridade, ação e resultado"
                >
                  <span>Prova</span>
                  <span aria-hidden="true">×</span>
                  <span>Você</span>
                  <span aria-hidden="true">→</span>
                  <span>Prioridade</span>
                  <span aria-hidden="true">→</span>
                  <span>Ação</span>
                  <span aria-hidden="true">→</span>
                  <span>Resultado</span>
                </div>
                <p>
                  Domínio, retenção, tendência, revisões e evidências ajudam a explicar cada
                  decisão.
                </p>
              </aside>
            )}
          </>
        ))}
      </div>

      <p class="help-no-results ui-state--empty" id="helpNoResults" role="status" hidden>
        Nenhum assunto encontrado. Tente outra palavra ou limpe a busca.
      </p>

      <HelpReferenceSection
        id="guide-glossary"
        title="Glossário"
        description="Definições curtas para consultar quando um indicador aparecer."
        items={glossary}
      />
      <HelpReferenceSection id="guide-faq" title="Dúvidas frequentes" items={faq} />
    </>
  );
}

export function renderHelpCenter(props: any = {}) {
  return render(<HelpCenter {...props} />);
}

export function mountHelpCenter(container: HTMLElement, props: any = {}) {
  preactMount(<HelpCenter {...props} />, container);
}
