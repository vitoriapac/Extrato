import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWeeklyPerformanceBrief } from '../../src/application/performance/build-weekly-performance-brief.js';
import { renderWeeklyPerformanceBriefCard } from '../../src/ui/performance/weekly-performance-brief-renderer.js';

test('buildWeeklyPerformanceBrief — gera 3 parágrafos detalhados, 1 parágrafo curto e mini-gráfico em semana ativa', () => {
  const brief = buildWeeklyPerformanceBrief({
    today: '2026-11-07',
    subjects: [
      { id: 's1', name: 'Português' },
      { id: 's2', name: 'Direito Constitucional' },
    ],
    sessions: [
      { date: '2026-11-02', durationSeconds: 3600 },
      { date: '2026-11-03', durationSeconds: 5400 },
      { date: '2026-11-05', durationSeconds: 3600 },
      { date: '2026-11-06', durationSeconds: 5400 },
      // Semana anterior (2026-10-25 a 2026-10-31)
      { date: '2026-10-26', durationSeconds: 3600 },
      { date: '2026-10-28', durationSeconds: 3600 },
    ],
    dailyPlans: [
      { date: '2026-11-02', items: [{ plannedMinutes: 180 }] },
      { date: '2026-11-05', items: [{ plannedMinutes: 180 }] },
    ],
    questions: [
      { date: '2026-11-03', subjectId: 's1', resolved: 40, correct: 34 }, // 85%
      { date: '2026-11-06', subjectId: 's2', resolved: 30, correct: 16 }, // 53%
      // Semana anterior
      { date: '2026-10-27', subjectId: 's1', resolved: 50, correct: 33 }, // 66%
    ],
    reviews: [
      { date: '2026-11-04', status: 'Pendente' },
      { date: '2026-11-05', status: 'Pendente' },
    ],
    simulations: [{ date: '2026-11-07', title: 'Simulado 1' }],
  });

  assert.equal(brief.periodLabel, '01/11/2026 a 07/11/2026');
  assert.equal(brief.hasActivity, true);
  assert.equal(brief.current.studiedMinutes, 300); // 5h
  assert.equal(brief.previous.studiedMinutes, 120); // 2h
  assert.equal(brief.current.activeDays, 5);
  assert.equal(brief.current.resolved, 70);
  assert.equal(brief.current.accuracy, 71);
  assert.equal(brief.previous.accuracy, 66);
  assert.equal(brief.bestSubject?.name, 'Português');
  assert.equal(brief.weakestSubject?.name, 'Direito Constitucional');
  assert.equal(brief.overdueReviews, 2);

  // 3 parágrafos para a aba Desempenho
  assert.equal(brief.detailedParagraphs.length, 3);
  assert.match(brief.detailedParagraphs[0], /5 dias ativos dos últimos 7 dias/);
  assert.match(brief.detailedParagraphs[0], /5h/);
  assert.match(brief.detailedParagraphs[1], /70 questões/);
  assert.match(brief.detailedParagraphs[1], /Português/);
  assert.match(brief.detailedParagraphs[1], /Direito Constitucional/);
  assert.match(brief.detailedParagraphs[2], /Disciplinas|Questões & Simulados/);
  assert.match(brief.detailedParagraphs[2], /Agenda/);

  // 1 parágrafo curto para a aba Visão Geral (Dashboard)
  assert.match(brief.shortParagraph, /Nos últimos 7 dias, você estudou em 5 dias/);
  assert.match(brief.shortParagraph, /Direito Constitucional/);
  // Tempo, acerto e plano ficam no comparativo visual, não no texto.
  assert.doesNotMatch(brief.shortParagraph, /5h|% do tempo planejado|semana passada/);

  // Mini-gráfico comparativo
  assert.equal(brief.chartMetrics.length, 3);
  assert.equal(brief.chartMetrics[0].label, 'Tempo de estudo');
  assert.equal(brief.chartMetrics[0].trend, 'up');
  assert.equal(brief.chartMetrics[1].label, 'Questões feitas');
  assert.equal(brief.chartMetrics[1].trend, 'up');
  assert.equal(brief.chartMetrics[2].label, 'Taxa de acerto');
  assert.equal(brief.chartMetrics[2].trend, 'up');
  // Aderência ao plano (Visão geral): 5h de 6h planejadas; sem plano na semana anterior.
  assert.equal(brief.adherenceMetric.label, 'Aderência ao plano');
  assert.equal(brief.adherenceMetric.currentFormatted, '83%');
  assert.equal(brief.adherenceMetric.deltaFormatted, 'Sem plano na semana anterior');
  assert.equal(brief.adherenceMetric.trend, 'stable');

  // Atalhos híbridos (seção interna + outras abas)
  assert.ok(brief.links.some(l => l.kind === 'section' && l.target === 'subjects'));
  assert.ok(brief.links.some(l => l.kind === 'tab' && l.target === 'questoes'));
  assert.ok(brief.links.some(l => l.kind === 'tab' && l.target === 'agenda'));
});

test('buildWeeklyPerformanceBrief e renderWeeklyPerformanceBriefCard — estado sem atividade nos últimos 7 dias', () => {
  const brief = buildWeeklyPerformanceBrief({
    today: '2026-11-07',
    questions: [],
    sessions: [],
    dailyPlans: [],
    reviews: [],
  });

  assert.equal(brief.hasActivity, false);
  assert.equal(brief.detailedParagraphs.length, 3);
  assert.match(brief.detailedParagraphs[0], /ainda não registrou horas de estudo nem questões/);
  assert.match(brief.shortParagraph, /Nos últimos 7 dias você ainda não registrou/);

  const html = renderWeeklyPerformanceBriefCard(brief);
  assert.match(html, /Seu resumo da última semana/);
  assert.match(html, /Para manter o resumo útil/);
  // O comparativo visual da semana mora em Início e não se repete aqui.
  assert.doesNotMatch(html, /Últimos 7 dias × semana anterior/);
  assert.match(html, /data-performance-open="hoje"/);
  assert.doesNotMatch(html, /\p{Extended_Pictographic}/u);
});
