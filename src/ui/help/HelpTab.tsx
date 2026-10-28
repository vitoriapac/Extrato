import type { JSX } from 'preact';
import { HelpSearchHero } from './HelpSearchHero.js';
import { HelpCategoryNav } from './HelpCategoryNav.js';
import { HelpTopicCard, type HelpTopicEntry } from './HelpTopicCard.js';
import { HelpReferenceSection } from './HelpReferenceSection.js';
import { HELP_CATEGORIES, HELP_GLOSSARY, HELP_FAQ } from './help-content.js';

export interface HelpCategory {
  id: string;
  title: string;
  summary: string;
  entries: HelpTopicEntry[];
}

export interface HelpTabProps {
  categories?: HelpCategory[];
  glossary?: Array<[string, string] | string[]>;
  faq?: Array<[string, string] | string[]>;
}

export function HelpTab({
  categories = HELP_CATEGORIES,
  glossary = HELP_GLOSSARY,
  faq = HELP_FAQ,
}: HelpTabProps = {}): JSX.Element {
  return (
    <div class="help-center-wrapper">
      <HelpSearchHero />

      <HelpCategoryNav categories={categories} />

      <div id="helpGroups" class="help-groups">
        {categories.map((category, index) => (
          <div key={category.id} class="help-group-wrapper">
            <section
              class="help-group instruction-section"
              id={category.id}
              data-help-group=""
              tabIndex={-1}
            >
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
                {category.entries.map(entry => (
                  <HelpTopicCard key={entry.id} entry={entry} />
                ))}
              </div>
            </section>

            {index === 2 && (
              <aside class="help-principle" data-help-principle="">
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
          </div>
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
    </div>
  );
}
