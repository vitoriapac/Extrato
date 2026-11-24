import type { JSX } from 'preact';
import { Badge, type BadgeVariant } from '../../primitives/badge.js';
import { formatDecimal, formatPercent, formatPoints } from '../../../core/format-number.js';
import {
  EXAM_FIT_MIN_QUESTIONS,
  type AccuracySample,
  type ExamFitAnalysis,
} from '../../../application/questions/build-exam-fit-analysis.js';
import { MIN_TARGET_BANCA_TOPIC_QUESTIONS } from '../../../domain/analytics/topic-performance.js';

const CONFIG_LINK = <a href="#planejamento/prova">Planejamento › Prova e metas</a>;

const PACE_BADGE: Record<string, { variant: BadgeVariant; label: string }> = {
  ok: { variant: 'success', label: 'Cabe no tempo' },
  tight: { variant: 'warning', label: 'Apertado' },
  slow: { variant: 'danger', label: 'Acima do tempo' },
};

const pct = (s: AccuracySample) => (s.accuracy === null ? '—' : formatPercent(s.accuracy));
const minutes = (value: number | null) =>
  value === null ? '—' : `${formatDecimal(value)} min/questão`;

function BancaSection({ banca }: { banca: ExamFitAnalysis['banca'] }) {
  if (!banca.target) {
    return <p class="context-note m-0">Informe a banca da prova em {CONFIG_LINK} para comparar.</p>;
  }
  return (
    <>
      {banca.delta === null ? (
        <p class="m-0">
          Faltam questões para comparar: {banca.onBanca.resolved} da {banca.target} e{' '}
          {banca.others.resolved} das demais; são precisas {EXAM_FIT_MIN_QUESTIONS} de cada.
        </p>
      ) : (
        <p class="m-0">
          Na {banca.target}: <strong>{pct(banca.onBanca)}</strong> · Demais questões:{' '}
          <strong>{pct(banca.others)}</strong> · Diferença:{' '}
          <strong>{formatPoints(banca.delta)}</strong>
        </p>
      )}
      {banca.coverage < 100 && (
        <p class="text-xs text-content-secondary m-0 mt-1">
          {banca.coverage}% das questões do período têm banca informada.
        </p>
      )}
      {banca.subjects.length > 0 && (
        <div class="log-table-wrap mt-2">
          <table class="log">
            <caption class="sr-only">Acerto por disciplina na banca da prova e nas demais</caption>
            <thead>
              <tr>
                <th scope="col">Disciplina</th>
                <th scope="col" class="number-cell">
                  {banca.target}
                </th>
                <th scope="col" class="number-cell">
                  Demais
                </th>
                <th scope="col" class="number-cell">
                  Diferença
                </th>
              </tr>
            </thead>
            <tbody>
              {banca.subjects.map(row => (
                <tr key={row.subjectId}>
                  <td>{row.name}</td>
                  <td class="number-cell">
                    {pct(row.onBanca)} <small>({row.onBanca.resolved})</small>
                  </td>
                  <td class="number-cell">
                    {pct(row.others)} <small>({row.others.resolved})</small>
                  </td>
                  <td class="number-cell">
                    {row.delta === null ? (
                      <Badge variant="insufficient">
                        {row.others.resolved ? 'Poucas questões' : 'Sem comparação'}
                      </Badge>
                    ) : (
                      formatPoints(row.delta)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function PaceSection({ pace }: { pace: ExamFitAnalysis['pace'] }) {
  if (pace.status === 'missing-exam') {
    return (
      <p class="context-note m-0">
        Informe a duração da prova e as questões por disciplina em {CONFIG_LINK}.
      </p>
    );
  }
  if (pace.status === 'insufficient') {
    return (
      <p class="m-0">
        A prova permite {minutes(pace.examMinutesPerQuestion)}. Registre o tempo de pelo menos{' '}
        {EXAM_FIT_MIN_QUESTIONS} questões inéditas para medir o seu ritmo ({pace.sampleQuestions}{' '}
        até agora).
      </p>
    );
  }
  const badge = PACE_BADGE[pace.status];
  return (
    <p class="m-0 flex flex-wrap items-center gap-2">
      <span>
        Seu ritmo: <strong>{minutes(pace.measuredMinutesPerQuestion)}</strong> · A prova permite:{' '}
        <strong>{minutes(pace.examMinutesPerQuestion)}</strong>
      </span>
      <Badge variant={badge.variant}>{badge.label}</Badge>
    </p>
  );
}

function RetrySection({ retry }: { retry: ExamFitAnalysis['retry'] }) {
  if (!retry.retried.resolved) {
    return <p class="m-0">Nenhuma questão marcada como refeita no período.</p>;
  }
  return (
    <>
      <p class="m-0">
        Inéditas: <strong>{pct(retry.fresh)}</strong> <small>({retry.fresh.resolved})</small> ·
        Refeitas: <strong>{pct(retry.retried)}</strong> <small>({retry.retried.resolved})</small>
      </p>
      {retry.gap === null ? (
        <p class="text-xs text-content-secondary m-0 mt-1">
          Poucas questões para comparar; são precisas {EXAM_FIT_MIN_QUESTIONS} de cada tipo.
        </p>
      ) : retry.gap >= 10 ? (
        <p class="text-xs text-content-secondary m-0 mt-1">
          As refeitas elevam a média em relação às inéditas; use as inéditas como referência de
          domínio.
        </p>
      ) : null}
    </>
  );
}

export function ExamFitCard({ model }: { model: ExamFitAnalysis }): JSX.Element {
  return (
    <div class="space-y-4">
      <p class="text-xs text-content-secondary m-0">
        Últimos {model.windowDays} dias. Ritmo e comparações são só leitura.
      </p>
      <details class="text-xs text-content-secondary">
        <summary>Como banca e refeitas entram no Domínio</summary>
        <p class="m-0 mt-1">
          No acerto que forma o Domínio de cada tópico, questões refeitas contam meio peso. Com ao
          menos {MIN_TARGET_BANCA_TOPIC_QUESTIONS} questões da banca da prova no tópico, elas contam
          em dobro. O Domínio alimenta prioridades e prontidão; retratos já salvos não são
          recalculados.
        </p>
      </details>
      {model.totalResolved === 0 ? (
        <p class="m-0">Nenhuma questão registrada no período.</p>
      ) : (
        <>
          <section aria-labelledby="examFitBancaTitle">
            <h3 id="examFitBancaTitle" class="mt-0">
              Banca da prova
            </h3>
            <BancaSection banca={model.banca} />
          </section>
          <section aria-labelledby="examFitPaceTitle">
            <h3 id="examFitPaceTitle">Ritmo de resolução</h3>
            <PaceSection pace={model.pace} />
          </section>
          <section aria-labelledby="examFitRetryTitle">
            <h3 id="examFitRetryTitle">Inéditas e refeitas</h3>
            <RetrySection retry={model.retry} />
          </section>
        </>
      )}
    </div>
  );
}
