import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPeriodComparisonInsights} from '../../src/domain/analytics/period-comparison-insights.js';

const comparison=(questions,minutes,accuracy)=>({metrics:[{key:'questions',delta:questions},{key:'minutes',delta:minutes},{key:'accuracy',delta:accuracy}]});

test('resume aumento de volume e acerto apenas com amostra comparável',()=>{
  const model=buildPeriodComparisonInsights(comparison(12,30,5),{currentQuestionVolume:32,previousQuestionVolume:25});
  assert.equal(model.confidence,'moderate');
  assert.equal(model.combinedState,'available');
  assert.equal(model.combinedMessage,'Volume e desempenho melhoraram.');
});

test('explica aumento de tempo com queda no acerto sem alegar causalidade',()=>{
  const model=buildPeriodComparisonInsights(comparison(-2,45,-4),{currentQuestionVolume:30,previousQuestionVolume:27});
  assert.equal(model.combinedMessage,'Você estudou mais tempo, mas a taxa de acerto caiu.');
  assert.match(model.caveat,/não demonstra que uma ação causou/);
});

test('não gera leitura combinada para amostra pequena ou métrica ausente',()=>{
  const small=buildPeriodComparisonInsights(comparison(5,20,3),{currentQuestionVolume:8,previousQuestionVolume:10});
  const missing=buildPeriodComparisonInsights(comparison(5,20,null),{currentQuestionVolume:30,previousQuestionVolume:25});
  assert.equal(small.confidence,'low');assert.equal(small.combinedMessage,null);
  assert.equal(missing.combinedMessage,null);assert.equal(missing.combinedState,'not_applicable');
});
