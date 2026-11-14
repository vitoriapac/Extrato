import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWeekSummary } from '../../src/application/performance/build-week-summary.js';
import { renderWeekSummary } from '../../src/ui/performance/week-summary-renderer.js';

const brief = (over = {}, current = {}) => ({
  periodLabel: '08/11 a 14/11',
  hasActivity: true,
  current: {
    studiedMinutes: 758,
    plannedMinutes: 920,
    planFulfillmentPct: 82,
    activeDays: 6,
    resolved: 120,
    accuracy: 73,
    ...current,
  },
  ...over,
});
const action = {
  action: { recommendationId: 'r1' },
  topicName: 'Juros simples',
  subjectName: 'Matemática',
};
// Uma duração ("12h 38min") conta como um número.
const numbers = summary =>
  (
    summary.paragraphs
      .join(' ')
      .replace(/\d+h( \d+min)?|\d+min/g, '#')
      .match(/\d+(?:[.,]\d+)?|#/g) || []
  ).length;

test('semana normal: feito, sinal e ação, com a ação da Leitura e até três números', () => {
  const summary = buildWeekSummary({ brief: brief(), nextBestAction: action });
  assert.equal(summary.kind, 'normal');
  assert.equal(summary.paragraphs.length, 3);
  assert.match(summary.paragraphs[0], /Você estudou 12h 38min em 6 dias, perto do que o plano previa\./);
  assert.match(summary.paragraphs[1], /A precisão em questões foi 73%\./);
  assert.match(summary.paragraphs[2], /A próxima ação é Juros simples \(Matemática\), em Hoje\./);
  assert.ok(numbers(summary) <= 3);
});

test('acima e abaixo do plano mudam só a cláusula do plano', () => {
  const above = buildWeekSummary({ brief: brief({}, { planFulfillmentPct: 140 }), nextBestAction: action });
  const below = buildWeekSummary({ brief: brief({}, { planFulfillmentPct: 50 }), nextBestAction: action });
  assert.equal(above.kind, 'above_plan');
  assert.match(above.paragraphs[0], /mais do que o plano previa/);
  assert.equal(below.kind, 'below_plan');
  assert.match(below.paragraphs[0], /menos do que o plano previa/);
});

test('amostra pequena: a frase diz isso e a precisão não aparece', () => {
  const summary = buildWeekSummary({ brief: brief({}, { resolved: 12, accuracy: 58 }), nextBestAction: action });
  assert.equal(summary.kind, 'small_sample');
  assert.match(summary.paragraphs[1], /Poucas questões na semana \(menos de 30\)/);
  assert.ok(!summary.paragraphs.join(' ').includes('58%'));
});

test('sem plano: nota de ritmo sem referência e nenhuma cláusula de plano', () => {
  const summary = buildWeekSummary({
    brief: brief({}, { plannedMinutes: 0, planFulfillmentPct: null }),
    nextBestAction: action,
  });
  assert.equal(summary.kind, 'no_plan');
  assert.doesNotMatch(summary.paragraphs[0], /plano previa/);
  assert.match(summary.paragraphs[1], /Sem plano ativo nesta semana/);
});

test('sem estudo: um parágrafo só, sem culpa', () => {
  const summary = buildWeekSummary({ brief: brief({ hasActivity: false }), nextBestAction: null });
  assert.equal(summary.kind, 'no_study');
  assert.deepEqual(summary.paragraphs, [
    'Nenhuma sessão nos últimos 7 dias. A próxima ação está em Hoje.',
  ]);
});

test('sem ação calculada, remete a Hoje; o mesmo estado gera o mesmo texto', () => {
  const a = buildWeekSummary({ brief: brief(), nextBestAction: null });
  const b = buildWeekSummary({ brief: brief(), nextBestAction: null });
  assert.equal(a.paragraphs.at(-1), 'A próxima ação está em Hoje.');
  assert.deepEqual(a, b);
});

test('o bloco mostra o selo "7 dias", as datas e nenhum cartão antigo', () => {
  const html = renderWeekSummary(buildWeekSummary({ brief: brief(), nextBestAction: action }));
  assert.match(html, /data-window="sevenDays"/);
  assert.match(html, /08\/11 a 14\/11/);
  assert.match(html, /id="bloco-resumo"/);
  assert.doesNotMatch(html, /Resumo do período|Meta e última semana/);
  assert.equal(renderWeekSummary(null), '');
});
