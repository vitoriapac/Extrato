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
  naoSabia: { label: 'Não sabia', icon: '📚' },
  esqueci: { label: 'Esqueci', icon: '🧠' },
  interpretacao: { label: 'Interpretação', icon: '📖' },
  calculo: { label: 'Cálculo', icon: '➗' },
  desatencao: { label: 'Desatenção', icon: '⚠️' },
  chute: { label: 'Chute', icon: '🎲' },
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
  Crítico: '🔴',
  Atenção: '🟠',
  Acompanhamento: '🟡',
  'Em dia': '🟢',
};
