type ExamRecord = Record<string, any>;

export function examsInScope(exams: ExamRecord[] = [], activeExamTags: string[] = []) {
  const active = new Set(activeExamTags);
  return exams.filter(
    exam => !active.size || (exam.examTags || []).some((tag: string) => active.has(tag))
  );
}

export function comparableExamEvidence({
  exams = [],
  questions = [],
  activeExamTags = [],
}: { exams?: ExamRecord[]; questions?: ExamRecord[]; activeExamTags?: string[] } = {}) {
  const scoped = examsInScope(exams, activeExamTags);
  const complete = scoped.filter(exam => exam.coverage === 'complete');
  const completeIds = new Set(complete.map(exam => exam.id));
  const scopedIds = new Set(scoped.map(exam => exam.id));
  return {
    scopedExams: scoped,
    completeExams: complete,
    analyzedQuestions: questions.filter(question => completeIds.has(question.examId)),
    observedQuestions: questions.filter(question => scopedIds.has(question.examId)),
  };
}
