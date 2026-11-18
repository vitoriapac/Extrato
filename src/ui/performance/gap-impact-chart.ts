import { formatDecimal } from '../../core/format-number.js';
import { renderBulletBar } from '../primitives/charts/charts.js';

type Row = Record<string, any>;
const TOP = 5;
const MIN_TOPICS = 3;
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const metric = (item: Row, key: 'mastery' | 'impact') => {
  for (const signal of item.signals || []) if (finite(signal?.metrics?.[key])) return signal.metrics[key] as number;
  return null;
};

/**
 * Lacuna × impacto dos primeiros tópicos da fila que têm os dois números, agrupados por disciplina.
 * Lacuna = 100 − domínio; impacto = peso do tópico na prova (0 a 100). Com menos de 3 tópicos, sem gráfico.
 */
export function renderGapImpactChart(
  rows: Row[],
  { escapeHtml }: { escapeHtml: (value: any) => string }
) {
  const topics = rows
    .filter(item => item.granularity === 'topic')
    .map(item => ({ item, mastery: metric(item, 'mastery'), impact: metric(item, 'impact') }))
    .filter(entry => entry.mastery != null && entry.impact != null)
    .slice(0, TOP);
  if (topics.length < MIN_TOPICS) return '';
  const groups = new Map<string, typeof topics>();
  for (const entry of topics) {
    const key = entry.item.subjectName || 'Sem disciplina';
    groups.set(key, [...(groups.get(key) || []), entry]);
  }
  const body = [...groups]
    .map(([subject, entries]) => {
      const lines = entries
        .map(({ item, mastery, impact }) => {
          const gap = Math.round((100 - (mastery as number)) * 10) / 10;
          return `<li class="gap-impact__row"><span class="gap-impact__name">${escapeHtml(item.name)}</span><div class="gap-impact__bars">${renderBulletBar({ value: gap, max: 100, label: `${item.name}: lacuna (100 menos o domínio ${formatDecimal(mastery as number)})`, unit: '', className: 'gap-impact__bar gap-impact__bar--gap' })}${renderBulletBar({ value: impact as number, max: 100, label: `${item.name}: impacto na prova`, unit: '', className: 'gap-impact__bar gap-impact__bar--impact' })}</div></li>`;
        })
        .join('');
      return `<section class="gap-impact__group"><h4>${escapeHtml(subject)}</h4><ul>${lines}</ul></section>`;
    })
    .join('');
  return `<details class="gap-impact-fold"><summary>Lacuna × impacto dos primeiros ${topics.length} tópicos</summary><section class="performance-block gap-impact" aria-label="Lacuna e impacto dos primeiros tópicos"><p class="analytics-note gap-impact__legend"><span aria-hidden="true"><b class="gap-impact__key is-gap"></b> lacuna (100 − domínio) · <b class="gap-impact__key is-impact"></b> impacto na prova</span> · escalas de 0 a 100, entre os primeiros da fila abaixo, os que têm lacuna e impacto medidos.</p>${body}</section></details>`;
}
