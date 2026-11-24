/** Protocolo da reta curta: semana da prova (7 a 2 dias), véspera (1 dia) e dia da prova (0). */
export const EXAM_PROTOCOL_WINDOW_DAYS = 7;

export type ExamProtocolPhase = 'week' | 'eve' | 'day';

export interface ExamProtocolItem {
  key: string;
  label: string;
  checked: boolean;
}

export interface ExamProtocol {
  phase: ExamProtocolPhase;
  title: string;
  note: string;
  items: ExamProtocolItem[];
}

const ITEMS: Record<ExamProtocolPhase, Array<[string, string]>> = {
  week: [
    ['week-no-new', 'Nada de conteúdo novo: só revisão, questões e lei seca já lida'],
    ['week-mock', 'Um simulado completo no mesmo horário e duração da prova'],
    ['week-sleep', 'Ajustar o horário de dormir e acordar ao horário da prova'],
    ['week-place', 'Conferir o local de prova e planejar o trajeto'],
    ['week-weak', 'Revisar resumos e o caderno de erros dos tópicos mais cobrados'],
  ],
  eve: [
    ['eve-light', 'Estudo leve: no máximo 2 horas de resumos, sem questões novas'],
    ['eve-docs', 'Separar documento oficial com foto e comprovante de inscrição'],
    ['eve-pen', 'Separar caneta esferográfica preta de corpo transparente'],
    ['eve-gates', 'Conferir o horário de abertura e fechamento dos portões'],
    ['eve-food', 'Preparar água e lanche permitidos pelo edital'],
    ['eve-rest', 'Dormir cedo, sem estudar à noite'],
  ],
  day: [
    ['day-early', 'Chegar ao local pelo menos 1 hora antes do fechamento dos portões'],
    ['day-order', 'Começar pelas disciplinas em que você tem mais segurança'],
    ['day-sheet', 'Reservar os últimos 20 minutos para marcar o gabarito'],
    [
      'day-guess',
      'Seguir a regra de chute do tipo de prova; não deixar a folha em branco por pressa',
    ],
  ],
};

const TITLES: Record<ExamProtocolPhase, string> = {
  week: 'Semana da prova',
  eve: 'Véspera da prova',
  day: 'Dia da prova',
};

/**
 * Checklist da fase atual, ou null fora dos 7 dias finais. Os marcados valem só para a data de
 * prova em que foram marcados: mudar a data recomeça o protocolo.
 */
export function buildExamProtocol({
  daysToExam,
  examDate,
  checks = null,
  examMinutesPerQuestion = null,
  netScoring = false,
}: {
  daysToExam: number | null;
  examDate: string | null;
  checks?: { examDate?: string | null; keys?: string[] } | null;
  examMinutesPerQuestion?: number | null;
  netScoring?: boolean;
}): ExamProtocol | null {
  if (daysToExam == null || daysToExam < 0 || daysToExam > EXAM_PROTOCOL_WINDOW_DAYS) return null;
  const phase: ExamProtocolPhase = daysToExam === 0 ? 'day' : daysToExam === 1 ? 'eve' : 'week';
  const marked = new Set(checks && checks.examDate === examDate ? checks.keys || [] : []);
  const pace =
    examMinutesPerQuestion != null
      ? ` Ritmo da prova: ${String(examMinutesPerQuestion).replace('.', ',')} min por questão.`
      : '';
  const note =
    phase === 'week'
      ? `Faltam ${daysToExam} dias: consolide o que já sabe.${pace}`
      : phase === 'eve'
        ? 'A prova é amanhã: descanse e deixe tudo separado.'
        : `A prova é hoje.${pace}${netScoring ? ' Em Certo ou errado, cada erro anula um acerto.' : ''}`;
  return {
    phase,
    title: TITLES[phase],
    note,
    items: ITEMS[phase].map(([key, label]) => ({ key, label, checked: marked.has(key) })),
  };
}

/** Marca ou desmarca um item, descartando marcações de outra data de prova. */
export function toggleExamProtocolCheck(
  checks: { examDate?: string | null; keys?: string[] } | null | undefined,
  examDate: string,
  key: string
): { examDate: string; keys: string[] } {
  const keys = new Set(checks?.examDate === examDate ? checks.keys || [] : []);
  if (keys.has(key)) keys.delete(key);
  else keys.add(key);
  return { examDate, keys: [...keys] };
}
