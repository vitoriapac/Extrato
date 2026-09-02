import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAdaptiveInterval,applyAdaptiveReviewRating,createAdaptiveReviewState } from '../../src/domain/reviews.js';

test('encurta o intervalo quando o desempenho e critico', () => {
  const result = calculateAdaptiveInterval({baseDays: 10, accuracy: 40, volume: 20, target: 70});
  assert.equal(result.days, 7);
  assert.match(result.reason, /abaixo de 50%/);
});

test('alonga o intervalo com desempenho e historico consistentes', () => {
  const result = calculateAdaptiveInterval({baseDays: 10, accuracy: 90, volume: 30, target: 70, trendKey: 'up', reviews: 4});
  assert.ok(result.days > 10 && result.days <= 15);
});

test('limita intervalos adaptativos', () => {
  assert.equal(calculateAdaptiveInterval({baseDays: 200, accuracy: 100, volume: 100, reviews: 10}).days, 60);
  assert.equal(calculateAdaptiveInterval({baseDays: 2, accuracy: 0, volume: 100, trendKey: 'down'}).days, 1);
});

test('reinicia a sequência quando a pessoa erra',()=>{
  const result=applyAdaptiveReviewRating({easinessFactor:2.6,repetitions:5,intervalDays:30},'again',{reviewDate:'2026-09-01'});
  assert.equal(result.repetitions,0);assert.equal(result.intervalDays,1);assert.equal(result.nextReviewDate,'2026-09-02');
});

test('inicializa tópicos legados com estado adaptativo nulo',()=>{
  const result=applyAdaptiveReviewRating(null,'good',{reviewDate:'2026-09-01'});
  assert.equal(result.repetitions,1);assert.equal(result.nextReviewDate,'2026-09-02');
});

test('expande o intervalo progressivamente para avaliações boas e fáceis',()=>{
  const first=applyAdaptiveReviewRating(createAdaptiveReviewState(),'good',{reviewDate:'2026-09-01'});
  const second=applyAdaptiveReviewRating(first,'good',{reviewDate:first.nextReviewDate});
  const third=applyAdaptiveReviewRating(second,'easy',{reviewDate:second.nextReviewDate});
  assert.deepEqual([first.intervalDays,second.intervalDays],[1,6]);assert.ok(third.intervalDays>second.intervalDays);assert.equal(third.lastRating,'easy');
});
