import type { JSX } from 'preact';
import { escapePresentationText } from '../components/presentation.js';

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

/** O mesmo selo para os componentes Preact. */
export function WindowBadge({ kind, title }: { kind: WindowKind; title?: string }): JSX.Element {
  return (
    <span class="performance-window" data-window={kind} title={title || undefined}>
      {WINDOW_LABELS[kind]}
    </span>
  );
}
