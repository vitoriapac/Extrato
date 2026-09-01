import test from 'node:test';
import assert from 'node:assert/strict';
import {buildExecutiveSummary} from '../../src/application/build-executive-summary.js';

test('monta resumo executivo com prontidão, prazo, ritmo e meta',()=>{
  const result=buildExecutiveSummary({readiness:{value:72,confidenceLabel:'Média',availableFactors:['coverage','mastery','retention']},daysToExam:45,pace:{status:'ok',remaining:20,comparativo:'no-prazo'},topPriority:{recommendedAction:'Revisar teoria',subjectName:'Português',topicName:'Interpretação',estimatedMinutes:30,reason:'revisão atrasada'},riskCount:2,weeklyGoal:{achieved:3,target:5},opportunityCount:1});
  assert.equal(result.cards[0].value,'72/100');
  assert.equal(result.cards[3].value,'60%');
  assert.equal(result.primaryAction.duration,30);
  assert.equal(result.riskCount,2);
});

test('não cria estado negativo quando faltam dados',()=>{
  const result=buildExecutiveSummary({readiness:{value:null},pace:{status:'sem-dados',remaining:4}});
  assert.equal(result.cards[0].label,'Aguardando dados');
  assert.match(result.opportunityMessage,/Ainda não há dados suficientes/);
});
