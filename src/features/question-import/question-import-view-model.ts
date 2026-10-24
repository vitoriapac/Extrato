export function buildQuestionImportViewModel({
  fileName = '',
  preview = null,
  issues = [],
}: any = {}) {
  const hasIssues = issues.length > 0;
  const canConfirm = Boolean(preview && preview.totalSessions > 0 && !hasIssues);

  return Object.freeze({
    fileName,
    canConfirm,
    issues: issues.map(issue => ({
      line: issue.line || null,
      message: issue.message || 'Problema não especificado.',
    })),
    preview: preview
      ? {
          totalSessions: preview.totalSessions,
          totalResolved: preview.totalResolved,
          totalCorrect: preview.totalCorrect,
          accuracy: preview.accuracy,
          matchedSubjectsCount: preview.matchedSubjectsCount,
          newSubjectsCount: preview.newSubjects.length,
          newSubjects: preview.newSubjects,
          matchedTopicsCount: preview.matchedTopicsCount,
          newTopicsCount: preview.newTopics.length,
          newTopics: preview.newTopics,
          duplicateCount: preview.duplicateCount,
          unknownErrorCategoryCount: preview.unknownErrorCategoryCount || 0,
          archivedRecordCount: preview.archivedRecordCount || 0,
          archivedMatches: preview.archivedMatches || [],
          recordsSample: preview.records.slice(0, 10),
        }
      : null,
  });
}
