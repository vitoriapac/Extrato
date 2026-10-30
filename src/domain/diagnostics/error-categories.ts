export interface ErrorCategoryMeta {
  label: string;
  icon: string;
}

export interface ErrorRecommendationPrescription {
  action: string;
  studyType: 'study' | 'review' | 'questions' | 'simulation';
  estimatedMinutes: number;
  questions: number;
}

export const ERROR_CATEGORIES: Record<string, ErrorCategoryMeta> = {
  naoSabia: { label: 'Não sabia', icon: 'book' },
  esqueci: { label: 'Esqueci', icon: 'brain' },
  interpretacao: { label: 'Interpretação', icon: 'file-text' },
  calculo: { label: 'Cálculo', icon: 'calculator' },
  desatencao: { label: 'Desatenção', icon: 'alert-triangle' },
  chute: { label: 'Chute', icon: 'dice' },
};

export const MIN_TOPIC_TREND_WINDOW_QUESTIONS = 20;
export const MIN_ERROR_RECOMMENDATION_COUNT = 10;
export const MIN_ERROR_RECOMMENDATION_COVERAGE = 60;

export const ERROR_RECOMMENDATIONS: Record<string, ErrorRecommendationPrescription> = {
  naoSabia: {
    action: 'Revisar a teoria e os conceitos-base',
    studyType: 'study',
    estimatedMinutes: 35,
    questions: 10,
  },
  esqueci: {
    action: 'Fazer uma revisão curta e recuperar de memória',
    studyType: 'review',
    estimatedMinutes: 25,
    questions: 15,
  },
  interpretacao: {
    action: 'Resolver questões comentadas de interpretação',
    studyType: 'questions',
    estimatedMinutes: 40,
    questions: 15,
  },
  calculo: {
    action: 'Treinar exercícios de cálculo passo a passo',
    studyType: 'questions',
    estimatedMinutes: 45,
    questions: 15,
  },
  desatencao: {
    action: 'Resolver questões com conferência obrigatória',
    studyType: 'questions',
    estimatedMinutes: 35,
    questions: 20,
  },
  chute: {
    action: 'Reforçar conceitos antes de voltar às questões',
    studyType: 'study',
    estimatedMinutes: 30,
    questions: 10,
  },
};

export const DIAGNOSIS_STATUS_ICON: Record<string, string> = {
  Crítico: 'alert-circle',
  Atenção: 'alert-triangle',
  Acompanhamento: 'clock',
  'Em dia': 'circle-check',
};

export function emptyErrorBreakdown(
  categories: Record<string, unknown> = ERROR_CATEGORIES
): Record<string, number> {
  return Object.fromEntries(Object.keys(categories).map(key => [key, 0]));
}

export function normalizeErrorBreakdown(
  question: Record<string, any>,
  categories: Record<string, unknown> = ERROR_CATEGORIES
): Record<string, number> {
  const normalized = emptyErrorBreakdown(categories);
  Object.keys(normalized).forEach(key => {
    normalized[key] = Math.max(0, Math.floor(Number(question?.errorBreakdown?.[key]) || 0));
  });
  const realErrors = Math.max(
    0,
    (Number(question?.resolved) || 0) - (Number(question?.correct) || 0)
  );
  let excess = Object.values(normalized).reduce((sum, value) => sum + value, 0) - realErrors;
  [...Object.keys(normalized)].reverse().forEach(key => {
    if (excess <= 0) return;
    const cut = Math.min(normalized[key], excess);
    normalized[key] -= cut;
    excess -= cut;
  });
  if (question && typeof question === 'object') {
    question.errorBreakdown = normalized;
  }
  return normalized;
}
