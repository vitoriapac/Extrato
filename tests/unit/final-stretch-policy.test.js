import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FINAL_STRETCH_THRESHOLD_DAYS,
  FINAL_STRETCH_RATIOS,
  isFinalStretchActive,
  resolvePhaseRatios,
  shouldFreezeNewTheoryTopic,
  calculateFinalStretchWeightMultiplier,
  buildFinalStretchBanner,
} from '../../src/domain/planning/final-stretch-policy.js';

test('isFinalStretchActive — ativa somente para prazos não-negativos abaixo de 15 dias', () => {
  assert.equal(isFinalStretchActive(14), true);
  assert.equal(isFinalStretchActive(10), true);
  assert.equal(isFinalStretchActive(1), true);
  assert.equal(isFinalStretchActive(0), true);

  // Fora do limiar
  assert.equal(isFinalStretchActive(15), false);
  assert.equal(isFinalStretchActive(30), false);
  assert.equal(isFinalStretchActive(-1), false);
  assert.equal(isFinalStretchActive(null), false);
  assert.equal(isFinalStretchActive(undefined), false);
  assert.equal(isFinalStretchActive(NaN), false);
});

test('resolvePhaseRatios — inverte carga para 85% de questões e revisões na reta final', () => {
  const normal = resolvePhaseRatios(45);
  assert.equal(normal.isFinalStretch, false);
  assert.equal(normal.theory, 0.5);

  const finalStretch = resolvePhaseRatios(7);
  assert.equal(finalStretch.isFinalStretch, true);
  assert.equal(finalStretch.theory, FINAL_STRETCH_RATIOS.theory); // 15%
  assert.equal(finalStretch.questions, FINAL_STRETCH_RATIOS.questions); // 50%
  assert.equal(finalStretch.reviews, FINAL_STRETCH_RATIOS.reviews); // 35%
  assert.equal(finalStretch.questions + finalStretch.reviews, 0.85);
});

test('shouldFreezeNewTheoryTopic — bloqueia tópicos teóricos novos e sem estudo na reta final', () => {
  const newTopic = { topicId: 't1', sessionsCount: 0, totalStudySeconds: 0 };
  const inProgressTopic = { topicId: 't2', sessionsCount: 2, totalStudySeconds: 3600 };

  // Fora da reta final, nenhum tópico é congelado
  assert.equal(shouldFreezeNewTheoryTopic(newTopic, 30), false);
  assert.equal(shouldFreezeNewTheoryTopic(inProgressTopic, 30), false);

  // Na reta final (< 15 dias), tópicos sem histórico são congelados
  assert.equal(shouldFreezeNewTheoryTopic(newTopic, 10), true);
  // Tópicos já iniciados continuam elegíveis
  assert.equal(shouldFreezeNewTheoryTopic(inProgressTopic, 10), false);
});

test('calculateFinalStretchWeightMultiplier — prioriza lacunas de alta presença e desprioriza baixa incidência', () => {
  // Tópico crítico: alta presença (75%) e domínio frágil (45%)
  const criticalTopic = {
    topicId: 't1',
    historicalPresencePercent: 75,
    currentMastery: 45,
  };
  // Com 4 dias para a prova, recebe boost máximo de 3.0x
  assert.equal(calculateFinalStretchWeightMultiplier(criticalTopic, 4), 3.0);
  // Com 9 dias, recebe 2.5x
  assert.equal(calculateFinalStretchWeightMultiplier(criticalTopic, 9), 2.5);
  // Com 12 dias, recebe 2.0x
  assert.equal(calculateFinalStretchWeightMultiplier(criticalTopic, 12), 2.0);

  // Tópico dominado (88%) com alta presença: manutenção leve (0.8x)
  const masteredTopic = {
    topicId: 't2',
    historicalPresencePercent: 70,
    currentMastery: 88,
  };
  assert.equal(calculateFinalStretchWeightMultiplier(masteredTopic, 5), 0.8);

  // Tópico irrelevante (< 30% presença): despriorizado (0.4x)
  const lowPresenceTopic = {
    topicId: 't3',
    historicalPresencePercent: 15,
    currentMastery: 50,
  };
  assert.equal(calculateFinalStretchWeightMultiplier(lowPresenceTopic, 5), 0.4);

  // Fora da reta final: multiplicador neutro 1.0x
  assert.equal(calculateFinalStretchWeightMultiplier(criticalTopic, 30), 1.0);
});

test('buildFinalStretchBanner — gera banner contextual com urgência e prazos', () => {
  const inactive = buildFinalStretchBanner(25);
  assert.equal(inactive.active, false);

  const active = buildFinalStretchBanner(8, 'Auditor Fiscal');
  assert.equal(active.active, true);
  assert.equal(active.urgency, 'high');
  assert.match(active.title, /faltam 8 dias para Auditor Fiscal/);
  assert.match(active.message, /questões de fixação \(50%\)/);

  const critical = buildFinalStretchBanner(3, 'Receita Federal');
  assert.equal(critical.active, true);
  assert.equal(critical.urgency, 'critical');
  assert.match(critical.title, /faltam 3 dias/);
  assert.match(critical.message, /Foco total em simulados rápidos/);
});
