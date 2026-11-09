import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CAREER_BENCHMARKS,
  detectCareerCluster,
  aggregateRecentActivity,
  calculateCareerBenchmarkComparison,
} from '../../src/domain/analytics/career-benchmarks.js';

test('CAREER_BENCHMARKS — contém os 5 agrupamentos principais com valores coerentes', () => {
  const keys = ['fiscal-controle', 'policial', 'tribunais-juridica', 'bancaria-administrativa', 'geral'];
  for (const k of keys) {
    const b = CAREER_BENCHMARKS[k];
    assert.ok(b, `Carreira ${k} deve existir`);
    assert.ok(b.weeklyHours.minimum > 0);
    assert.ok(b.weeklyHours.competitiveMin > b.weeklyHours.minimum);
    assert.ok(b.weeklyHours.competitiveMax > b.weeklyHours.competitiveMin);
    assert.ok(b.weeklyHours.advanced > b.weeklyHours.competitiveMax);
    assert.ok(b.weeklyQuestions.minimum > 0);
    assert.ok(b.targetAccuracy.finalStretch > b.targetAccuracy.construction);
    assert.equal(
      b.targetMix.theoryPercent + b.targetMix.questionsPercent + b.targetMix.reviewPercent,
      100
    );
  }
});

test('detectCareerCluster — infere carreira com base em tags, blueprints ou nomes de disciplinas', () => {
  assert.equal(
    detectCareerCluster({ examBlueprint: { activeExamTags: ['bb'] } }),
    'bancaria-administrativa'
  );
  assert.equal(
    detectCareerCluster({ examBlueprint: { activeExamTags: ['caixa'] } }),
    'bancaria-administrativa'
  );
  assert.equal(
    detectCareerCluster({ presetId: 'pf-agente', examBlueprint: { customTitle: 'Polícia Federal' } }),
    'policial'
  );
  assert.equal(
    detectCareerCluster({ subjects: [{ name: 'Auditoria Fiscal' }, { name: 'Direito Tributário' }] }),
    'fiscal-controle'
  );
  assert.equal(
    detectCareerCluster({ subjects: [{ name: 'Direito Processual do Trabalho' }, { name: 'Regimento Interno TRT' }] }),
    'tribunais-juridica'
  );
  assert.equal(
    detectCareerCluster({ subjects: [{ name: 'História Geral' }, { name: 'Geografia' }] }),
    'geral'
  );
});

test('aggregateRecentActivity — calcula horas, questões, precisão e mix de tempo', () => {
  const today = '2026-11-09';
  const sessions = [
    { date: '2026-11-09', durationMinutes: 120, type: 'study' },
    { date: '2026-11-08', durationMinutes: 90, type: 'questions' },
    { date: '2026-11-07', durationMinutes: 60, type: 'review' },
    // Sessão fora da janela de 7 dias
    { date: '2026-10-15', durationMinutes: 180, type: 'study' },
  ];

  const questions = [
    { date: '2026-11-09', total: 40, correct: 32 },
    { date: '2026-11-08', total: 50, correct: 40 },
    // Questão fora da janela de 7 dias
    { date: '2026-10-15', total: 100, correct: 90 },
  ];

  const agg = aggregateRecentActivity(sessions, questions, { todayISO: today, daysWindow: 7 });

  // 120 + 90 + 60 = 270 min = 4.5h
  assert.equal(agg.studiedHours, 4.5);
  // 40 + 50 = 90 questões
  assert.equal(agg.resolvedQuestions, 90);
  // (32 + 40) / (40 + 50) = 72 / 90 = 80%
  assert.equal(agg.accuracyPercent, 80);
  assert.equal(agg.theoryMinutes, 120);
  assert.equal(agg.questionsMinutes, 90);
  assert.equal(agg.reviewMinutes, 60);
});

test('aggregateRecentActivity — lê o formato real do app (durationSeconds e resolved)', () => {
  const agg = aggregateRecentActivity(
    [{ date: '2026-11-09', durationSeconds: 3600, type: 'study' }],
    [{ date: '2026-11-09', resolved: 20, correct: 15 }],
    { todayISO: '2026-11-09', daysWindow: 7 }
  );
  assert.equal(agg.studiedHours, 1);
  assert.equal(agg.resolvedQuestions, 20);
  assert.equal(agg.accuracyPercent, 75);
});

test('calculateCareerBenchmarkComparison — classifica métricas frente à carreira bancária', () => {
  const aggregates = {
    studiedHours: 20, // Faixa competitiva para bancária (18-24h)
    resolvedQuestions: 170, // Faixa competitiva para bancária (160-220q)
    accuracyPercent: 82, // Faixa competitiva/reta final (78-84%)
    theoryMinutes: 400,
    questionsMinutes: 600,
    reviewMinutes: 200,
  };

  const comparison = calculateCareerBenchmarkComparison(aggregates, 'bancaria-administrativa');

  assert.equal(comparison.career.id, 'bancaria-administrativa');
  assert.equal(comparison.weeklyHours.status, 'competitive');
  assert.equal(comparison.weeklyQuestions.status, 'competitive');
  assert.equal(comparison.accuracy.status, 'competitive');
  assert.equal(comparison.overallStatus, 'competitive');
  assert.ok(comparison.overallLabel.includes('Competitivo'));
  assert.ok(comparison.guidanceNote.length > 20);
  assert.ok(Object.isFrozen(comparison));
});
