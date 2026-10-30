import { formatDecimal } from '../../core/format-number.js';
import { formatDateBR, formatPeriodBR } from '../../core/format-date.js';

type Row = Record<string, any>;

// The figures the retrato freezes, in the order the extrato da semana shows them.
export function weeklyCloseFigures(
  close: Row | null | undefined,
  formatMinutes: (minutes: number) => string
): Array<[string, string]> {
  const summary = close?.adherence?.model?.summary,
    planned = summary?.plannedMinutes ?? close?.investment?.plannedMinutes,
    executed = summary?.executedMinutes ?? close?.investment?.executedMinutes ?? 0,
    credit = summary ? summary.temporalAdherence : close?.investment?.adherence,
    questions = close?.questions || {};
  return [
    ['Planejado', planned == null ? '—' : formatMinutes(planned)],
    ['Realizado', formatMinutes(executed)],
    [
      summary ? 'Crédito ao plano' : 'Volume de carga',
      credit == null ? '—' : `${formatDecimal(credit)}%`,
    ],
    [
      'Questões',
      `${questions.resolved ?? 0}${questions.accuracy == null ? '' : ` · ${formatDecimal(questions.accuracy)}% de acerto`}`,
    ],
    ['Prioridades sugeridas', String((close?.priorities || []).length)],
  ];
}

export interface WeeklyCloseRecordView {
  close: Row | null;
  candidate: Row | null;
  plan: { previous: Row | null; unchanged: boolean; revision: number } | null;
  previewOpen: boolean;
  savedNow: boolean;
  formatMinutes: (minutes: number) => string;
  escapeHtml: (value: unknown) => string;
}

const section = (body: string) =>
  `<section class="weekly-close-act weekly-close-record" aria-labelledby="weeklyRecordTitle"><h4 class="weekly-close-act__title" id="weeklyRecordTitle">O retrato</h4>${body}</section>`;

export function renderWeeklyCloseRecord({
  close,
  candidate,
  plan,
  previewOpen,
  savedNow,
  formatMinutes,
  escapeHtml,
}: WeeklyCloseRecordView): string {
  if (!close || close.state === 'insufficient' || !candidate || !plan) {
    return section(
      `<div class="empty-state empty-state--compact" role="status"><strong>O retrato desta semana ainda não pode ser salvo</strong><p>Falta ao menos um registro no período: minutos planejados, uma sessão estudada ou questões resolvidas.</p><div class="weekly-record-actions"><button class="btn ghost small" type="button" data-delegated-click="navigateKpi('hoje')">Estudar hoje</button><button class="btn ghost small" type="button" data-delegated-click="navigateKpi('questoes')">Registrar questões</button></div></div>`
    );
  }

  const period = formatPeriodBR(candidate.period?.start, candidate.period?.end);
  const previous = plan.previous;
  if (plan.unchanged && previous) {
    const when = formatDateBR(previous.savedAt);
    const revision = Number(previous.revision) || 1;
    const message = savedNow
      ? `Retrato salvo · revisão ${revision} de ${escapeHtml(period)}.`
      : `Retrato salvo em ${escapeHtml(when)} · revisão ${revision}. Nada mudou desde então.`;
    return section(
      `<p class="weekly-record-status" id="weeklyRecordStatus" role="status" tabindex="-1">${message}</p><p class="analytics-note">Os retratos ficam em Histórico e não são recalculados.</p>`
    );
  }

  const figures = weeklyCloseFigures(candidate.weeklyClose, formatMinutes);
  if (!previewOpen) {
    const revisionNote = previous
      ? ` Já existe a revisão ${Number(previous.revision) || 1}; salvar cria a revisão ${plan.revision} e mantém a anterior.`
      : '';
    return section(
      `<p>Período ${escapeHtml(period)}. A revisão mostra exatamente o que será guardado; nada é salvo antes de você confirmar.${revisionNote}</p><button class="btn small" type="button" data-delegated-click="openWeeklyCloseRecord()">Revisar o retrato da semana</button>`
    );
  }

  const scope = candidate.activeExamTags?.length
    ? candidate.activeExamTags.join(', ')
    : 'Todas as provas';
  const rows: Array<[string, string]> = [
    ['Período', period],
    ['Prova', scope],
    ['Fase', candidate.examPhase?.label || 'Prova sem data'],
    ...figures,
  ];
  const list = rows
    .map(
      ([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`
    )
    .join('');

  let changes = '';
  if (previous) {
    const before = new Map(weeklyCloseFigures(previous.weeklyClose, formatMinutes));
    const changed = figures.filter(
      ([label, value]) => before.has(label) && before.get(label) !== value
    );
    changes = `<div class="weekly-record-changes"><strong>Em relação à revisão ${Number(previous.revision) || 1}</strong>${
      changed.length
        ? `<ul>${changed
            .map(
              ([label, value]) =>
                `<li>${escapeHtml(label)}: ${escapeHtml(before.get(label))} → ${escapeHtml(value)}</li>`
            )
            .join('')}</ul>`
        : '<p>Os números acima são os mesmos; mudaram detalhes da análise, como lacunas ou prioridades.</p>'
    }<p>A revisão anterior continua guardada no Histórico.</p></div>`;
  }

  return section(
    `<div class="weekly-record-preview" id="weeklyRecordPreview" tabindex="-1" aria-labelledby="weeklyRecordPreviewTitle"><strong id="weeklyRecordPreviewTitle">Será registrado assim${previous ? ` · revisão ${plan.revision}` : ''}</strong><dl>${list}</dl>${changes}<div class="weekly-record-actions"><button class="btn small" type="button" data-delegated-click="saveWeeklyCloseSnapshot()">Salvar fechamento desta semana</button><button class="btn ghost small" type="button" data-delegated-click="closeWeeklyCloseRecord()">Voltar</button></div></div>`
  );
}
