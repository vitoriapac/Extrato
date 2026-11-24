import type { ExamBlueprint, QuestionRecord, Subject } from '../../core/types.ts';
import { examMinutesPerQuestion as examPaceOf } from '../../domain/exams/simulation-score.ts';

export const EXAM_FIT_WINDOW_DAYS = 90;
/** Questões mínimas para comparar acertos (geral, por disciplina e refeitas). */
export const EXAM_FIT_MIN_QUESTIONS = 20;

export interface AccuracySample {
  resolved: number;
  correct: number;
  /** Null quando não há questões. */
  accuracy: number | null;
}

export interface BancaSubjectRow {
  subjectId: string;
  name: string;
  /** Questões da disciplina de outras bancas ou sem banca informada. */
  others: AccuracySample;
  onBanca: AccuracySample;
  /** Pontos percentuais (banca − demais); null com evidência insuficiente. */
  delta: number | null;
}

export interface ExamFitAnalysis {
  windowDays: number;
  totalResolved: number;
  banca: {
    target: string | null;
    /** % das questões da janela com banca informada. */
    coverage: number;
    others: AccuracySample;
    onBanca: AccuracySample;
    delta: number | null;
    subjects: BancaSubjectRow[];
  };
  pace: {
    /** Minutos por questão que a prova permite; null sem duração ou sem total de questões. */
    examMinutesPerQuestion: number | null;
    /** Minutos por questão medidos nas inéditas com tempo informado. */
    measuredMinutesPerQuestion: number | null;
    sampleQuestions: number;
    status: 'missing-exam' | 'insufficient' | 'ok' | 'tight' | 'slow';
  };
  retry: {
    fresh: AccuracySample;
    retried: AccuracySample;
    /** Pontos percentuais (refeitas − inéditas); null com evidência insuficiente. */
    gap: number | null;
  };
}

const round1 = (value: number) => Math.round(value * 10) / 10;

function sample(records: QuestionRecord[]): AccuracySample {
  let resolved = 0;
  let correct = 0;
  for (const record of records) {
    const r = Math.max(0, Number(record.resolved) || 0);
    resolved += r;
    correct += Math.min(r, Math.max(0, Number(record.correct) || 0));
  }
  return { resolved, correct, accuracy: resolved ? round1((correct / resolved) * 100) : null };
}

function delta(a: AccuracySample, b: AccuracySample): number | null {
  return a.resolved >= EXAM_FIT_MIN_QUESTIONS &&
    b.resolved >= EXAM_FIT_MIN_QUESTIONS &&
    a.accuracy !== null &&
    b.accuracy !== null
    ? round1(a.accuracy - b.accuracy)
    : null;
}

/**
 * Banca, ritmo e refeitas das questões dos últimos 90 dias. Só leitura: não altera prioridade,
 * domínio ou prontidão.
 * @param fromDate primeiro dia da janela (AAAA-MM-DD), calculado por quem chama.
 */
export function buildExamFitAnalysis({
  questions = [],
  subjects = [],
  blueprint = null,
  fromDate,
}: {
  questions?: QuestionRecord[];
  subjects?: Subject[];
  blueprint?: Pick<ExamBlueprint, 'banca' | 'durationMinutes' | 'subjects'> | null;
  fromDate: string;
}): ExamFitAnalysis {
  const recent = questions.filter(q => q.date >= fromDate && (Number(q.resolved) || 0) > 0);
  const totalResolved = sample(recent).resolved;
  const target = blueprint?.banca || null;
  const isTarget = (q: QuestionRecord) => Boolean(target) && q.banca === target;

  const withBanca = sample(recent.filter(q => q.banca)).resolved;
  const others = sample(recent.filter(q => !isTarget(q)));
  const onBanca = sample(recent.filter(isTarget));

  const subjectRows: BancaSubjectRow[] = target
    ? subjects
        .filter(subject => !subject.archived)
        .map(subject => {
          const own = recent.filter(q => q.subjectId === subject.id);
          const rowOthers = sample(own.filter(q => !isTarget(q)));
          const rowBanca = sample(own.filter(isTarget));
          return {
            subjectId: subject.id,
            name: subject.name,
            others: rowOthers,
            onBanca: rowBanca,
            delta: delta(rowBanca, rowOthers),
          };
        })
        .filter(row => row.onBanca.resolved > 0)
        // Maior perda na banca primeiro: é onde o estilo dela custa pontos.
        .sort((a, b) => (a.delta ?? Infinity) - (b.delta ?? Infinity))
    : [];

  const examMinutesPerQuestion = examPaceOf(blueprint);
  // Refeitas saem do ritmo: já conhecidas, são resolvidas mais rápido do que na prova.
  const timed = recent.filter(q => !q.retry && Number(q.minutes) > 0);
  const timedQuestions = sample(timed).resolved;
  const timedMinutes = timed.reduce((sum, q) => sum + Number(q.minutes), 0);
  const measured = timedQuestions ? round1(timedMinutes / timedQuestions) : null;
  const status: ExamFitAnalysis['pace']['status'] =
    examMinutesPerQuestion === null
      ? 'missing-exam'
      : timedQuestions < EXAM_FIT_MIN_QUESTIONS || measured === null
        ? 'insufficient'
        : measured > examMinutesPerQuestion
          ? 'slow'
          : measured > examMinutesPerQuestion * 0.85
            ? 'tight'
            : 'ok';

  const fresh = sample(recent.filter(q => !q.retry));
  const retried = sample(recent.filter(q => q.retry));

  return {
    windowDays: EXAM_FIT_WINDOW_DAYS,
    totalResolved,
    banca: {
      target,
      coverage: totalResolved ? Math.round((withBanca / totalResolved) * 100) : 0,
      others,
      onBanca,
      delta: delta(onBanca, others),
      subjects: subjectRows,
    },
    pace: {
      examMinutesPerQuestion,
      measuredMinutesPerQuestion: measured,
      sampleQuestions: timedQuestions,
      status,
    },
    retry: { fresh, retried, gap: delta(retried, fresh) },
  };
}
