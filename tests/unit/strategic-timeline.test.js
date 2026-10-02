import test from 'node:test';import assert from 'node:assert/strict';
import {buildStrategicTimeline} from '../../src/application/analytics/build-strategic-timeline.js';
const tags=['bb-escriturario'];
test('linha do tempo agrega registros sem mutar ou duplicar decisões',()=>{
  const input={activeExamTags:tags,today:'2026-09-28',topics:[{id:'topic',name:'Juros',examTags:tags}],recommendations:[{id:'f',recommendationId:'r',topicId:'topic',date:'2026-09-25',accepted:true}],recommendationHistory:[{id:'r',topicId:'topic',status:'executed',createdAt:'2026-09-25'}],studyPlans:[{id:'p',activeExamTags:tags,confirmedAt:'2026-09-26',weeklyPlannedMinutes:120,phaseStrategy:{status:'reverted'}}],readinessSnapshots:[{id:'a',date:'2026-09-20',activeExamTags:tags,score:60},{id:'b',date:'2026-09-28',activeExamTags:tags,score:64}]};
  const before=structuredClone(input),model=buildStrategicTimeline(input);assert.deepEqual(input,before);assert.equal(model.total,4);assert.equal(model.rows[0].date,'2026-09-28');assert.match(model.rows[0].description,/60 → 64/);assert.equal(model.rows[1].title,'Estratégia por fase revertida');assert.equal(buildStrategicTimeline({...input,filter:'decisions'}).total,1);
});
test('escopo congelado impede comparação entre concursos e eventos futuros',()=>{
  const model=buildStrategicTimeline({activeExamTags:tags,today:'2026-09-28',readinessSnapshots:[{id:'a',date:'2026-09-20',activeExamTags:['caixa-tbn'],score:90}],studyPlans:[{id:'legacy',confirmedAt:'2026-09-20'},{id:'future',confirmedAt:'2026-10-01',activeExamTags:tags}],simulations:[{id:'s',date:'2026-09-27',examTags:tags,total:20,correct:15}]});assert.equal(model.total,1);assert.match(model.rows[0].description,/75%/);
});
test('linha do tempo identifica recuperação aplicada e revertida com capacidade preservada',()=>{
  const model=buildStrategicTimeline({activeExamTags:tags,today:'2026-10-02',adaptiveHistory:[{
    id:'recovery-1',decisionType:'recovery',status:'reverted',createdAt:'2026-09-29T12:00:00Z',decidedAt:'2026-09-29T12:00:00Z',revertedAt:'2026-10-01T12:00:00Z',
    activeExamTags:tags,targetTopicId:'topic',targetName:'Matemática',sourceName:'Português',minutes:40,totalMinutesBefore:720,totalMinutesAfter:720,trajectoryStatus:'at_risk',phase:{label:'Reta final'},reasons:['Retenção baixa','Alta incidência']
  }]});
  assert.equal(model.total,2);
  assert.equal(model.rows[0].title,'Plano de recuperação revertido');
  assert.equal(model.rows[1].title,'Plano de recuperação aplicado');
  assert.match(model.rows[1].description,/720 → 720 min/);
  assert.equal(model.rows[1].details.rows.find(row=>row.label==='Trajetória naquele momento').value,'Em risco');
  assert.equal(model.rows[1].phase,'Reta final');
});
