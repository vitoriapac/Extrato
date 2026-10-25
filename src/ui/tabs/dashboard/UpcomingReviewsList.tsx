import type { JSX } from 'preact';

export interface UpcomingReviewItem {
  id: string;
  date: string;
  dateFormatted: string;
  subject: string;
  label: string;
  status: string;
  origem: string;
}

export interface UpcomingReviewsListProps {
  items: UpcomingReviewItem[];
}

export function UpcomingReviewsList({
  items,
}: UpcomingReviewsListProps): JSX.Element {
  if (items.length === 0) {
    return (
      <li class="upcoming-empty">
        Nenhuma revisão futura cadastrada. Adicione datas no Calendário ou gere a
        Agenda de Revisões.
      </li>
    );
  }

  return (
    <>
      {items.map((item, idx) => (
        <li key={`${item.id}-${idx}`}>
          <span class="upcoming-date">{item.dateFormatted}</span>
          <span style={{ flex: '1' }}>
            <strong>{item.subject || '—'}</strong> — {item.label}
            <span class="item-origin">{item.origem}</span>
          </span>
          <span class="subject-progress-pill">
            {item.status || 'Não iniciado'}
          </span>
        </li>
      ))}
    </>
  );
}
