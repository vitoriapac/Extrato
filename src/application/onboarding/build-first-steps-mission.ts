export interface MissionItem {
  id: 'plan' | 'session' | 'questions';
  label: string;
  description: string;
  done: boolean;
  ctaLabel: string;
  ctaAction: string;
}

export interface FirstStepsMissionModel {
  visible: boolean;
  canRestore: boolean;
  completedCount: number;
  totalCount: number;
  progressPercent: number;
  missions: readonly MissionItem[];
  activeMission: MissionItem | null;
}

export function buildFirstStepsMission({
  hasPlan = false,
  sessionsCount = 0,
  questionsCount = 0,
  dismissed = false,
}: {
  hasPlan?: boolean;
  sessionsCount?: number;
  questionsCount?: number;
  dismissed?: boolean;
} = {}): FirstStepsMissionModel {
  const hasSession = sessionsCount > 0;
  const hasQuestions = questionsCount > 0;
  const allComplete = hasPlan && hasSession && hasQuestions;

  const missions: readonly MissionItem[] = Object.freeze([
    {
      id: 'plan',
      label: 'Criar seu primeiro plano semanal',
      description: 'Defina objetivo, disponibilidade e matérias no assistente.',
      done: hasPlan,
      ctaLabel: 'Configurar plano',
      ctaAction: 'open-onboarding',
    },
    {
      id: 'session',
      label: 'Concluir a 1ª sessão no cronômetro',
      description: 'Inicie sua primeira atividade guiada e credite os minutos no plano.',
      done: hasSession,
      ctaLabel: 'Iniciar 1ª atividade',
      ctaAction: 'start-first-session',
    },
    {
      id: 'questions',
      label: 'Registrar ou importar sua 1ª bateria de questões',
      description: 'Lançamento manual ou importação de relatório CSV do QConcursos/Tec.',
      done: hasQuestions,
      ctaLabel: 'Registrar questões',
      ctaAction: 'open-questions',
    },
  ]);

  const completedCount = missions.filter(m => m.done).length;
  const activeMission = missions.find(m => !m.done) || null;

  return Object.freeze({
    visible: hasPlan && !allComplete && !dismissed,
    canRestore: hasPlan && !allComplete && dismissed,
    completedCount,
    totalCount: missions.length,
    progressPercent: Math.round((completedCount / missions.length) * 100),
    missions,
    activeMission,
  });
}
