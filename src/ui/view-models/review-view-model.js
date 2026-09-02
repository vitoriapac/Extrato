export function createReviewViewModel(review,{subjectName='',topicName='',difficulty='Médio',formatDate=value=>value}={}){
  return Object.freeze({id:review.id,date:review.date?formatDate(review.date):'Sem data',subject:subjectName||'Sem disciplina',topic:topicName||review.topic||'Sem tópico',type:review.tipo||'Revisão livre',difficulty,status:review.status||'Não iniciado',pending:review.status!=='Concluído',manualDate:Boolean(review.manualDate),lastRating:review.lastRating||null});
}
