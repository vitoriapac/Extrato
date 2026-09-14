export const PERSISTENT_COLLECTIONS=Object.freeze([
  'subjects','calendar','reviewAgenda','questoes','simulados','progressHistory',
  'studySessions','dailyPlans','studyPlans','planAdjustments','recommendationFeedback',
  'weeklyCloseSnapshots','alertStates','topicHistory','metasPorDisciplina'
]);

export const PERSISTENT_OBJECTS=Object.freeze([
  'metas','examBlueprint','algorithmVersions','activeTimer','achievementsUnlocked'
]);

export function createUiState(overrides={}){
  return {
    activeTab:'visao-geral',
    openModal:null,
    onboarding:{open:false,currentStep:null,presetId:null,previousFocus:null,dismissedForSession:false},
    filters:{},
    previews:{},
    ...overrides
  };
}

export function pickPersistentState(source={}){
  const result={};
  for(const key of ['schemaVersion','executionMode','examDate','lastBackupAt','updatedAt',...PERSISTENT_COLLECTIONS,...PERSISTENT_OBJECTS]){
    if(Object.prototype.hasOwnProperty.call(source,key))result[key]=source[key];
  }
  return result;
}
