import test from 'node:test';
import assert from 'node:assert/strict';
import {buildAdaptivePlanningAdvice,applyAdaptivePlanningAdvice} from '../../src/domain/planning/adaptive-planning.js';
import {migrateRecommendationHistory,reusableRecommendationRecord,syncRecommendationHistory,decideRecommendationRecord,attachRecommendationSession,summarizeRecommendationHistory} from '../../src/application/recommendations/recommendation-history.js';
import {buildRecommendationOutcomeAudit} from '../../src/application/recommendations/build-recommendation-outcome-audit.js';

const plan={weeklyPlannedMinutes:180,subjects:[{subjectId:'a',subjectName:'A',minutes:90},{subjectId:'b',subjectName:'B',minutes:90}],items:[{id:'a1',subjectId:'a',minutes:90,capacityMinutes:150,activityMix:{theory:30,questions:30,reviews:30}},{id:'b1',subjectId:'b',minutes:90,capacityMinutes:150,activityMix:{theory:30,questions:30,reviews:30}}]};
const candidates=[{subjectId:'a',mastery:40,evidenceStrength:.8,examImpact:85,trend:{direction:'stable'}},{subjectId:'b',mastery:90,evidenceStrength:.8,examImpact:40,trend:{direction:'stable'}}];
const history=[{status:'applied',sourceSubjectId:'a',targetSubjectId:'b',decidedAt:'2026-09-10T12:00:00Z'}];

test('planejamento segura inversão por 14 dias e admite deterioração forte',()=>{
  const blocked=buildAdaptivePlanningAdvice({plan,candidates,history,today:'2026-09-20'});
  assert.equal(blocked.state,'stable');assert.match(blocked.reason,/duas semanas/);
  const severe=[{...candidates[0],trend:{direction:'down',state:'strong_down',delta:-15}},candidates[1]];
  const exception=buildAdaptivePlanningAdvice({plan,candidates:severe,history,today:'2026-09-20'});
  assert.equal(exception.state,'proposal');assert.match(exception.rationale.join(' '),/Exceção/);
  const after=buildAdaptivePlanningAdvice({plan,candidates,history,today:'2026-09-24'});
  assert.equal(after.state,'proposal');assert.ok(after.transferMinutes>=15&&after.transferMinutes<=40);
  assert.equal(applyAdaptivePlanningAdvice(plan,{...after,transferMinutes:41}),null);
});

test('planejamento informa estabilidade sem transferência justificada',()=>{
  const stable=buildAdaptivePlanningAdvice({plan,candidates:candidates.map(item=>({...item,mastery:75}))});
  assert.equal(stable.state,'stable');assert.match(stable.reason,/continua adequado/);
});

test('histórico de recomendações migra decisões e conta identidades uma vez',()=>{
  const migrated=migrateRecommendationHistory([{id:'f1',recommendationId:'r1',date:'2026-09-20',shownAt:'2026-09-20T12:00:00Z',accepted:true,actionKind:'study',resultingSessionId:'session-1'},{id:'f2',recommendationId:'r1',date:'2026-09-20',accepted:true}]);
  assert.equal(migrated.length,1);assert.equal(migrated[0].sessionId,'session-1');
  const visible={id:'candidate-2',recommendationId:'r2',shownAt:'2026-09-25T12:00:00Z',subjectId:'s',topicId:'t',score:80,estimatedMinutes:25,reasons:['Lacuna']};
  assert.equal(syncRecommendationHistory(migrated,[visible],{now:'2026-09-25T12:00:00Z',idGenerator:()=> 'unused'}),true);
  assert.equal(syncRecommendationHistory(migrated,[visible],{now:'2026-09-25T12:00:00Z',idGenerator:()=> 'unused'}),false);
  decideRecommendationRecord(migrated,'r2',{accepted:true,source:'today',feedbackId:'f3',now:'2026-09-25T13:00:00Z'});
  attachRecommendationSession(migrated,'r2','session-2');
  assert.equal(migrated[1].status,'executed');assert.equal(migrated[1].sessionId,'session-2');
  const summary=summarizeRecommendationHistory(migrated,{today:'2026-09-25'});
  assert.equal(summary.generated,2);assert.equal(summary.executed,2);assert.equal(summary.adherence,100);
});

test('histórico preserva recomendação na virada UTC durante o mesmo dia local',()=>{
  const originalTimezone=process.env.TZ;
  process.env.TZ='America/Sao_Paulo';
  try{
  const item={id:'candidate-local',recommendationId:'rec-local',shownAt:'2026-09-26T01:30:00Z',score:80,estimatedMinutes:25,reasons:['Lacuna']};
  const records=[];
  assert.equal(syncRecommendationHistory(records,[item],{now:item.shownAt,today:'2026-09-25',idGenerator:()=> 'unused'}),true);
  assert.equal(records[0].localDate,'2026-09-25');
  assert.equal(reusableRecommendationRecord(records,item,'2026-09-25')?.id,'rec-local');
  assert.equal(syncRecommendationHistory(records,[item],{now:'2026-09-26T02:00:00Z',today:'2026-09-25',idGenerator:()=> 'unused'}),false);
  assert.equal(records[0].status,'pending');
  }finally{if(originalTimezone===undefined)delete process.env.TZ;else process.env.TZ=originalTimezone}
});

test('auditoria separa resultado posterior de execução sem evidência',()=>{
  const audit=buildRecommendationOutcomeAudit([{accepted:true,actionKind:'review',outcome:{state:'positive'}},{accepted:true,actionKind:'review',outcome:{state:'neutral'}},{accepted:true,actionKind:'study'},{accepted:false,outcome:{state:'negative'}}]);
  assert.equal(audit.total.executed,3);assert.equal(audit.total.improved,1);assert.equal(audit.total.stable,1);assert.equal(audit.total.insufficient,1);assert.equal(audit.total.declined,0);
});
