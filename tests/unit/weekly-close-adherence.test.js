import test from 'node:test';
import assert from 'node:assert/strict';
import {addLocalDays} from '../../src/core/date-utils.js';
import {freezePlanExecution} from '../../src/domain/planning/plan-execution-snapshot.js';
import {buildWeeklyCloseAdherence,buildAdherenceCloseHistory} from '../../src/application/adherence/build-weekly-close-adherence.js';
import {createWeeklyCloseSnapshot,upsertWeeklyCloseSnapshot} from '../../src/application/analytics/weekly-close-snapshot.js';
import {renderWeeklyAdherence,renderAdherenceCloseHistory} from '../../src/ui/renderers/weekly-adherence-renderer.js';
import {captureCloseComparisonMetrics,buildCloseComparison} from '../../src/application/analytics/build-close-comparison.js';
import {buildStrategicTimeline} from '../../src/application/analytics/build-strategic-timeline.js';

const subjects=[{id:'s',name:'Disciplina',topics:[{id:'t',name:'Tópico <script>'}]}];
function input(start,credit=0,tags=[]){
  const end=addLocalDays(start,6),item={id:`item-${start}`,subjectId:'s',topicId:'t',type:'study',plannedMinutes:60,prioritySnapshot:{priority:true}};
  freezePlanExecution(item,{date:start,activeExamTags:tags});
  return {start,end,today:end,subjects,activeExamTags:tags,dailyPlans:[{id:`plan-${start}`,date:start,items:[item]}],sessions:credit?[{id:`session-${start}`,planItemId:item.id,date:start,subjectId:'s',topicId:'t',type:'study',examScope:tags,durationSeconds:credit*60}]:[]};
}
function saved(start,credit=0,tags=[],revision=1){
  const data=input(start,credit,tags),frame=buildWeeklyCloseAdherence(data);
  return {id:`saved-${start}-${revision}`,period:{start,end:data.end},activeExamTags:tags,savedAt:data.end+'T12:00:00Z',revision,weeklyClose:{state:'available',adherence:frame}};
}

