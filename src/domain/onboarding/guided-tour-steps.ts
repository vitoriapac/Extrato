export interface GuidedTourStep {
  id: string;
  order: number;
  tab: 'dashboard' | 'hoje' | 'questoes' | 'desempenho' | 'metas';
  selector: string;
  title: string;
  message: string;
  badgeLabel?: string;
}

export interface GuidedTourState {
  active: boolean;
  currentIndex: number;
  steps: readonly GuidedTourStep[];
  currentStep: GuidedTourStep | null;
  totalSteps: number;
  isFirst: boolean;
  isLast: boolean;
}

export const GUIDED_TOUR_STEPS: readonly GuidedTourStep[] = Object.freeze([
  {
    id: 'overview-action',
    order: 1,
    tab: 'dashboard',
    selector: '#overviewNextAction',
    title: 'Sua única prioridade de agora',
    message:
      'O StudyTrack cruza peso do edital, lacunas e revisões para destacar uma única próxima ação. Sem paralisia por excesso de escolha.',
    badgeLabel: '1 de 5 · Visão Geral',
  },
  {
    id: 'today-execution',
    order: 2,
    tab: 'hoje',
    selector: '.plano-hoje-card',
    title: 'Execução guiada e cronômetro',
    message:
      'Ao iniciar uma atividade, o cronômetro divide a sessão em etapas e credita os minutos diretamente no plano do dia.',
    badgeLabel: '2 de 5 · Hoje',
  },
  {
    id: 'questions-hub',
    order: 3,
    tab: 'questoes',
    selector: '#panel-questoes .section-head',
    title: 'Questões e Importador CSV',
    message:
      'Registre baterias manualmente ou importe relatórios CSV do QConcursos e Tec Concursos classificando o motivo cognitivo dos erros.',
    badgeLabel: '3 de 5 · Questões',
  },
  {
    id: 'exam-intelligence',
    order: 4,
    tab: 'desempenho',
    selector: '#performancePage, #panel-desempenho',
    title: 'Inteligência da Prova × Você',
    message:
      'Veja sua evolução de Prontidão, compare períodos e descubra onde você ganha mais pontos por hora investida.',
    badgeLabel: '4 de 5 · Desempenho',
  },
  {
    id: 'weekly-planning',
    order: 5,
    tab: 'metas',
    selector: '#metasPlanning',
    title: 'Planejamento vivo e Fechamento',
    message:
      'Redistribua atrasos sem estourar sua capacidade diária. Imprevistos acontecem: o motor reorganiza seus estudos sem plano quebrado.',
    badgeLabel: '5 de 5 · Planejamento',
  },
]);

export const ESSENTIAL_TOUR_STEPS: readonly GuidedTourStep[] = Object.freeze([
  {
    id: 'today-execution',
    order: 1,
    tab: 'hoje',
    selector: '.plano-hoje-card',
    title: 'Seu QG diário de estudo',
    message:
      'Aqui ficam suas matérias planejadas para hoje e o cronômetro integrado. Basta seguir a lista sem perder tempo decidindo o que fazer.',
    badgeLabel: '1 de 3 · Hoje',
  },
  {
    id: 'overview-action',
    order: 2,
    tab: 'dashboard',
    selector: '#overviewNextAction',
    title: 'Sua bússola estratégica',
    message:
      'Em qualquer momento de dúvida, o algoritmo cruza peso do edital, lacunas e revisões para apontar uma única recomendação clara.',
    badgeLabel: '2 de 3 · Visão Geral',
  },
  {
    id: 'questions-hub',
    order: 3,
    tab: 'questoes',
    selector: '#panel-questoes .section-head',
    title: 'Onde o diagnóstico acontece',
    message:
      'Registre suas baterias ou importe relatórios do QConcursos/Tec Concursos. É aqui que o StudyTrack aprende onde você erra para calibrar suas revisões.',
    badgeLabel: '3 de 3 · Questões',
  },
]);

export function createGuidedTourState(
  initialIndex = 0,
  steps: readonly GuidedTourStep[] = GUIDED_TOUR_STEPS
): GuidedTourState {
  const total = steps.length;
  if (!total) {
    return Object.freeze({
      active: false,
      currentIndex: -1,
      steps: Object.freeze([]),
      currentStep: null,
      totalSteps: 0,
      isFirst: true,
      isLast: true,
    });
  }

  const boundedIndex = Math.max(0, Math.min(initialIndex, total - 1));
  const currentStep = steps[boundedIndex] || null;

  return Object.freeze({
    active: true,
    currentIndex: boundedIndex,
    steps,
    currentStep,
    totalSteps: total,
    isFirst: boundedIndex === 0,
    isLast: boundedIndex === total - 1,
  });
}

export function nextTourStep(state: GuidedTourState): GuidedTourState {
  if (!state.active || state.currentIndex >= state.totalSteps - 1) {
    return Object.freeze({
      ...state,
      active: false,
    });
  }
  return createGuidedTourState(state.currentIndex + 1, state.steps);
}

export function prevTourStep(state: GuidedTourState): GuidedTourState {
  if (!state.active || state.currentIndex <= 0) {
    return state;
  }
  return createGuidedTourState(state.currentIndex - 1, state.steps);
}

export function closeTour(state: GuidedTourState): GuidedTourState {
  return Object.freeze({
    ...state,
    active: false,
  });
}
