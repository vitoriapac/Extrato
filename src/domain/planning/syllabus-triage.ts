// Syllabus triage: with the hours left until the exam, which pending topics fit, ranked by
// exam impact per minute, and which ones the student may choose to leave out.
type Row = Record<string, unknown>;

export interface SyllabusTriageItem {
  topicId: string;
  topicName: string;
  subjectName: string;
  minutes: number;
  impact: number;
}

const DEFAULT_IMPACT = 50;

export function buildSyllabusTriage({
  candidates = [],
  weeklyAvailableMinutes = 0,
  weeksUntilExam = 0,
  maintenanceMinutes = 0,
}: {
  candidates?: Row[];
  weeklyAvailableMinutes?: number;
  weeksUntilExam?: number;
  maintenanceMinutes?: number;
} = {}) {
  const weeks = Math.max(0, Number(weeksUntilExam) || 0);
  const weekly = Math.max(0, Number(weeklyAvailableMinutes) || 0);
  const maintenance = Math.max(0, Number(maintenanceMinutes) || 0);
  const budgetMinutes = Math.round(Math.max(0, weekly - maintenance) * weeks);
  const pending: SyllabusTriageItem[] = candidates
    .filter(item => item?.topicId && !item.covered && !item.archived)
    .map(item => ({
      topicId: String(item.topicId),
      topicName: String(item.topicName || 'Tópico'),
      subjectName: String(item.subjectName || 'Disciplina'),
      minutes: Math.round(Number(item.remainingMinutes ?? item.estimatedMinutes) || 0),
      impact: Number.isFinite(Number(item.examImpact)) ? Number(item.examImpact) : DEFAULT_IMPACT,
    }))
    .filter(item => item.minutes > 0);
  // Greedy by impact per minute: the usual answer when the syllabus does not fit.
  const ranked = [...pending].sort(
    (a, b) => b.impact / b.minutes - a.impact / a.minutes || b.impact - a.impact
  );
  const keep: SyllabusTriageItem[] = [];
  const cut: SyllabusTriageItem[] = [];
  let used = 0;
  for (const item of ranked) {
    if (used + item.minutes <= budgetMinutes) {
      keep.push(item);
      used += item.minutes;
    } else cut.push(item);
  }
  const totalImpact = pending.reduce((sum, item) => sum + item.impact, 0);
  const keptImpact = keep.reduce((sum, item) => sum + item.impact, 0);
  return {
    budgetMinutes,
    neededMinutes: pending.reduce((sum, item) => sum + item.minutes, 0),
    maintenanceMinutes: maintenance,
    coveragePct: totalImpact > 0 ? Math.round((keptImpact / totalImpact) * 100) : 100,
    keep,
    // Lowest value first: the most obvious cuts lead the list.
    cut: cut.sort((a, b) => a.impact / a.minutes - b.impact / b.minutes),
  };
}
