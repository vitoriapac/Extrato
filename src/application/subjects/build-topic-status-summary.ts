export function buildTopicStatusSummary(topics: Array<{ status?: string | null; subjectArchived?: boolean; topicArchived?: boolean }>) {
  const result = { total: 0, naoIniciado: 0, andamento: 0, revisao: 0, concluido: 0, desconhecido: 0 };
  for (const topic of topics) {
    if (topic.subjectArchived || topic.topicArchived) continue;
    result.total++;
    if (!topic.status || topic.status === 'Não iniciado') result.naoIniciado++;
    else if (topic.status === 'Em andamento') result.andamento++;
    else if (topic.status === 'Revisão') result.revisao++;
    else if (topic.status === 'Concluído') result.concluido++;
    else result.desconhecido++;
  }
  return result;
}
