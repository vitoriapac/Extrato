import test from 'node:test';
import assert from 'node:assert/strict';
import {buildWeeklyCloseActionProposal} from '../../src/application/analytics/weekly-close-actions.js';
test('fecha prioridades individualmente dentro da capacidade e informa excedente',()=>{const result=buildWeeklyCloseActionProposal({priorities:[{priorityId:'a',topicId:'t1',estimatedMinutes:50,action:'Revisar',reason:'lacuna'},{priorityId:'b',topicId:'t2',estimatedMinutes:40,action:'Praticar',reason:'risco'}],selectedIds:['a','b'],futureDays:[{date:'2026-09-15',availableMinutes:60},{date:'2026-09-16',availableMinutes:20}]});assert.equal(result.allocations.reduce((sum,item)=>sum+item.minutes,0),80);assert.equal(result.unallocatedMinutes,10);assert.equal(result.capacityByDay[0].remainingMinutes,0);assert.equal(result.allocations[0].snapshotId,null)});

import {buildWeeklyDecisionGuidance} from '../../src/application/analytics/build-weekly-decision-cycle.js';
test('síntese semanal não confunde mudança de base com piora',()=>{
 const cycle={worked:['Precisão aumentou'],attention:['Revisão pendente']},before=JSON.stringify(cycle);
 const baseline=buildWeeklyDecisionGuidance({cycle,trajectory:{state:'baseline',accuracyDelta:-10}});
 assert.equal(baseline.accuracyDelta,null);assert.match(baseline.decision,/pré-visualize/);
 const comparable=buildWeeklyDecisionGuidance({cycle,trajectory:{state:'comparable',accuracyDelta:2}});
 assert.equal(comparable.accuracyDelta,2);assert.match(comparable.comparisonNote,/não representa/);
 assert.equal(JSON.stringify(cycle),before);assert.equal(buildWeeklyDecisionGuidance(),null);
});

test('síntese reutiliza recomendação estrutural somente com semanas suficientes',()=>{
 const cycle={worked:[],attention:[]},sustainability={state:'ready',assessment:{action:'review_capacity'}};
 assert.match(buildWeeklyDecisionGuidance({cycle,sustainability}).decision,/disponibilidade semanal/);
 sustainability.state='insufficient_data';assert.doesNotMatch(buildWeeklyDecisionGuidance({cycle,sustainability}).decision,/disponibilidade semanal/);
});
