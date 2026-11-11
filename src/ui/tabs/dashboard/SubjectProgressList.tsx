import type { JSX } from 'preact';

export interface SubjectProgressItem {
  id: string;
  name: string;
  percentage: number;
  colorSlot?: number;
}

export interface SubjectProgressListProps {
  subjects: SubjectProgressItem[];
}

export function SubjectProgressList({ subjects }: SubjectProgressListProps): JSX.Element {
  if (subjects.length === 0) {
    return (
      <div class="upcoming-empty">
        Adicione disciplinas na aba "Disciplinas" para ver o progresso aqui.
      </div>
    );
  }

  return (
    <>
      {subjects.map(s => (
        <div key={s.id} class="bar-row">
          <div class="bar-label flex items-center gap-2" title={s.name}>
            {s.colorSlot ? (
              <span
                class={`subject-color-swatch subject-color-${s.colorSlot}`}
                aria-hidden="true"
              />
            ) : null}
            <span class="truncate">{s.name}</span>
          </div>
          <div class="bar-track">
            <div
              class={`bar-fill ${s.colorSlot ? `subject-bg-${s.colorSlot}` : ''}`}
              style={{ width: `${s.percentage}%` }}
            />
          </div>
          <div class="bar-pct">{s.percentage}%</div>
        </div>
      ))}
    </>
  );
}
