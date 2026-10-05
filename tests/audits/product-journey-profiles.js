import {createDefaultState} from '../../src/state/defaults.js';
import {generateDemoData} from '../../src/demo/demo-generator.js';
import {addLocalDays} from '../../src/core/date-utils.js';

export const AUDIT_TODAY='2026-10-05';
export const AUDIT_PROFILES=['new','early','intermediate','irregular','advanced','final_stretch'];
export function buildJourneyProfile(profile){
 if(!AUDIT_PROFILES.includes(profile))throw new TypeError('Unknown audit profile');
 if(profile==='new'){
  const state=createDefaultState();state.updatedAt=AUDIT_TODAY+'T12:00:00-03:00';
  state.subjects.forEach((subject,index)=>{subject.id=`audit-subject-${index}`;subject.createdAt=state.updatedAt;subject.topics.forEach((topic,i)=>{topic.id=`audit-topic-${index}-${i}`;topic.createdAt=state.updatedAt})});
  return state;
 }
 const preparationProfile={early:'limited_evidence',intermediate:'recovery',irregular:'standard',advanced:'recovery',final_stretch:'final_stretch'}[profile];
 const state=generateDemoData({today:AUDIT_TODAY,preparationProfile});
 if(profile==='early'){
  const start=addLocalDays(AUDIT_TODAY,-14);
  for(const key of ['studySessions','questoes','simulados','dailyPlans','readinessSnapshots','projectionSnapshots','topicHistory','weeklyCloseSnapshots'])state[key]=(state[key]||[]).filter(row=>(row.date||row.period?.end||'')>=start);
 }
 // Advanced uses the existing recovery dataset with a longer deadline; measured outcomes are unchanged.
 if(profile==='advanced'){state.examDate=addLocalDays(AUDIT_TODAY,90);state.examBlueprint.examDate=state.examDate}
 return state;
}
