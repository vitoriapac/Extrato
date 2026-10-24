export function buildStructuredImportViewModel({
  fileName = '',
  subjects = [],
  preview = null,
  issues = [],
}: any = {}) {
  return {
    fileName,
    subjectCount: subjects.length,
    topicCount: subjects.reduce((sum, item) => sum + item.topics.length, 0),
    preview,
    issues,
    canConfirm: Boolean(preview && !issues.length),
  };
}
