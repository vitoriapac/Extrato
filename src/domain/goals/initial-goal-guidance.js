export const INITIAL_GOAL_VALUES=Object.freeze({semanal:5,mensal:20,questoesSemanal:150,simuladosSemanal:1,metaAprovacao:70,consistenciaSemanal:5,aderenciaSemanal:80});
// Sem registro de aceite legado, não inferimos que a pessoa confirmou um padrão.
export function initialGoalSuggestions(goals={},hasActivity=false){
 return hasActivity?[]:Object.entries(INITIAL_GOAL_VALUES).filter(([key,value])=>goals[key]!=null&&Number(goals[key])===value).map(([key])=>key);
}
