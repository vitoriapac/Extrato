import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseQuickQuestionShorthand,
  parseCopiedPlatformStats,
} from '../../src/domain/questions/quick-question-parser.js';

test('parseQuickQuestionShorthand interpreta abreviações de concurseiro e valida limites', () => {
  const full = parseQuickQuestionShorthand('30q 26c 2b fgv 35m ref');
  assert.equal(full.ok, true);
  assert.equal(full.resolved, 30);
  assert.equal(full.correct, 26);
  assert.equal(full.blank, 2);
  assert.equal(full.banca, 'FGV');
  assert.equal(full.minutes, 35);
  assert.equal(full.retry, true);

  const slash = parseQuickQuestionShorthand('25/21 cespe 28min');
  assert.equal(slash.ok, true);
  assert.equal(slash.resolved, 25);
  assert.equal(slash.correct, 21);
  assert.equal(slash.banca, 'Cebraspe');
  assert.equal(slash.minutes, 28);
  assert.equal(slash.retry, false);

  const withErrors = parseQuickQuestionShorthand('20q 4e 2b fcc');
  assert.equal(withErrors.ok, true);
  assert.equal(withErrors.resolved, 20);
  assert.equal(withErrors.correct, 14);
  assert.equal(withErrors.blank, 2);
  assert.equal(withErrors.banca, 'FCC');

  const invalid = parseQuickQuestionShorthand('10q 12c');
  assert.equal(invalid.ok, false);
  assert.match(invalid.error, /superar/i);
});

test('parseCopiedPlatformStats extrai estatísticas de blocos colados do TEC Concursos e QConcursos', () => {
  const tecText = `Resumo do Caderno
Questões resolvidas: 40
Certas: 31
Erradas: 6
Em branco: 3
Banca: Cebraspe (CESPE)
Tempo total: 1h 10m`;

  const parsed = parseCopiedPlatformStats(tecText);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.resolved, 40);
  assert.equal(parsed.correct, 31);
  assert.equal(parsed.errors, 6);
  assert.equal(parsed.blank, 3);
  assert.equal(parsed.minutes, 70);
  assert.equal(parsed.banca, 'Cebraspe');

  const qConcursosText = `25 acertos | 5 erros | 35 min | Banca FGV`;
  const parsedQc = parseCopiedPlatformStats(qConcursosText);
  assert.equal(parsedQc.ok, true);
  assert.equal(parsedQc.resolved, 30);
  assert.equal(parsedQc.correct, 25);
  assert.equal(parsedQc.minutes, 35);
  assert.equal(parsedQc.banca, 'FGV');
});
