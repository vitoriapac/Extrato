import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDemoData} from '../../src/demo/demo-generator.js';
import {demoSustainabilityPeriods} from '../../src/demo/demo-builders/sustainability.js';
import {buildWeeklyAdherence} from '../../src/application/adherence/build-weekly-adherence.js';
import {buildSustainabilityModel} from '../../src/application/planning-sustainability/build-sustainability-model.js';
import {addLocalDays,parseLocalDate} from '../../src/core/date-utils.js';

for(const today of ['2026-10-03','2026-09-27','2026-08-31'])test(`dense Demo produces four distinct reconciled planning patterns: ${today}`,()=>{
  const state=generateDemoData({today}),before=JSON.stringify(state);
  for(const period of demoSustainabilityPeriods(today)){
    const cutoff=addLocalDays(period.end,1),activeExamTags=state.examBlueprint.activeExamTags;
    const weekly=buildWeeklyAdherence({today:cutoff,subjects:state.subjects,sessions:state.studySessions,dailyPlans:state.dailyPlans,capacityHistory:state.planningCapacityHistory,activeExamTags,historyWeeks:4});
    const model=buildSustainabilityModel({today:cutoff,activeExamTags,weeklyAdherence:weekly,snapshots:state.weeklyCloseSnapshots});
    assert.equal(model.assessment.status,period.status);assert.equal(model.evidence.comparableWeeks,4);
    assert.equal(model.capacity.averageAvailableMinutes,720);assert.equal(model.execution.plannedMinutes,2400);
    const captured=state.weeklyCloseSnapshots.find(row=>row.period.end===period.end)?.weeklyClose.adherence.sustainability;
    assert.equal(captured.assessment.status,period.status);
  }
  assert.equal(JSON.stringify(state),before);assert.equal(state.studySessions.length,200);
  assert.ok(state.weeklyCloseSnapshots.every(row=>parseLocalDate(row.period.start).getDay()===1&&row.weeklyClose.adherence.model.period.complete));
  const restored=JSON.parse(JSON.stringify(state)),frozen=JSON.stringify(restored.weeklyCloseSnapshots);
  restored.studySessions=[];restored.metas.horasPorDia['1']=5;restored.subjects.forEach(subject=>subject.archived=true);
  assert.equal(JSON.stringify(restored.weeklyCloseSnapshots),frozen);
});
