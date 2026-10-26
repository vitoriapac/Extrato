export const normalizeExamImportSearch = (value: unknown) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
export function buildExamImportViewModel({
  state,
  preset,
  presets = [],
  topicLabel = () => '',
  preview = null,
}: any = {}) {
  const query = normalizeExamImportSearch(state?.query?.trim()),
    visibleSubjects = (preset?.subjects || [])
      .map((subject: any) => {
        const allTopics = subject.topics || [],
          topics = allTopics
            .filter(
              (topic: any) =>
                !query ||
                normalizeExamImportSearch(
                  [
                    subject.name,
                    topic.name,
                    ...(subject.aliases || []),
                    ...(topic.aliases || []),
                    topicLabel(topic),
                    ...(topic.sourceRefs || []),
                  ].join(' ')
                ).includes(query)
            )
            .map((topic: any) => {
              const key = `${subject.id}:${topic.id}`;
              return {
                ...topic,
                key,
                checked: state.topicIds.has(key),
                scopeLabel: topicLabel(topic),
              };
            });
        const selectedCount = allTopics.filter((topic: any) =>
          state.topicIds.has(`${subject.id}:${topic.id}`)
        ).length;
        return {
          ...subject,
          topics,
          checked: allTopics.length > 0 && selectedCount === allTopics.length,
          indeterminate: selectedCount > 0 && selectedCount < allTopics.length,
          selectedCount,
          totalCount: allTopics.length,
        };
      })
      .filter((subject: any) => subject.topics.length);
  return {
    step: state.step,
    query: state.query || '',
    preset,
    presets,
    visibleSubjects,
    subjects: visibleSubjects,
    selectedTopics: state.topicIds.size,
    totalTopics: (preset?.subjects || []).reduce(
      (sum: any, subject: any) => sum + (subject.topics || []).length,
      0
    ),
    canContinue: state.step !== 2 || state.topicIds.size > 0,
    preview,
  };
}
