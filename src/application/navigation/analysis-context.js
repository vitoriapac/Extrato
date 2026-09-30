const scope=tags=>JSON.stringify([...(tags||[])].sort());
export function createAnalysisContext({origin,subjectId=null,topicId=null,period='30',activeExamTags=[]}={}){
  return {origin,subjectId,topicId,period,activeExamTags:[...activeExamTags]};
}
export function analysisContextInScope(context,activeExamTags=[]){
  return Boolean(context)&&scope(context.activeExamTags)===scope(activeExamTags);
}
