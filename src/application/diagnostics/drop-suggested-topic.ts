type Row = Record<string, any>;

/** A sugestão fora do plano já abre o Diagnóstico: o mesmo tópico não volta como item da lista. */
export function dropSuggestedTopic(diagnosis: Row, suggested?: Row | null): Row {
  const topics = diagnosis?.consolidated?.topics;
  if (!suggested || !Array.isArray(topics)) return diagnosis;
  return {
    ...diagnosis,
    consolidated: {
      ...diagnosis.consolidated,
      // O tópico sai da lista, mas continua no escopo: a contagem por disciplina o conta (D12).
      suggestedDropped: { subjectId: suggested.subjectId, topicId: suggested.topicId },
      topics: topics.filter(
        (item: Row) => !(item.subjectId === suggested.subjectId && item.topicId === suggested.topicId)
      ),
    },
  };
}
