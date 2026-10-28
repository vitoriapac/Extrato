import type { JSX } from 'preact';

export interface HelpReferenceSectionProps {
  id: string;
  title: string;
  description?: string;
  items: Array<[string, string] | string[]>;
}

export function HelpReferenceSection({
  id,
  title,
  description,
  items,
}: HelpReferenceSectionProps): JSX.Element {
  return (
    <section class="help-reference" id={id}>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      <div class="help-reference-list">
        {items.map(([term, meaning], index) => (
          <article
            class="help-reference-item instruction-card instruction-card--reference"
            key={index}
          >
            <h4>{term}</h4>
            <p>{meaning}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
