import { useState } from 'preact/hooks';
import type { SleepQuality } from '../../core/types.js';
import { SLEEP_LABELS, SLEEP_QUALITIES } from '../../domain/sleep-log.js';

export interface SleepCheckinProps {
  /** Resposta de hoje; null enquanto não respondido. */
  quality: SleepQuality | null;
  onChoose: (quality: SleepQuality) => void;
}

/** Um toque por dia: como foi a noite. Depois de respondido, vira uma linha com "alterar". */
export function SleepCheckin({ quality, onChoose }: SleepCheckinProps) {
  const [editing, setEditing] = useState(false);
  if (quality && !editing) {
    return (
      <p class="sleep-checkin sleep-checkin--done">
        Sono de hoje: <strong>{SLEEP_LABELS[quality]}</strong>{' '}
        <button type="button" class="btn ghost small" onClick={() => setEditing(true)}>
          Alterar
        </button>
      </p>
    );
  }
  return (
    <div class="sleep-checkin" role="group" aria-labelledby="sleepCheckinLabel">
      <span id="sleepCheckinLabel">Como você dormiu esta noite?</span>
      {SLEEP_QUALITIES.map(option => (
        <button
          key={option}
          type="button"
          class={`btn small${quality === option ? '' : ' ghost'}`}
          aria-pressed={quality === option}
          onClick={() => {
            setEditing(false);
            onChoose(option);
          }}
        >
          {SLEEP_LABELS[option]}
        </button>
      ))}
    </div>
  );
}
