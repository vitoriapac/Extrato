import { addLocalDays } from '../../core/date-utils.js';
import { buildSubjectAccuracy } from './build-subject-accuracy.js';

export interface SyllabusHealthSubject {
  id: string;
  name: string;
  concludedPct: number;
  inProgressPct: number;
  accuracy: number | null;
  /** De onde vem o acerto: questões pessoais (30 dias) ou, sem questões, simulados. */
  accuracySource: 'questions' | 'simulations' | null;
  target: number;
  gap: number | null;
  /** Questões esperadas × peso × distância até a meta: pontos que a disciplina deixa na mesa. */
  pointsAtStake: number | null;
  status: 'ok' | 'attention' | 'insufficient';
}

export interface SyllabusHealthViewModel {
  subjects: SyllabusHealthSubject[];
}

/** `today` fixa a janela padrão do app (30 dias, como Desempenho); sem ele usa todo o histórico. */
export function buildSyllabusHealthViewModel(state: any, today?: string): SyllabusHealthViewModel {
  if (!state || !Array.isArray(state.subjects) || state.subjects.length === 0) {
    return { subjects: [] };
  }

  const activeSubjects = state.subjects.filter((s: any) => !s.archived);
  if (activeSubjects.length === 0) {
    return { subjects: [] };
  }

  const windowStart = today ? addLocalDays(today, -29) : null;
  const questions = (state.questoes || []).filter(
    (q: { date?: string }) =>
      !today || (Boolean(q.date) && q.date! <= today && q.date! >= (windowStart as string))
  );
  const accuracyData = buildSubjectAccuracy({
    subjects: activeSubjects,
    questions,
    simulations: state.simulados || [],
    blueprint: state.examBlueprint || {},
    globalTarget: state.metas?.metaAprovacao ?? 80,
  });

  const accuracyMap = new Map<string, any>();
  accuracyData.forEach((item: any) => {
    accuracyMap.set(item.subjectId, item);
  });

  // Mesmo peso dos alertas: questões esperadas × peso da questão, do blueprint.
  const examWeight = new Map<string, number>(
    (state.examBlueprint?.subjects || [])
      .filter((row: { subjectId?: string }) => row.subjectId)
      .map((row: { subjectId: string; expectedQuestions?: number; questionWeight?: number }) => [
        row.subjectId,
        (Number(row.expectedQuestions) || 0) * (Number(row.questionWeight) || 1),
      ])
  );

  const subjects: SyllabusHealthSubject[] = activeSubjects.map((s: any) => {
    const topics = Array.isArray(s.topics) ? s.topics : [];
    const totalTopics = topics.length;
    const concludedCount = topics.filter((t: any) => t.status === 'Concluído').length;
    const inProgressCount = topics.filter((t: any) => t.status === 'Em andamento').length;

    const concludedPct = totalTopics > 0 ? Math.round((concludedCount / totalTopics) * 100) : 0;
    const inProgressPct = totalTopics > 0 ? Math.round((inProgressCount / totalTopics) * 100) : 0;

    const acc = accuracyMap.get(s.id);
    const sample = acc?.personal?.accuracy != null ? acc.personal : acc?.simulation;
    const accuracy =
      acc && acc.personal?.accuracy != null
        ? acc.personal.accuracy
        : acc && acc.simulation?.accuracy != null
          ? acc.simulation.accuracy
          : null;
    const accuracySource =
      accuracy == null ? null : acc?.personal?.accuracy != null ? 'questions' : 'simulations';
    const target = acc ? acc.target : (state.metas?.metaAprovacao ?? 80);
    const gap = accuracy != null ? Math.round((accuracy - target) * 10) / 10 : null;
    const weight = examWeight.get(s.id) || 0;
    const pointsAtStake =
      gap != null && weight > 0 ? Math.round(Math.max(0, -gap) * weight) / 100 : null;

    // Mesmo critério do Desempenho: abaixo da meta só com amostra mínima (build-subject-accuracy).
    // Só questões contam, como em Desempenho; acerto vindo de simulados não entra na contagem.
    const status: 'ok' | 'attention' | 'insufficient' =
      accuracySource !== 'questions'
        ? 'insufficient'
        : sample?.state === 'below_target'
          ? 'attention'
          : sample?.state === 'on_target'
            ? 'ok'
            : 'insufficient';

    return {
      id: s.id,
      name: s.name,
      concludedPct,
      inProgressPct,
      accuracy,
      accuracySource,
      target,
      gap,
      pointsAtStake,
      status,
    };
  });

  // Atenção primeiro, de mais pontos em jogo para menos (sem peso no edital, pela distância da
  // meta); depois por conclusão.
  subjects.sort((a, b) => {
    if (a.status === 'attention' && b.status !== 'attention') return -1;
    if (b.status === 'attention' && a.status !== 'attention') return 1;
    if (a.status === 'attention' && b.status === 'attention')
      return (b.pointsAtStake ?? -1) - (a.pointsAtStake ?? -1) || (a.gap ?? 0) - (b.gap ?? 0);
    return b.concludedPct - a.concludedPct;
  });

  return { subjects };
}
