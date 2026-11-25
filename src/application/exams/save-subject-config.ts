import { EXAM_PRIORITIES } from '../../state/strategic.js';
import type { ExamBlueprintSubject, ExamPriority } from '../../core/types.ts';

export function buildSavedSubjectConfig(
  subjectId: string,
  current: ExamBlueprintSubject | null | undefined,
  {
    priority,
    masteryTarget,
    expectedQuestions,
    questionWeight,
    accuracyTarget,
    minScore,
    blockId,
  }: {
    priority: string;
    masteryTarget: string | number;
    expectedQuestions: string | number;
    questionWeight: string | number;
    accuracyTarget?: string | number;
    minScore?: string | number;
    blockId?: string | null;
  }
): ExamBlueprintSubject | null {
  const mastery = masteryTarget === '' ? null : Number(masteryTarget),
    questions = expectedQuestions === '' ? 0 : Number(expectedQuestions),
    weight = questionWeight === '' ? 1 : Number(questionWeight);
  if (
    !EXAM_PRIORITIES.includes(priority as ExamPriority) ||
    (mastery !== null && (!Number.isFinite(mastery) || mastery < 0 || mastery > 100)) ||
    !Number.isInteger(questions) ||
    questions < 0 ||
    !Number.isFinite(weight) ||
    weight < 0.1
  )
    return null;
  const accuracy =
    accuracyTarget === undefined
      ? (current?.accuracyTarget ?? null)
      : accuracyTarget === ''
        ? null
        : Number(accuracyTarget);
  if (accuracy !== null && (!Number.isFinite(accuracy) || accuracy < 0 || accuracy > 100))
    return null;
  // Vazio ou 0: sem mínimo eliminatório.
  const minimum =
    minScore === undefined
      ? (current?.minScore ?? null)
      : minScore === '' || Number(minScore) === 0
        ? null
        : Number(minScore);
  if (minimum !== null && (!Number.isFinite(minimum) || minimum < 0 || minimum > 100)) return null;
  const next: ExamBlueprintSubject = {
    ...(current || {
      subjectId,
      expectedQuestions: 0,
      questionWeight: 1,
      priority: 'normal' as const,
      masteryTarget: null,
    }),
  };
  if (next.expectedQuestions !== questions || next.questionWeight !== weight) {
    next.sourceRef = null;
    next.official = false;
    next.mappingType = null;
  }
  const resolvedBlockId =
    blockId === undefined
      ? current?.blockId
      : blockId && String(blockId).trim()
        ? String(blockId).trim()
        : null;
  const saved: ExamBlueprintSubject = {
    ...next,
    priority: priority as ExamPriority,
    accuracyTarget: accuracy,
    minScore: minimum ?? undefined,
    masteryTarget: mastery,
    expectedQuestions: questions,
    questionWeight: weight,
  };
  if (resolvedBlockId) saved.blockId = resolvedBlockId;
  else delete saved.blockId;
  return saved;
}
