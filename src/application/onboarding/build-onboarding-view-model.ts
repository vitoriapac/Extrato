import { pluralize } from '../../core/utils.js';
import { parseLocalDate } from '../../core/date-utils.js';

export interface ExamDateShortcut {
  offsetDays: number;
  label: string;
  sublabel: string;
}

export const EXAM_DATE_SHORTCUTS: readonly ExamDateShortcut[] = Object.freeze([
  { offsetDays: 90, label: '3 meses', sublabel: 'Reta curta' },
  { offsetDays: 180, label: '6 meses', sublabel: 'Pré-edital' },
  { offsetDays: 365, label: '1 ano', sublabel: 'Base longa' },
]);

export interface AvailabilityPreset {
  id: string;
  label: string;
  weeklyHours: number;
  hoursByDay: Record<string, number>;
}

export const AVAILABILITY_PRESETS: readonly AvailabilityPreset[] = Object.freeze([
  {
    id: 'work_study',
    label: 'Trabalho + Estudo (14h/sem)',
    weeklyHours: 14,
    hoursByDay: { '0': 0, '1': 2, '2': 2, '3': 2, '4': 2, '5': 2, '6': 4 },
  },
  {
    id: 'intensive',
    label: 'Dedicação Intensa (28h/sem)',
    weeklyHours: 28,
    hoursByDay: { '0': 0, '1': 4.5, '2': 4.5, '3': 4.5, '4': 4.5, '5': 5, '6': 5 },
  },
  {
    id: 'light_habit',
    label: 'Ritmo Leve (10h30/sem)',
    weeklyHours: 10.5,
    hoursByDay: { '0': 1.5, '1': 1.5, '2': 1.5, '3': 1.5, '4': 1.5, '5': 1.5, '6': 1.5 },
  },
]);

