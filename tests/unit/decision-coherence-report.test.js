import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDecisionCoherenceReport} from '../../src/application/diagnostics/build-decision-coherence-report.js';
import {buildNextBestAction} from '../../src/application/diagnostics/build-next-best-action.js';
import {buildProjectionPageModel} from '../../src/application/projection/index.js';
import {projectionScenarios} from '../fixtures/projection-scenarios/scenarios.js';

const trajectory={status:'at_risk',topicRisks:[{subjectId:'math',topicId:'interest',examImpact:85}]};
const action=topicId=>({action:{subjectId:'math',topicId},reasons:[]});

test('mesmo tópico mantém o ciclo de decisão coerente',()=>{
  const report=buildDecisionCoherenceReport({trajectory,nextBestAction:action('interest'),
    examIntelligence:[{subjectId:'math',topicId:'interest',examImpact:85}],
    adaptivePlan:{items:[{topicId:'interest'}]},weeklyClose:{gapMap:{rows:[{topicId:'interest'}]}}});
  assert.equal(report.coherent,true);
  assert.deepEqual(report.divergences,[]);
  assert.equal(report.signals[0].planned,true);
  assert.equal(report.signals[0].weeklyGap,true);
});

test('divergência sem explicação é relatada, sem modificar os produtores',()=>{
  const inputs={trajectory,nextBestAction:action('informatics')};
  const before=structuredClone(inputs);
  const report=buildDecisionCoherenceReport(inputs);
  assert.equal(report.coherent,false);
  assert.equal(report.divergences[0].type,'trajectory_action_mismatch');
  assert.equal(report.divergences[0].explainable,false);
  assert.deepEqual(inputs,before);
});

test('divergência justificada fica observável e não invalida a decisão',()=>{
  const report=buildDecisionCoherenceReport({trajectory,nextBestAction:{...action('informatics'),reasons:['Revisão vencida']}});
  assert.equal(report.coherent,true);
  assert.equal(report.divergences[0].reason,'Revisão vencida');
  assert.equal(buildDecisionCoherenceReport({trajectory:{status:'insufficient_data',topicRisks:trajectory.topicRisks},nextBestAction:action('informatics')}).divergences.length,0);
});

test('matriz usa saídas reais da trajetória e da próxima ação sem reordená-las',()=>{
  const {expected,studySessions,...scenario}=projectionScenarios.longDeadline;
  const candidate={subjectId:'math',topicId:'interest',topicName:'Juros',subjectName:'Matemática',examImpact:85,mastery:42,evidenceStrength:.8};
  const projection=buildProjectionPageModel({...scenario,candidates:[candidate]}).model;
  const recommendations=[{id:'rec-math',subjectId:'math',topicId:'interest',score:80,estimatedMinutes:30,reasons:['Retenção baixa']}];
  const nextBestAction=buildNextBestAction({recommendations,projection});
  const report=buildDecisionCoherenceReport({trajectory:projection,nextBestAction,
    examIntelligence:{rows:[{subjectId:'math',topicId:'interest',impact:85}]}});
  assert.equal(report.coherent,true);
  assert.equal(report.signals[0].nextAction,true);
  assert.equal(report.signals[0].highExamImpact,true);
  assert.equal(nextBestAction.action.id,'rec-math');
});
