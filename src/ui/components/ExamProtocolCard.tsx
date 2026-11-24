import type { ExamProtocol } from '../../domain/planning/exam-protocol.js';
import { Icon } from '../primitives/icon.js';

export interface ExamProtocolCardProps {
  protocol: ExamProtocol;
  onToggle: (key: string) => void;
}

export function ExamProtocolCard({ protocol, onToggle }: ExamProtocolCardProps) {
  const done = protocol.items.filter(item => item.checked).length;
  return (
    <section class="exam-protocol mb-4" aria-labelledby="examProtocolTitle">
      <header class="exam-protocol__head">
        <Icon name="list-check" size={16} class="shrink-0" />
        <h3 id="examProtocolTitle" class="m-0">
          {protocol.title}
        </h3>
        <span class="exam-protocol__count">
          {done} de {protocol.items.length}
        </span>
      </header>
      <p class="exam-protocol__note">{protocol.note}</p>
      <ul class="exam-protocol__list">
        {protocol.items.map(item => (
          <li key={item.key}>
            <label>
              <input type="checkbox" checked={item.checked} onChange={() => onToggle(item.key)} />
              <span>{item.label}</span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