test('recurrence requires repeated deficits in separate classified periods',()=>{
  const snapshots=[saved('2026-09-14'),saved('2026-09-21')],data={...input('2026-09-28',30),snapshots},before=structuredClone(data);
  const frame=buildWeeklyCloseAdherence(data);
  assert.equal(frame.assessment.status,'mixed');assert.equal(frame.recurring.items.length,1);
  assert.equal(frame.recurring.items[0].periodCount,3);assert.equal(frame.recurring.items[0].remainingMinutes,30);
  assert.deepEqual(data,before);
  assert.equal(buildWeeklyCloseAdherence({...data,sessions:input('2026-09-28',60).sessions}).recurring.items.length,0);
});
test('revisions and overlapping snapshots cannot inflate recurrence',()=>{
  const snapshots=[saved('2026-09-14'),saved('2026-09-19'),saved('2026-09-21'),saved('2026-09-21',60,[],2)];
  const frame=buildWeeklyCloseAdherence({...input('2026-09-28'),snapshots});
  assert.equal(frame.recurring.items[0].periodCount,2);assert.equal(frame.recurring.historyPeriods,2);
  assert.deepEqual(frame.recurring.items[0].periods.map(row=>row.start),['2026-09-28','2026-09-14']);
});
test('future, stale, another-exam and legacy evidence do not create recurring alerts',()=>{
  const snapshots=[saved('2026-08-03',0,['bb']),saved('2026-10-05',0,['bb']),saved('2026-09-21',0,['caixa']),{...saved('2026-09-14',0,['bb']),weeklyClose:{state:'available'}}];
  const frame=buildWeeklyCloseAdherence({...input('2026-09-28',0,['bb']),snapshots});
  assert.equal(frame.recurring.items.length,0);assert.equal(frame.recurring.state,'insufficient_history');
});
test('unknown historical priority stops strategic conclusions',()=>{
  const data=input('2026-09-28');data.dailyPlans[0].items[0].executionSnapshot.prioritySnapshot=null;
  const frame=buildWeeklyCloseAdherence({...data,snapshots:[saved('2026-09-21')]});
  assert.equal(frame.assessment.status,'insufficient_data');assert.equal(frame.recurring.state,'insufficient_data');
  assert.match(renderWeeklyAdherence(frame),/evidência insuficiente/);assert.doesNotMatch(renderWeeklyAdherence(frame),/Revisar planejamento/);
});
test('saved adherence and explanations remain frozen after sessions and configuration change',()=>{
  const data=input('2026-09-28',30),frame=buildWeeklyCloseAdherence({...data,snapshots:[saved('2026-09-21')]}),model={period:{start:data.start,end:data.end},activeExamTags:[],weeklyClose:{state:'available',algorithmVersion:'2.2.0',adherence:frame},gapMap:{items:[]},decisionHistory:{items:[]}};
  const snapshot=createWeeklyCloseSnapshot(model,{id:'closed',savedAt:'2026-10-04T12:00:00Z'}),list=[];
  upsertWeeklyCloseSnapshot(list,snapshot);const before=structuredClone(list);
  frame.model.summary.temporalAdherence=99;data.dailyPlans[0].items[0].plannedMinutes=240;data.sessions=[];
  const restored=JSON.parse(JSON.stringify(list)),history=buildAdherenceCloseHistory({snapshots:restored,activeExamTags:[],today:'2026-10-05'});
  assert.equal(history[0].adherence.model.summary.temporalAdherence,50);assert.equal(history[0].adherence.recurring.items[0].periodCount,2);
  assert.equal(snapshot.version,3);assert.deepEqual(list,before);
  history[0].adherence.model.summary.temporalAdherence=0;assert.deepEqual(restored,before);
});
test('history displays only the latest saved revision per period and respects scope',()=>{
  const snapshots=[saved('2026-09-21',0,['bb']),saved('2026-09-21',60,['bb'],2),saved('2026-09-14',0,['caixa'])];
  const history=buildAdherenceCloseHistory({snapshots,activeExamTags:['bb'],today:'2026-10-05'});
  assert.equal(history.length,1);assert.equal(history[0].revision,2);assert.equal(history[0].adherence.model.priority.adherence,100);
});
test('recurrence is descriptive and historical views never offer an apply action',()=>{
  const frame=buildWeeklyCloseAdherence({...input('2026-09-28'),snapshots:[saved('2026-09-21')]});
  const html=renderWeeklyAdherence(frame);assert.match(html,/Tópico &lt;script&gt;/);assert.doesNotMatch(html,/<script>/);
  assert.match(html,/openWeeklyAdherencePlanning/);assert.match(html,/prévia e confirmação/);assert.doesNotMatch(html,/confirmWeeklyCloseActions/);
  const history=renderAdherenceCloseHistory([{period:frame.model.period,revision:1,adherence:frame}]);
  assert.doesNotMatch(history,/openWeeklyAdherencePlanning/);assert.match(history,/interpretações preservados/);
});

test('comparison never mixes the new adherence policy with a legacy percentage',()=>{
  const frame=buildWeeklyCloseAdherence(input('2026-09-28',30)),current={period:{start:'2026-09-28',end:'2026-10-04'},weeklyClose:{adherence:frame}};
  const metrics=captureCloseComparisonMetrics(current);assert.equal(metrics.strategicAdherence,50);assert.equal(metrics.adherencePolicyVersion,1);
  const previous={id:'old',period:{start:'2026-09-21',end:'2026-09-27'},activeExamTags:[],comparisonMetrics:{strategicAdherence:75},savedAt:'2026-09-27'};
  assert.equal(buildCloseComparison({current,snapshots:[previous]}).rows.find(row=>row.key==='strategicAdherence').delta,null);
  frame.assessment.status='insufficient_data';assert.equal(captureCloseComparisonMetrics(current).strategicAdherence,null);
});

test('timeline reads frozen adherence and never promotes a sparse legacy percentage',()=>{
  const snapshot=saved('2026-09-21',30);snapshot.weeklyClose.decisionCycle={execution:{strategicAdherence:100}};
  let timeline=buildStrategicTimeline({weeklyCloseSnapshots:[snapshot],activeExamTags:[],today:'2026-10-04'});
  assert.match(timeline.rows[0].description,/aderência estratégica 50%/);
  snapshot.weeklyClose.adherence.assessment.status='insufficient_data';
  timeline=buildStrategicTimeline({weeklyCloseSnapshots:[snapshot],activeExamTags:[],today:'2026-10-04'});
  assert.match(timeline.rows[0].description,/aderência estratégica sem dados/);
});
