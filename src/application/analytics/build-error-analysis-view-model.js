const LABELS={naoSabia:'Não sabia',esqueci:'Esqueci',interpretacao:'Interpretação',calculo:'Cálculo',desatencao:'Desatenção',chute:'Chute'};
const ICONS={naoSabia:'📚',esqueci:'🧠',interpretacao:'📖',calculo:'➗',desatencao:'⚠️',chute:'🎲'};
export function buildErrorAnalysisViewModel({current,previous=null,periodLabel=''}={}){
  if(!current||current.state==='empty')return {state:'empty',totalErrors:0,items:[],message:'Nenhum erro registrado neste recorte.'};
  const items=[...Object.keys(LABELS).map(key=>({key,label:LABELS[key],icon:ICONS[key],value:current.categories[key]||0,previous:previous?.categories?.[key]||0})),{key:'uncategorized',label:'Sem categoria',icon:'○',value:current.uncategorized||0,previous:previous?.uncategorized||0}].map(item=>({...item,delta:item.value-item.previous}));
  const dominant=current.dominant,diagnosis=dominant?dominant.share+'% dos erros categorizados vêm de '+LABELS[dominant.key].toLowerCase()+'.':'Ainda não há evidência suficiente para definir uma causa dominante.';
  const action=dominant?dominant.recommendation.action:'Continue categorizando os erros para receber uma ação confiável.';
  return {state:current.state,totalErrors:current.totalErrors,categorizedErrors:current.categorizedErrors,coverage:current.coverage,confidence:current.confidence,periodLabel,items,dominant,diagnosis,action,recommendedMode:current.recommendedMode,hasPrevious:Boolean(previous?.totalErrors),algorithmVersion:current.algorithmVersion};
}
