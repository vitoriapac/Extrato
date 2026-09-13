import {normalizeExamTags} from '../../domain/exams/exam-scope.js';
const DERIVED_FIELDS=Object.freeze(['diagnosis','forecast','weeklyFocus','readiness','masteryMatrix','pdfPreview']);
export function setActiveExamTags(state,tags=[],{configuredAt=null}={}){
  if(!state?.examBlueprint)throw new TypeError('Estado da prova inválido.');
  const next=normalizeExamTags(tags),changed=JSON.stringify(next)!==JSON.stringify(normalizeExamTags(state.examBlueprint.activeExamTags));
  if(!changed)return false;
  state.examBlueprint.activeExamTags=next;
  if(configuredAt)state.examBlueprint.configuredAt=configuredAt;
  for(const field of DERIVED_FIELDS)if(field in state)state[field]=null;
  return true;
}
export {DERIVED_FIELDS};
