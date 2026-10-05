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
 assert.match(buildWeeklyDecisionGuidance({cycle,sustainability}).decision,/semanas encerradas comparáveis/);
 sustainability.state='insufficient_data';assert.doesNotMatch(buildWeeklyDecisionGuidance({cycle,sustainability}).decision,/disponibilidade semanal/);
});

import {buildWeeklyDecisionSummary} from '../../src/application/analytics/build-weekly-decision-cycle.js';
import {renderWeeklyDecisionCycle} from '../../src/ui/renderers/weekly-decision-cycle-renderer.js';
test('síntese mantém contagem de atividades separada do crédito temporal e não reescreve contexto',()=>{
 const cycle={worked:['Melhora observada'],attention:['Revisão pendente'],execution:{},readiness:{comparison:{delta:null,reason:'Sem base'}},simulations:0,outcomes:[]};
 const adherence={assessment:{status:'attention'},model:{priority:{completedActivities:1,plannedActivities:3,adherence:60}}};
 const before=JSON.stringify({cycle,adherence});
 const summary=buildWeeklyDecisionSummary({cycle,adherence,trajectory:{state:'baseline',current:'attention',accuracyDelta:-10}});
 assert.equal(summary.priorities.completed,1);assert.equal(summary.priorities.percent,60);assert.equal(summary.trajectory.delta,null);
 const html=renderWeeklyDecisionCycle(cycle,{adherence,trajectory:{state:'baseline',current:'attention'}});
 assert.match(html,/1 de 3 atividades prioritárias/);assert.match(html,/Decisão sugerida/);assert.match(html,/Investigar os sinais/);assert.doesNotMatch(html,/weekly-decision-detail" open/);
 assert.ok(html.indexOf('Decisão sugerida')<html.indexOf('Investigar os sinais'));
 assert.equal(JSON.stringify({cycle,adherence}),before);
 adherence.assessment.status='insufficient_data';assert.equal(buildWeeklyDecisionSummary({cycle,adherence}).priorities,null);
});