export function applyOnboardingDateShortcut(todayStr: string, offsetDays: number): string {
  const parsed = parseLocalDate(todayStr) || new Date();
  const target = new Date(parsed.getTime());
  target.setDate(target.getDate() + Math.max(0, Number(offsetDays) || 0));
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, '0');
  const day = String(target.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const CONTENT_PATHS = Object.freeze([
  { action: 'import', label: 'Carregar edital do catálogo', primary: true },
  { action: 'structured', label: 'Importar JSON ou CSV' },
  { action: 'manual', label: 'Cadastrar manualmente' },
]);

export function buildOnboardingViewModel({
  examDate = null,
  hoursByDay = {},
  subjects = [],
  sessions = [],
  questions = [],
  dailyPlans = [],
  studyPlans = null,
  planPreview = null,
  currentStep = null,
  today = null,
  presets = [],
  presetId = null,
}: any = {}) {
  type Row = Record<string, any>;
  const hasGoal = Boolean(examDate),
    availableMinutes = (Object.values(hoursByDay || {}) as any[]).reduce(
      (sum, hours) => sum + Math.max(0, Number(hours) || 0) * 60,
      0
    ),
    hasAvailability = availableMinutes > 0,
    hasContent = (subjects || []).some(
      (subject: Row) =>
        !subject.archived && (subject.topics || []).some((topic: Row) => !topic.archived)
    ),
    hasPlan = Array.isArray(studyPlans)
      ? studyPlans.length > 0
      : (dailyPlans || []).some((plan: Row) => (plan.items || []).length > 0),
    hasHistory = (sessions || []).length > 0 || (questions || []).length > 0;
  const steps: Array<{ id: string; label: string; complete: boolean; status?: string }> = [
    { id: 'goal', label: 'Objetivo e data', complete: hasGoal },
    { id: 'availability', label: 'Disponibilidade', complete: hasAvailability },
    { id: 'content', label: 'Edital ou matérias', complete: hasContent },
    { id: 'plan', label: 'Prévia e Hoje', complete: hasPlan || hasHistory },
  ];
  const next = steps.find(step => !step.complete) || null;
  for (const step of steps)
    step.status = step.complete ? 'complete' : step === next ? 'current' : 'pending';
  const requestedIndex = steps.findIndex(step => step.id === currentStep),
    currentIndex =
      requestedIndex >= 0
        ? requestedIndex
        : Math.max(
            0,
            steps.findIndex(step => step === next)
          ),
    current = steps[currentIndex];
  const examDay = parseLocalDate(examDate),
    currentDay = parseLocalDate(today);
  const activeSubjects = (subjects || []).filter(
      (subject: Row) =>
        !subject.archived && (subject.topics || []).some((topic: Row) => !topic.archived)
    ),
    topicCount = activeSubjects.reduce(
      (sum: number, subject: Row) =>
        sum + subject.topics.filter((topic: Row) => !topic.archived).length,
      0
    ),
    estimatedNeedMinutes = activeSubjects.reduce(
      (sum: number, subject: Row) =>
        sum +
        subject.topics
          .filter((topic: Row) => !topic.archived)
          .reduce(
            (total: number, topic: Row) =>
              total + Math.max(15, Number(topic.estimatedStudyMinutes) || 60),
            0
          ),
      0
    ),
    days =
      examDay && currentDay
        ? Math.max(0, Math.ceil((examDay.getTime() - currentDay.getTime()) / 86400000))
        : null;
  const subjectModels = activeSubjects.map((subject: Row) => {
    const levels: string[] = subject.topics
        .filter((topic: Row) => !topic.archived)
        .map((topic: Row) => topic.difficulty || 'Médio'),
      level = levels.includes('Difícil')
        ? 'Difícil'
        : levels.every(value => value === 'Fácil')
          ? 'Fácil'
          : 'Médio';
    return { id: subject.id, name: subject.name, level };
  });
  const firstActivities = (planPreview?.items || []).slice(0, 3).map((item: Row) => ({
    subject: item.subjectName || 'Sem disciplina',
    topic: item.topicName || item.name || 'Tópico sem nome',
    minutes: Math.max(0, Number(item.minutes) || 0),
  }));
  const canConfigurePlan = hasGoal && hasAvailability && hasContent,
    hasEligibleActivities = planPreview?.state !== 'insufficient' && firstActivities.length > 0;
  const planReasons = [...(planPreview?.reasons || [])];
  if (!hasEligibleActivities && canConfigurePlan) {
    if (planPreview?.reason) planReasons.push(planPreview.reason);
    if (planPreview?.missingEffort?.length)
      planReasons.push(
        `${pluralize(planPreview.missingEffort.length, 'tópico', 'tópicos')} sem esforço estimado.`
      );
    if (planPreview?.blockedTopics?.length)
      planReasons.push(
        `${pluralize(planPreview.blockedTopics.length, 'tópico', 'tópicos')} aguardam pré-requisitos.`
      );
    if (!planReasons.length)
      planReasons.push('Revise esforço, pré-requisitos e disponibilidade para liberar atividades.');
  }
  return {
    visible: !hasHistory && !hasPlan && Boolean(next),
    steps,
    next,
    current,
    currentIndex,
    completed: steps.filter(step => step.status === 'complete').length,
    availableMinutes,
    hasGoal,
    hasAvailability,
    hasContent,
    canAdvance:
      current.id === 'goal' ? hasGoal : current.id === 'availability' ? hasAvailability : true,
    canConfigurePlan,
    hasEligibleActivities,
    canCreatePlan: canConfigurePlan && hasEligibleActivities,
    topicCount,
    estimatedNeedMinutes,
    weeksUntilExam: days == null ? null : Math.ceil(days / 7),
    examDate,
    today,
    presets,
    presetId,
    dateShortcuts: EXAM_DATE_SHORTCUTS,
    availabilityPresets: AVAILABILITY_PRESETS,
    subjects: subjectModels,
    contentPaths: CONTENT_PATHS,
    firstActivities,
    planPreviewState: planPreview?.state || null,
    planReasons,
    weekdays: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((label, day) => ({
      day,
      label,
      hours: Math.max(0, Number(hoursByDay?.[String(day)]) || 0),
    })),
  };
}
