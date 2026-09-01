export function calculateTopicCoverage(topics=[]){
  const active=topics.filter(topic=>!topic.archived);
  if(!active.length)return {value:0,completed:0,total:0,available:false};
  const completed=active.filter(topic=>topic.status==='Concluído').length;
  return {value:Math.round(completed/active.length*100),completed,total:active.length,available:true};
}
