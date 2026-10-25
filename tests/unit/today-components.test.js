import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { TodayExecutionSummary } from '../../src/ui/tabs/today/TodayExecutionSummary.js';
import { TodayAgendaSections } from '../../src/ui/tabs/today/TodayAgendaSections.js';
import { createTodayTabController } from '../../src/ui/tabs/today/today-tab-controller.js';

test('TodayExecutionSummary Preact Component — renderiza métricas e barra de progresso', () => {
  const html = render(
    h(TodayExecutionSummary, {
      availableMinutesFormatted: '2h',
      plannedMinutesFormatted: '1h 30m',
      executedMinutesFormatted: '45m',
      dateFormatted: '16 de março de 2026',
      progressPercent: 50,
    })
  );

  assert.match(html, /2h/);
  assert.match(html, /Disponível hoje/);
  assert.match(html, /1h 30m/);
  assert.match(html, /Planejado/);
  assert.match(html, /45m/);
  assert.match(html, /Executado/);
  assert.match(html, /50% do plano executado/);
  assert.match(html, /<progress max="100" value="50"/);
});

test('TodayExecutionSummary Preact Component — exibe estado sem plano diário', () => {
  const html = render(
    h(TodayExecutionSummary, {
      availableMinutesFormatted: '0m',
      plannedMinutesFormatted: '0m',
      executedMinutesFormatted: '0m',
      dateFormatted: '16 de março de 2026',
      progressPercent: null,
    })
  );

  assert.match(html, /Plano diário ainda não montado/);
  assert.match(
    html,
    /<progress max="100" value="0" aria-label="Plano diário ainda não montado" hidden/
  );
});

test('TodayAgendaSections Preact Component — renderiza grade de tarefas e listas', () => {
  const html = render(
    h(TodayAgendaSections, {
      tasks: [
        { id: 't1', title: 'Leitura de Constitucional', subtitle: 'Artigo 5º', badge: 'Alta' },
      ],
      overdueReviews: [],
      plannedSimulations: [],
      goalsHtml: '<div>Meta: 20 questões</div>',
    })
  );

  assert.match(html, /Leitura de Constitucional/);
  assert.match(html, /Artigo 5º/);
  assert.match(html, /Alta/);
  assert.match(html, /Nenhuma revisão atrasada pendente/);
  assert.match(html, /Nenhum simulado planejado para hoje/);
  assert.match(html, /Meta: 20 questões/);
});

test('createTodayTabController — coordena a renderização do resumo diário', () => {
  const controller = createTodayTabController({
    formatPlanMinutes: mins => `${mins}m`,
    formatDatePt: () => '16/03/2026',
  });

  const summaryHtml = controller.renderExecutionSummaryHtml({
    availableMinutes: 120,
    plannedMinutes: 90,
    executedMinutes: 45,
    date: '2026-03-16',
    progress: 50,
  });

  assert.match(summaryHtml, /120m/);
  assert.match(summaryHtml, /90m/);
  assert.match(summaryHtml, /45m/);
  assert.match(summaryHtml, /50%/);
});
