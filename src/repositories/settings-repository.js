export function createSettingsRepository({getState}={}){
  if(typeof getState!=='function')throw new TypeError('Repositório de configurações requer estado.');
  const state=()=>getState();
  return Object.freeze({
    getGoals:()=>state().metas,
    updateGoal:(key,value)=>{state().metas[key]=value;return state().metas},
    updateDailyHours:(day,value)=>{state().metas.horasPorDia[String(day)]=value;return state().metas},
    getSubjectGoals:()=>state().metasPorDisciplina
  });
}
