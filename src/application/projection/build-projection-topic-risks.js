// Uses the existing priority candidate order. It annotates evidence; it does not rank or score topics.
export function buildProjectionTopicRisks(candidates = []) {
  const seen = new Set();
  return candidates.filter(item => item?.topicId && item?.subjectId && item.examImpact != null && Number(item.examImpact) >= 70
    && item.mastery != null && Number.isFinite(Number(item.mastery)) && Number(item.mastery) < 60
    && item.evidenceStrength != null && Number(item.evidenceStrength) >= .35 && !seen.has(item.topicId) && seen.add(item.topicId))
    .map(item => ({topicId:item.topicId,subjectId:item.subjectId,topicName:item.topicName || item.name || 'Tópico',
      subjectName:item.subjectName || 'Disciplina',examImpact:Math.round(Number(item.examImpact)),
      mastery:Math.round(Number(item.mastery))})).slice(0,100);
}
