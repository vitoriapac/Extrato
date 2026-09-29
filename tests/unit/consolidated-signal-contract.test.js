import test from 'node:test';
import assert from 'node:assert/strict';
import {createConsolidatedSignal,signalEntityKey} from '../../src/domain/diagnostics/consolidated-signal.js';
import {diagnosticLabel,normalizeSeverity,normalizeEvidenceLevel,normalizeTrend,normalizeOutcome} from '../../src/domain/diagnostics/diagnostic-vocabulary.js';
const base={id:'g1',source:'gap-map',subjectId:'s1',topicId:'t1',kind:'critical-gap',active:true,availability:'available',severity:'critical'};

test('vocabulário adapta estados legados sem alterar identificadores persistidos',()=>{
  assert.equal(normalizeSeverity('high'),'important');assert.equal(normalizeSeverity('unknown'),'insufficient');
  assert.equal(normalizeSeverity('low'),'monitor');
  assert.equal(normalizeEvidenceLevel('Média'),'moderate');assert.equal(normalizeEvidenceLevel('unknown'),'unassessed');
  assert.equal(normalizeTrend('strong_down'),'worsening');assert.equal(normalizeTrend('strong_up'),'improving');
  assert.equal(normalizeOutcome('positive'),'improved');assert.equal(normalizeOutcome('pending'),'pending');
  assert.equal(diagnosticLabel('severity','controlled'),'Sob controle');assert.equal(diagnosticLabel('outcome','improved'),'Melhora observada');
});
test('contrato mantém evidência separada da completude e distingue ausência de zero',()=>{
  const input={...base,evidence:{completeness:1}},before=structuredClone(input),signal=createConsolidatedSignal(input);
  assert.equal(signal.evidence.strength,null);assert.equal(signal.evidence.level,'unassessed');assert.equal(signal.evidence.completeness,1);
  assert.deepEqual(input,before);assert.equal(createConsolidatedSignal({...base,evidence:{strength:0}}).evidence.level,'low');
  assert.equal(createConsolidatedSignal({...base,evidence:{strength:NaN,completeness:''}}).evidence.completeness,null);
  assert.equal(createConsolidatedSignal({...base,evidence:{strength:80}}).evidence.level,'unassessed');
});
test('contrato rejeita identidades ambíguas e preserva granularidade',()=>{
  assert.equal(createConsolidatedSignal({...base,subjectId:null}),null);assert.equal(createConsolidatedSignal({...base,granularity:'subject'}),null);
  assert.equal(createConsolidatedSignal({...base,kind:'invented'}),null);
  const subject=createConsolidatedSignal({...base,topicId:null,kind:'plateau'});
  assert.equal(subject.granularity,'subject');assert.notEqual(subject.entityKey,createConsolidatedSignal(base).entityKey);
  assert.notEqual(signalEntityKey({granularity:'topic',subjectId:'a:b',topicId:'c'}),signalEntityKey({granularity:'topic',subjectId:'a',topicId:'b:c'}));
});
test('contrato preserva escopo desconhecido, período inválido e proveniência sem mutação',()=>{
  const input={...base,activeExamTags:['bb','bb','caixa'],period:{start:'2026-09-29',end:'2026-09-01'},evidence:{observationIds:['q1','q1'],sources:['questions']},metrics:{nested:{value:10}}};
  const signal=createConsolidatedSignal(input);assert.deepEqual(signal.activeExamTags,['bb','caixa']);assert.deepEqual(signal.period,{start:null,end:null});
  assert.deepEqual(signal.evidence.observationIds,['q1']);signal.metrics.nested.value=11;assert.equal(input.metrics.nested.value,10);
  assert.equal(createConsolidatedSignal(base).activeExamTags,null);assert.equal(createConsolidatedSignal({...base,availability:'insufficient'}).active,false);
  assert.deepEqual(createConsolidatedSignal({...base,period:{start:'2026-02-30',end:'2026-03-01'}}).period,{start:null,end:null});
});
