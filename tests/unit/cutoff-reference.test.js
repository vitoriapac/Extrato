import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { buildCutoffReference } from '../../src/domain/analytics/cutoff-reference.js';
import { CareerBenchmarkCard } from '../../src/ui/components/CareerBenchmarkCard.js';
import { calculateCareerBenchmarkComparison } from '../../src/domain/analytics/career-benchmarks.js';

const cut = (praca, score) => ({ banca: 'Cesgranrio', cargo: 'Escriturário', praca, ano: 2023, modalidade: 'AC', score, scale: 100, sourceUrl: 'https://www.cesgranrio.org.br/x' });

test('sem nota de corte cadastrada, compara com a meta do aluno e diz isso', () => {
  const ref = buildCutoffReference({ activeExamTags: ['bb-escriturario'], goalPercent: 85 });
  assert.equal(ref.kind, 'goal');
  assert.match(ref.text, /Sem nota de corte cadastrada.*meta de precisão de 85%/);
  assert.equal(buildCutoffReference({}).kind, 'goal');
  const other = buildCutoffReference({ activeExamTags: ['caixa-tbn'], profiles: { 'bb-escriturario-2023': { cutoffScores: [cut('Nacional', 60)] } } });
  assert.equal(other.kind, 'goal');
});

test('com nota de corte do concurso ativo, mostra ano, praça e banca', () => {
  const profiles = { 'bb-escriturario-2023': { cutoffScores: [cut('Nacional', 60)] } };
  const ref = buildCutoffReference({ activeExamTags: ['bb-escriturario'], profiles });
  assert.equal(ref.kind, 'official');
  assert.match(ref.text, /Nota de corte 2023: 60% da escala, praça Nacional \(Cesgranrio\)/);
  const range = buildCutoffReference({
    activeExamTags: ['bb-escriturario'],
    profiles: { 'bb-escriturario-2023': { cutoffScores: [cut('SP', 62.5), cut('PI', 55)] } },
  });
  assert.match(range.text, /55% a 62,5% da escala, conforme a praça/);
});

test('o card mostra a referência quando recebe', () => {
  const comparison = calculateCareerBenchmarkComparison(
    { studiedHours: 10, resolvedQuestions: 50, accuracyPercent: 65, theoryMinutes: 1, questionsMinutes: 1, reviewMinutes: 1 },
    'geral'
  );
  const cutoffReference = buildCutoffReference({ goalPercent: 80 });
  assert.match(render(h(CareerBenchmarkCard, { comparison, selectedCareerId: 'geral', cutoffReference })), /data-cutoff-reference="goal"/);
  assert.doesNotMatch(render(h(CareerBenchmarkCard, { comparison, selectedCareerId: 'geral' })), /data-cutoff-reference/);
});
