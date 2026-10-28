import type { JSX } from 'preact';
import { HelpVisualRenderer } from './HelpVisualRenderer.js';
import { buildHelpSearchIndex } from './help-search.js';

export interface HelpTopicEntry {
  id: string;
  title: string;
  summary: string;
  kind?: string;
  wide?: boolean;
  keywords?: string[];
  concepts?: string[];
  questions?: string[];
  visual?: any;
  paragraphs?: string[];
  steps?: Array<{ title: string; detail?: string } | string>;
  flow?: string[];
  bullets?: string[];
  note?: string;
  action?: { label: string; target: string };
  [key: string]: any;
}

export interface HelpTopicCardProps {
  entry: HelpTopicEntry;
}

export function HelpTopicCard({ entry }: HelpTopicCardProps): JSX.Element {
  const kind = ['feature', 'concept', 'reference'].includes(entry.kind || '')
    ? entry.kind
    : 'feature';
  const wideClass = entry.wide ? ' instruction-card--wide' : '';
  const stepsClass = entry.steps?.length ? ' help-topic--steps' : '';
  const cardClass = `help-topic${wideClass} instruction-card instruction-card--${kind}${stepsClass}`;

  const allKeywords = [
    ...(entry.keywords || []),
    ...(entry.concepts || []),
    ...(entry.questions || []),
  ].join(' ');

  const searchIndex = buildHelpSearchIndex(entry);

  return (
    <article
      class={cardClass}
      id={entry.id}
      data-help-topic=""
      data-help-title={entry.title}
      data-help-keywords={allKeywords}
      data-help-search={searchIndex}
    >
      <h4>{entry.title}</h4>
      <p class="help-topic-summary">{entry.summary}</p>
      <div class="help-topic-body">
        <HelpVisualRenderer visual={entry.visual} />
        {(entry.paragraphs || []).map((p, index) => (
          <p key={index}>{p}</p>
        ))}
        {Boolean(entry.steps?.length) && (
          <ol class="help-timeline">
            {entry.steps!.map((step, index) => {
              const title = typeof step === 'string' ? step : step.title;
              const detail = typeof step === 'object' ? step.detail : undefined;
              return (
                <li key={index}>
                  <span>{title}</span>
                  {detail && <small>{detail}</small>}
                </li>
              );
            })}
          </ol>
        )}
        {Boolean(entry.flow?.length) && (
          <div class="help-flow" aria-label="Fluxo resumido">
            {entry.flow!.map((step, index) => (
              <span key={index}>
                <span class="help-flow-step">{step}</span>
                {index < entry.flow!.length - 1 && (
                  <span class="help-flow-arrow" aria-hidden="true">
                    {' → '}
                  </span>
                )}
              </span>
            ))}
          </div>
        )}
        {Boolean(entry.bullets?.length) && (
          <ul class="help-bullets">
            {entry.bullets!.map((item, index) => (
              <li key={index}>{item}</li>
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
