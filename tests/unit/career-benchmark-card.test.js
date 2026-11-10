import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { CareerBenchmarkCard } from '../../src/ui/components/CareerBenchmarkCard.js';
import {
  CAREER_BENCHMARKS,
  calculateCareerBenchmarkComparison,
} from '../../src/domain/analytics/career-benchmarks.js';

test('CareerBenchmarkCard — renderiza comparativo completo de ritmo por carreira', () => {
  const comparison = calculateCareerBenchmarkComparison(
    {
      studiedHours: 26,
      resolvedQuestions: 240,
      accuracyPercent: 82,
      theoryMinutes: 300,
      questionsMinutes: 600,
      reviewMinutes: 300,
    },
    'fiscal-controle'
  );

  const html = render(
    h(CareerBenchmarkCard, {
      comparison,
      selectedCareerId: 'fiscal-controle',
    })
  );

  assert.match(html, /Ritmo frente aos aprovados/);
  assert.match(html, /Fiscal &amp; Controle|Fiscal & Controle/);
  assert.match(html, /Horas Líquidas Semanais/);
  assert.match(html, /26 h\/sem/);
  assert.match(html, /Volume de Questões Semanais/);
  assert.match(html, /240 questões\/sem/);
  assert.match(html, /Precisão em Questões/);
  assert.match(html, /82 %/);
  assert.match(html, /Mix de Estudo/);
  assert.match(html, /Diretriz Pedagógica/);
  assert.match(html, /careerClusterSelect/);
});

test('CareerBenchmarkCard — exibe opções de todas as carreiras suportadas no seletor', () => {
  const comparison = calculateCareerBenchmarkComparison(
    {
      studiedHours: 10,
      resolvedQuestions: 50,
      accuracyPercent: 65,
      theoryMinutes: 400,
      questionsMinutes: 100,
      reviewMinutes: 100,
    },
    'geral'
  );

  const html = render(
    h(CareerBenchmarkCard, {
      comparison,
      selectedCareerId: 'geral',
    })
  );

  for (const opt of Object.values(CAREER_BENCHMARKS)) {
    assert.ok(html.includes(opt.id), `Deve conter opção ${opt.id}`);
  }
});
