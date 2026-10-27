export const PERSISTENT_COLLECTIONS = Object.freeze([
  'subjects',
  'calendar',
  'reviewAgenda',
  'questoes',
  'simulados',
  'exams',
  'examQuestions',
  'progressHistory',
  'readinessSnapshots',
  'projectionSnapshots',
  'studySessions',
  'dailyPlans',
  'studyPlans',
  'planAdjustments',
  'adaptivePlanningHistory',
  'recommendationFeedback',
  'recommendationHistory',
  'weeklyCloseSnapshots',
  'planningCapacityHistory',
  'alertStates',
  'topicHistory',
  'metasPorDisciplina',
  'errorFlashcards',
] as const);

export const PERSISTENT_OBJECTS = Object.freeze([
  'metas',
  'examBlueprint',
  'algorithmVersions',
  'activeTimer',
  'achievementsUnlocked',
] as const);

export interface OnboardingUiState {
  open: boolean;
  currentStep: string | number | null;
  presetId: string | null;
  previousFocus: HTMLElement | null;
  manualReturn?: boolean;
  dismissedForSession: boolean;
}

export interface UiState {
  activeTab: string;
  openModal: string | null;
  onboarding: OnboardingUiState;
  filters: Record<string, unknown>;
  previews: Record<string, unknown>;
  [key: string]: unknown;
}

export function createUiState(overrides: Partial<UiState> = {}): UiState {
  return {
    activeTab: 'visao-geral',
    openModal: null,
    onboarding: {
      open: false,
      currentStep: null,
      presetId: null,
      previousFocus: null,
      dismissedForSession: false,
    },
    filters: {},
    previews: {},
    ...overrides,
  };
}

export function pickPersistentState(source: Record<string, any> = {}): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key of [
    'schemaVersion',
    'executionMode',
    'examDate',
    'lastBackupAt',
    'updatedAt',
    ...PERSISTENT_COLLECTIONS,
    ...PERSISTENT_OBJECTS,
  ]) {
    if (Object.prototype.hasOwnProperty.call(source, key)) result[key] = source[key];
  }
  return result;
}
