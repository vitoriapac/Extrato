import { renderBulletBar } from '../primitives/charts/charts.js';
import { formatDecimal } from '../../core/format-number.js';

const escape = (value: unknown) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (char: string) =>
      (
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }) as Record<
          string,
          string
        >
      )[char]
  );
const stateText = (value: Record<string, any>) =>
  value.state === 'insufficient'
    ? 'amostra insuficiente'
    : value.state === 'on_target'
      ? 'na meta'
      : formatDecimal(Math.abs(value.gap)) + ' p.p. abaixo da meta';
const cell = (value: Record<string, any>) =>
  `${value.accuracy == null ? 'sem dados' : formatDecimal(value.accuracy) + '%'} · ${value.total} questões · ${stateText(value)}`;

// One bar per subject for the week's own questions; simulations and the full figures stay in "Ver dados".
export function renderSubjectAccuracy(rows: any[] = []) {
  const bars = rows
    .map(row => {
      const sample = row.personal;
      // Under ten questions the target is not judged, so the bar carries no target mark or amber.
      const judged = sample.state !== 'insufficient';
      return `<li class="subject-accuracy-chart__row${sample.state === 'below_target' ? ' is-below' : ''}"><span class="subject-accuracy-chart__name">${escape(row.name)}</span>${renderBulletBar({ value: sample.accuracy, target: judged ? row.target : undefined, label: `${row.name}, questões pessoais`, className: 'subject-accuracy-chart__bar' })}<span class="subject-accuracy-chart__state">${sample.total ? stateText(sample) : ''}</span></li>`;
    })
    .join('');
  return `<details class="subject-accuracy-summary"><summary>Metas de acerto por disciplina</summary><p>Metas de desempenho pessoal, separadas de domínio, incidência e peso de prova. Questões e simulados são apresentados separadamente; menos de dez questões não permitem classificar a meta.</p><p class="subject-accuracy-chart__caption">Questões pessoais da semana; o traço marca a meta.</p><ul class="subject-accuracy-chart">${bars}</ul><details class="subject-accuracy-data"><summary>Ver dados</summary><div class="subject-accuracy-data__scroll" tabindex="0" role="region" aria-label="Tabela de acerto por disciplina"><table class="weekly-history-table"><thead><tr><th scope="col">Disciplina</th><th scope="col">Meta</th><th scope="col">Questões pessoais</th><th scope="col">Simulados detalhados</th></tr></thead><tbody>${rows.map(row => `<tr><th scope="row">${escape(row.name)}</th><td>${formatDecimal(row.target)}%${row.inherited ? ' · herdada da meta geral' : ''}</td><td>${cell(row.personal)}</td><td>${cell(row.simulation)}</td></tr>`).join('')}</tbody></table></div></details></details>`;
}
