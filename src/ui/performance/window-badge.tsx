import type { JSX } from 'preact';
import { escapePresentationText } from '../components/presentation.js';
import { Tooltip } from '../primitives/tooltip.js';

/** Vocabulário oficial das janelas de tempo dos números de Desempenho. */
export type WindowKind = 'sevenDays' | 'period' | 'currentWeek' | 'history';

export const WINDOW_LABELS: Record<WindowKind, string> = {
  sevenDays: '7 dias',
  period: 'período',
  currentWeek: 'semana atual',
  history: 'todo o histórico',
};

/** Selo em HTML para os renderers em texto. `title` diz a janela real (ex.: "Últimos 30 dias"). */
export function renderWindowBadge(kind: WindowKind, title = ''): string {
  const attr = title ? ` title="${escapePresentationText(title)}"` : '';
  return `<span class="performance-window" data-window="${kind}"${attr}>${WINDOW_LABELS[kind]}</span>`;
}

/** O mesmo selo para os componentes Preact, com Tooltip acessível quando há descrição detalhada. */
export function WindowBadge({ kind, title }: { kind: WindowKind; title?: string }): JSX.Element {
  const label = WINDOW_LABELS[kind];
  if (!title) {
    return (
      <span class="performance-window" data-window={kind}>
        {label}
      </span>
    );
  }
  return (
    <Tooltip content={title} placement="top" align="start">
      <button
        type="button"
        class="performance-window border-0 cursor-help appearance-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        data-window={kind}
      >
        {label}
      </button>
    </Tooltip>
  );
}
