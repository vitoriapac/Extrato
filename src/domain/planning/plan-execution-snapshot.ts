import { normalizeExamTags } from '../exams/exam-scope.js';

type Row = Record<string, any>;
interface ExecutionContext {
  date?: string | null;
  activeExamTags?: string[];
  capturedAt?: string | null;
  studyPlanId?: string | null;
  originItemId?: string | null;
  historicalContextKnown?: boolean;
}

// Capture only at creation/confirmation. Legacy activities remain explicitly unknown.
export function capturePlanExecution(
  item: Row,
  {
    date = null,
    activeExamTags = [],
    capturedAt = null,
    studyPlanId = item.studyPlanId || null,
    originItemId = null,
    historicalContextKnown = item.executionSnapshot?.historicalContextKnown ?? true,
  }: ExecutionContext = {}
) {
  return {
    version: 1,
    capturedAt,
    date,
    subjectId: item.subjectId || null,
    topicId: item.topicId || null,
    type: item.type || null,
    plannedMinutes: Math.max(0, Number(item.plannedMinutes) || 0),
    activeExamTags: normalizeExamTags(activeExamTags),
    studyPlanId,
    originItemId: originItemId || item.id || null,
    validFrom: date,
    validUntil: date,
    historicalContextKnown,
    prioritySnapshot: item.prioritySnapshot ? structuredClone(item.prioritySnapshot) : null,
  };
}
export function freezePlanExecution(item: Row, context?: ExecutionContext) {
  if (!item.executionSnapshot) item.executionSnapshot = capturePlanExecution(item, context);
  return item;
}
// Callers spread the result into new items; a Row spread would drop the index signature.
export function historicalExecutionItem(item: Row): any {
  const snapshot = item.executionSnapshot;
  if (snapshot?.version !== 1) return item;
  return {
    ...item,
    subjectId: snapshot.subjectId,
    topicId: snapshot.topicId,
    type: snapshot.type,
    studyPlanId: snapshot.studyPlanId,
    plannedMinutes: Math.max(0, snapshot.plannedMinutes - (Number(item.transferredMinutes) || 0)),
    prioritySnapshot: snapshot.prioritySnapshot,
  };
}
