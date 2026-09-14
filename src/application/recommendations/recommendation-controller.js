export function createRecommendationController({getRecommendations,actionKind,onQuestions,onReview,onPrerequisite,onStudy,onMissing=()=>{}}={}){
  if(typeof getRecommendations!=='function'||typeof actionKind!=='function')throw new TypeError('Controlador de recomendações requer coleção e classificador de ação.');
  const execute=id=>{const recommendation=getRecommendations().find(item=>item.id===id);if(!recommendation){onMissing(id);return null}const kind=actionKind(recommendation),handler={questions:onQuestions,review:onReview,prerequisite:onPrerequisite,study:onStudy}[kind];if(typeof handler!=='function'){onMissing(id);return null}return handler(recommendation,kind)};
  return Object.freeze({execute});
}
