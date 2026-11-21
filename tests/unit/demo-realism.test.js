import test from 'node:test';
import assert from 'node:assert/strict';
import { generateDemoData } from '../../src/demo/demo-generator.js';
import { spreadVolumes } from '../../src/demo/demo-builders/study-history.js';

const today = '2026-11-20';
const state = generateDemoData({ today });
const weekOf = date => {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() - ((value.getUTCDay() + 6) % 7));
  return value.toISOString().slice(0, 10);
};

test('spreadVolumes soma exatamente o total, com volumes variados e mínimo por sessão', () => {
  const volumes = spreadVolumes(1000, 53);
  assert.equal(volumes.reduce((a, b) => a + b, 0), 1000);
  assert.ok(Math.min(...volumes) >= 8);
  assert.ok(new Set(volumes).size >= 6, 'precisa de vários tamanhos de sessão');
});

test('demo: o total de questões segue o blueprint, mas as sessões não têm todas o mesmo tamanho', () => {
  assert.equal(state.questoes.reduce((sum, row) => sum + row.resolved, 0), 1750);
  const sizes = new Set(state.questoes.map(row => row.resolved));
  assert.ok(sizes.size >= 8, `só ${sizes.size} tamanhos de sessão`);
});

test('demo: semanas de estudo têm tempos diferentes (sem 4 semanas seguidas iguais)', () => {
  const minutes = new Map();
  for (const session of state.studySessions)
    minutes.set(weekOf(session.date), (minutes.get(weekOf(session.date)) || 0) + session.durationSeconds / 60);
  const weeks = [...minutes.entries()].sort().slice(0, -1).map(([, value]) => Math.round(value));
  let run = 1;
  for (let index = 1; index < weeks.length; index++) {
    run = weeks[index] === weeks[index - 1] ? run + 1 : 1;
    assert.ok(run < 3, `semanas seguidas com o mesmo tempo: ${weeks.join(', ')}`);
  }
});

test('demo: revisão espaçada só existe para tópico já estudado', () => {
  const studied = new Set(state.studySessions.map(session => session.topicId));
  const orphan = state.reviewAgenda.filter(review => !studied.has(review.topicId));
  assert.equal(orphan.length, 0);
});

test('demo: recomendações não miram tópico que já está acima da meta no primeiro registro', () => {
  const byTopic = new Map();
  for (const row of [...state.questoes].sort((a, b) => a.date.localeCompare(b.date)))
    if (!byTopic.has(row.topicId)) byTopic.set(row.topicId, (row.correct / row.resolved) * 100);
  const generated = state.recommendationHistory.filter(item => byTopic.has(item.topicId));
  assert.ok(generated.length > 0);
  const above = generated.filter(item => byTopic.get(item.topicId) >= 80);
  assert.equal(above.length, 0, `acima da meta: ${above.map(item => item.topicId).join(', ')}`);
});

test('demo: conquistas de sequência, recomendação e estratégia saem com data real', () => {
  const unlocks = state.achievementUnlocks;
  for (const id of ['streak3', 'streak7', 'recommendation1', 'mappedExam']) {
    assert.ok(unlocks[id]?.unlockedAt, `${id} sem data`);
    assert.ok(unlocks[id].unlockedAt <= today);
  }
});
