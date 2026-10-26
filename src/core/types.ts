import type { AdaptiveReviewState } from '../domain/reviews.ts';
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
  examTags?: string[];
  examMetrics?: Record<string, ExamMetric>;
  examImportanceEstimates?: Record<string, number>;
  adaptiveReview?: AdaptiveReviewState | null;
  completedAt?: string | null;
}

export interface Subject {
  id: string;
  name: string;
  collapsed: boolean;
  archived: boolean;
  archivedAt: string | null;
  createdAt: string;
  topics: Topic[];
  examMetrics?: Record<string, ExamMetric>;
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
  studySessionId?: string | null;
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
  startedAt?: string | null;
  questionsResolved?: number;
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
  accuracyTarget?: number | null;
  sourceRef?: string | null;
  official?: boolean;
  mappingType?: string | null;
}

export interface ExamBlueprint {
  examDate: string | null;
  targetScore: number;
  masteryTarget: number;
  activeExamTags: string[];
  configuredAt: string | null;
  subjects: ExamBlueprintSubject[];
}

export interface TimerStrategy {
  label: string;
  steps: Array<{ label: string; minutes: number; status?: string }>;
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
  strategy: TimerStrategy | null;
  strategyStep: number;
  recommendationId: string | null;
  recommendationSource: string | null;
  recommendationType: string | null;
  prioritySnapshot: number | null;
}

export interface CalendarItem {
  id: string;
  date: string;
  status: string;
  subjectId?: string | null;
  topicId?: string | null;
  reviewType?: string | null;
}

export interface ReviewAgendaItem {
  id: string;
  date: string;
  status: string;
  subjectId?: string | null;
  topicId?: string | null;
  /** Legacy reference kept by old backups. */
  topicRef?: string | null;
  /** Legacy topic label kept by old backups. */
  topic?: string | null;
  tipo?: string | null;
  suggestedDate?: string | null;
  baseIntervalDays?: number | null;
  adaptive?: boolean;
  manualDate?: boolean;
  adaptiveReason?: string | null;
  adaptiveState?: AdaptiveReviewState | null;
  lastRating?: string | null;
  createdAt?: string | null;
  completedAt?: string | null;
}

export interface ExamRecord {
  id: string;
}

export interface ExamQuestionRecord {
  id: string;
}

export interface PlanningCapacityEntry {
  id?: string;
}

export interface ProgressHistoryEntry {
  date: string;
  pct: number;
}

export interface ProjectionSnapshot {
  id: string;
}

export interface DailyPlanItem {
  id: string;
  subjectId: string | null;
  topicId: string | null;
  type: StudyActivityType | string;
  plannedMinutes: number;
  executedSeconds: number;
  status: string;
  sessionIds: string[];
  recommendationId?: string | null;
  studyPlanId?: string | null;
  studyPlanItemId?: string | null;
  generationOperationId?: string | null;
  rescheduleOperationId?: string | null;
  rescheduledFromId?: string | null;
  rescheduleCount?: number;
  originalDate?: string | null;
  currentDate?: string | null;
  skippedReason?: string | null;
  startedAt?: string | null;
  subjectName?: string;
  topicName?: string;
  score?: number;
  tier?: string;
  position?: number;
  statusIcon?: string;
  statusLabel?: string;
  reason?: string;
  action?: string;
  recommendedQuestions?: number;
  createdAt?: string | null;
  prioritySnapshot?: Record<string, unknown> | null;
  executionSnapshot?: Record<string, unknown> | null;
}

export interface StudyPlanOperation {
  id?: string;
}

export interface DailyPlan {
  id: string;
  date: string;
  availableMinutes: number;
  plannedMinutes: number;
  items: DailyPlanItem[];
  studyPlanId?: string | null;
  generationOperationId?: string | null;
  flexMinutes?: number;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface StudyPlan {
  id: string;
  dailyPlanOperations?: StudyPlanOperation[];
}

export interface PlanAdjustment {
  id: string;
  status: string;
  changes: Record<string, unknown>[];
  redistributedMinutes?: number;
  discardedMinutes?: number;
  confirmedAt?: string | null;
  undoneAt?: string | null;
}

export interface AdaptivePlanningEntry {
  id: string;
  status: string;
  planId?: string | null;
  createdAt?: string | null;
  decidedAt?: string | null;
  reasons?: string[];
  sourceSubjectId?: string | null;
  sourceName?: string | null;
  sourceBefore?: number | null;
  sourceAfter?: number | null;
  targetSubjectId?: string | null;
  targetName?: string | null;
  targetBefore?: number | null;
  targetAfter?: number | null;
  explanationSnapshot?: Record<string, unknown> | null;
}

export interface RecommendationFeedback {
  recommendationId: string;
  topicId?: string | null;
  accepted?: boolean;
  completed?: boolean;
  useful?: boolean | null;
  score?: number | null;
  confidence?: number | null;
  algorithmVersion?: number;
  createdAt?: string | null;
  shownAt?: string | null;
  ratedAt?: string | null;
  snapshot?: Record<string, unknown> | null;
  baseline?: ({ measuredAt?: string } & Record<string, unknown>) | null;
  outcome?: ({ state?: string } & Record<string, unknown>) | null;
}

export interface RecommendationHistoryEntry {
  id: string;
}

export interface WeeklyCloseSnapshot {
  id?: string;
}

export interface AlertState {
  alertId: string;
  dismissedUntil: string | null;
  resolvedAt: string | null;
}

export interface TopicHistoryEvent {
  id?: string;
}

export interface SubjectGoal {
  id: string;
  meta: number;
}

export interface Metas {
  semanal: number;
  mensal: number;
  questoesSemanal: number;
  simuladosSemanal: number;
  metaAprovacao: number;
  consistenciaSemanal: number;
  aderenciaSemanal: number | null;
  horasDiarias: number;
  horasPorDia: Record<string, number>;
}

export interface ExamMetric {
  expectedQuestions?: number;
  questionWeight?: number;
  mappingType?: string;
  delta?: number;
  available?: boolean;
  official?: boolean;
  raw?: unknown;
}

export interface AppState {
  schemaVersion: number;
  subjects: Subject[];
  calendar: CalendarItem[];
  reviewAgenda: ReviewAgendaItem[];
  questoes: QuestionRecord[];
  simulados: SimulationRecord[];
  exams: ExamRecord[];
  examQuestions: ExamQuestionRecord[];
  planningCapacityHistory: PlanningCapacityEntry[];
  executionMode: string;
  metas: Metas;
  examDate: string;
  examBlueprint: ExamBlueprint;
  algorithmVersions: Record<string, number>;
  progressHistory: ProgressHistoryEntry[];
  readinessSnapshots: ReadinessSnapshot[];
  projectionSnapshots: ProjectionSnapshot[];
  studySessions: StudySession[];
  dailyPlans: DailyPlan[];
  studyPlans: StudyPlan[];
  planAdjustments: PlanAdjustment[];
  adaptivePlanningHistory: AdaptivePlanningEntry[];
  recommendationFeedback: RecommendationFeedback[];
  recommendationHistory: RecommendationHistoryEntry[];
  weeklyCloseSnapshots: WeeklyCloseSnapshot[];
  alertStates: AlertState[];
  activeTimer: ActiveTimerState;
  topicHistory: TopicHistoryEvent[];
  achievementsUnlocked: Record<string, unknown>;
  metasPorDisciplina: SubjectGoal[];
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
