export function createReviewViewModel(
  review: Record<string, any>,
  {
    subjectName = '',
    topicName = '',
    difficulty = 'Médio',
    formatDate = (value: string) => value,
  }: any = {}
) {
  return Object.freeze({
    id: review.id,
    date: review.date ? formatDate(review.date) : 'Sem data',
    subject: subjectName || 'Sem disciplina',
    topic: topicName || review.topic || 'Sem tópico',
    type: review.tipo || 'Revisão livre',
    difficulty,
    status: review.status || 'Não iniciado',
    pending: review.status !== 'Concluído',
    manualDate: Boolean(review.manualDate),
    lastRating: review.lastRating || null,
  });
}
