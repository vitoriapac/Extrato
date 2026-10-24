/**
 * @fileoverview Definições de tipos centrais do StudyTrack para TypeScript e JSDoc.
 */

export type TopicStatus = 'Não iniciado' | 'Em andamento' | 'Revisão' | 'Concluído';

export type TopicDifficulty = 'Fácil' | 'Médio' | 'Difícil';

export type BookmarkResourceType = 'pdf' | 'video' | 'law' | 'other';

export interface TopicBookmark {
  readonly resourceType: BookmarkResourceType;
  readonly label: string;
  readonly currentUnit: number | null;
  readonly totalUnits: number | null;
  readonly positionText: string;
  readonly updatedAt: string;
}

export interface Topic {
  id: string;
  name: string;
  link?: string;
  status: TopicStatus;
  archived?: boolean;
  archivedAt?: string | null;
  notes?: string;
  tags?: string[];
  difficulty?: TopicDifficulty;
  createdAt?: string;
  firstCompletedAt?: string | null;
  lastCompletedAt?: string | null;
  completionCount?: number;
  lastReviewedAt?: string | null;
  reviewCount?: number;
  examImportance?: number | null;
  estimatedStudyMinutes?: number | null;
  prerequisites?: string[];
  fieldOrigins?: Record<string, string>;
  bookmark?: TopicBookmark | null;
}

export interface Subject {
  id: string;
  name: string;
  collapsed: boolean;
  archived: boolean;
  archivedAt: string | null;
  createdAt: string;
  topics: Topic[];
}

export interface QuestionRecord {
  id: string;
  date: string;
  subjectId: string;
  topicId: string | null;
  resolved: number;
  correct: number;
  errorBreakdown?: Record<string, number>;
  errorCategory?: string | null;
  recommendationId?: string | null;
  createdAt?: string;
}

export interface SimulationBreakdownItem {
  id: string;
  subjectId: string;
  correct: number;
  total: number;
}

export interface SimulationRecord {
  id: string;
  nome: string;
  date: string;
  correct: number;
  total: number;
  breakdown?: SimulationBreakdownItem[];
  createdAt?: string;
}

export type StudyActivityType = 'study' | 'review' | 'questions' | 'simulation';

export interface StudySession {
  id: string;
  date: string;
  subjectId: string;
  topicId: string | null;
  durationSeconds: number;
  type?: StudyActivityType;
  source?: string;
  planItemId?: string | null;
  recommendationId?: string | null;
  createdAt?: string;
}

export interface ReadinessSnapshot {
  date: string;
  score: number;
  confidence: number;
  factors: Record<string, number>;
  algorithmVersion: string;
}

export interface Clock {
  readonly now: () => Date;
  readonly nowISO: () => string;
  readonly today: () => string;
  readonly timestamp: () => number;
}

export type ExamPriority = 'low' | 'normal' | 'high';

export interface ExamBlueprintSubject {
  subjectId: string | null;
  expectedQuestions: number;
  questionWeight: number;
  priority: ExamPriority;
  masteryTarget: number | null;
  accuracyTarget?: number;
  sourceRef?: string;
  official?: boolean;
  mappingType?: string;
}

export interface ExamBlueprint {
  examDate: string | null;
  targetScore: number;
  masteryTarget: number;
  activeExamTags: string[];
  configuredAt: string | null;
  subjects: ExamBlueprintSubject[];
}

export interface ActiveTimerState {
  startedAt: string | null;
  runStartedAt: string | null;
  accumulatedSeconds: number;
  isRunning: boolean;
  subjectId: string | null;
  topicId: string | null;
  type: StudyActivityType | string;
  hiddenAt: string | null;
  planItemId: string | null;
  targetMinutes: number | null;
  strategy: string | null;
  strategyStep: number;
  recommendationId: string | null;
  recommendationSource: string | null;
  recommendationType: string | null;
  prioritySnapshot: unknown;
}

export interface AppState {
  schemaVersion: number;
  subjects: Subject[];
  calendar: unknown[];
  reviewAgenda: unknown[];
  questoes: QuestionRecord[];
  simulados: SimulationRecord[];
  exams: unknown[];
  examQuestions: unknown[];
  planningCapacityHistory: unknown[];
  executionMode: string;
  metas: Record<string, unknown>;
  examDate: string;
  examBlueprint: ExamBlueprint;
  algorithmVersions: Record<string, number>;
  progressHistory: unknown[];
  readinessSnapshots: ReadinessSnapshot[];
  projectionSnapshots: unknown[];
  studySessions: StudySession[];
  dailyPlans: unknown[];
  studyPlans: unknown[];
  planAdjustments: unknown[];
  adaptivePlanningHistory: unknown[];
  recommendationFeedback: unknown[];
  recommendationHistory: unknown[];
  weeklyCloseSnapshots: unknown[];
  alertStates: unknown[];
  activeTimer: ActiveTimerState;
  topicHistory: unknown[];
  achievementsUnlocked: Record<string, unknown>;
  metasPorDisciplina: unknown[];
  lastBackupAt: string | null;
  updatedAt: string | null;
}

export interface DocumentPictureInPictureOptions {
  width?: number;
  height?: number;
}

export interface DocumentPictureInPicture {
  requestWindow(options?: DocumentPictureInPictureOptions): Promise<Window>;
  readonly window?: Window | null;
}

declare global {
  // Preserva compatibilidade com JSDoc nos arquivos .js ainda não migrados
  type TopicStatusGlobal = TopicStatus;
  var documentPictureInPicture: DocumentPictureInPicture | undefined;
}
