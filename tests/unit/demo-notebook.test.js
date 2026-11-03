import test from 'node:test';
import assert from 'node:assert/strict';
import scenario from '../../src/demo/demo-scenario.json' with { type: 'json' };
import { generateDemoData } from '../../src/demo/demo-generator.js';
import { buildDemoFlashcards } from '../../src/demo/demo-builders/error-notebook.js';
import {
  calculateFlashcardDeckStats,
  getDueFlashcards,
} from '../../src/domain/notebook/error-notebook-engine.js';

const today = '2026-09-27';

test('buildDemoFlashcards gera deck determinístico completo com pegadinhas de banca', () => {
  const demo = generateDemoData({ today });
  assert.ok(Array.isArray(demo.errorFlashcards));
  assert.equal(demo.errorFlashcards.length, 17);

  // Reprodutibilidade estrita
  const cards1 = buildDemoFlashcards(scenario, { today, subjects: demo.subjects });
  const cards2 = buildDemoFlashcards(scenario, { today, subjects: demo.subjects });
  assert.deepEqual(cards1, cards2);

  // Verificação de vínculos e campos essenciais
  const subjectIds = new Set(demo.subjects.map(s => s.id));
  const topicIds = new Set(demo.subjects.flatMap(s => s.topics.map(t => t.id)));

  for (const card of demo.errorFlashcards) {
    assert.ok(card.id.startsWith('demo-flashcard-'));
    assert.ok(subjectIds.has(card.subjectId), `Subject ID ${card.subjectId} inexistente`);
    assert.ok(topicIds.has(card.topicId), `Topic ID ${card.topicId} inexistente`);
    assert.ok(card.statementSummary.length > 10);
    assert.ok(card.correctConcept.length > 10);
    assert.ok(card.bancaTrap && card.bancaTrap.length > 10);
    assert.ok(
      ['desatencao', 'interpretacao', 'esqueci', 'naoSabia', 'calculo'].includes(card.errorCategory)
    );
    assert.ok(['pending', 'reviewing', 'mastered'].includes(card.status));
  }

  // Estatísticas do deck
  const stats = calculateFlashcardDeckStats(demo.errorFlashcards, today);
  assert.equal(stats.total, 17);
  assert.equal(stats.pendingCount, 6);
  assert.equal(stats.reviewingCount, 5);
  assert.equal(stats.masteredCount, 6);

  // Cartões vencidos na data de Hoje para experimentação imediata
  const due = getDueFlashcards(demo.errorFlashcards, today);
  assert.equal(due.length, 11); // 6 pendentes + 5 reviewing vencidos hoje
});
