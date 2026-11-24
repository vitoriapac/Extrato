import type { ExamTodaySignals } from '../../application/analytics/build-exam-today-signals.js';

const escapeText = (value: string) =>
  String(value).replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] || c
  );
const dateBR = (iso: string) => iso.split('-').reverse().join('/');
const decimalBR = (value: number) => String(Math.round(value * 10) / 10).replace('.', ',');

function cell(opts: {
  id?: string;
  tab: string;
  tone: string;
  value: string;
  label: string;
  detail: string;
}) {
  return `<button type="button" class="overview-signal overview-signal--${opts.tone}"${opts.id ? ` id="${opts.id}"` : ''} data-signal-tab="${opts.tab}"><strong class="overview-signal__value">${escapeText(opts.value)}</strong><span class="overview-signal__label">${escapeText(opts.label)}</span><small class="overview-signal__detail">${escapeText(opts.detail)}</small></button>`;
}

/** Os três sinais de "A prova hoje": cada um leva à aba onde se age sobre ele. */
export function renderExamTodaySignals(model: ExamTodaySignals): string {
  const { score, minimum, overdue } = model;
  const targetDetail =
    score.target === null
      ? 'Sem meta de nota definida'
      : score.gap === 0
        ? `Na meta de ${score.target}%`
        : `${Math.abs(score.gap!)} p.p. ${score.gap! > 0 ? 'acima' : 'abaixo'} da meta de ${score.target}%`;
  // Com corte: abaixo dele é perigo; entre corte e meta, atenção; na meta, ok.
  const cutoffDetail =
    score.cutoffGap === null
      ? null
      : score.cutoffGap === 0
        ? `No corte de ${decimalBR(score.cutoff!)}%`
        : `${decimalBR(Math.abs(score.cutoffGap))} p.p. ${score.cutoffGap > 0 ? 'acima' : 'abaixo'} do corte de ${decimalBR(score.cutoff!)}%`;
  const scoreCell = score.available
    ? cell({
        tab: 'questoes',
        tone:
          score.cutoffGap !== null && score.cutoffGap < 0
            ? 'danger'
            : score.gap !== null && score.gap < 0
              ? 'warning'
              : 'success',
        value: `${score.central}%`,
        label: score.net ? 'Nota líquida projetada' : 'Nota projetada',
        detail: cutoffDetail
          ? `${cutoffDetail} · meta ${score.target === null ? 'não definida' : `${score.target}%`}`
          : targetDetail,
      })
    : cell({
        tab: 'questoes',
        tone: 'neutral',
        value: '—',
        label: 'Nota projetada',
        detail: 'Registre simulados comparáveis para projetar',
      });
  const minimumCell = !minimum.configured
    ? cell({
        tab: 'metas',
        tone: 'neutral',
        value: '—',
        label: 'Mínimo por disciplina',
        detail: 'Defina os mínimos eliminatórios nas Metas',
      })
    : !minimum.simulationDate
      ? cell({
          tab: 'questoes',
          tone: 'neutral',
          value: '—',
          label: 'Abaixo do mínimo',
          detail: 'Registre um simulado com as disciplinas',
        })
      : cell({
          tab: 'questoes',
          tone: minimum.names.length ? 'danger' : 'success',
          value: String(minimum.names.length),
          label:
            minimum.names.length === 1
              ? 'Disciplina abaixo do mínimo'
              : 'Disciplinas abaixo do mínimo',
          detail: minimum.names.length
            ? `${minimum.names.slice(0, 2).join(', ')}${minimum.names.length > 2 ? ` e mais ${minimum.names.length - 2}` : ''} · simulado de ${dateBR(minimum.simulationDate)}`
            : `Todas acima no simulado de ${dateBR(minimum.simulationDate)}`,
        });
  const overdueCell = cell({
    id: 'overviewAttentionViewAll',
    tab: 'hoje',
    tone: overdue ? 'warning' : 'success',
    value: String(overdue),
    label: overdue === 1 ? 'Pendência atrasada' : 'Pendências atrasadas',
    detail: overdue ? 'Revisões e tarefas · ver na aba Hoje' : 'Revisões e tarefas em dia',
  });
  return `${scoreCell}${minimumCell}${overdueCell}`;
}
