import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { TodayExecutionSummary } from '../../src/ui/tabs/today/TodayExecutionSummary.js';
import { TodayAgendaSections } from '../../src/ui/tabs/today/TodayAgendaSections.js';
import { TodayGoalsCard } from '../../src/ui/tabs/today/TodayGoalsCard.js';
import {
  TodayWeeklyRhythmCard,
  renderTodayWeeklyRhythmHtml,
} from '../../src/ui/tabs/today/TodayWeeklyRhythmCard.js';
import { createTodayTabController } from '../../src/ui/tabs/today/today-tab-controller.js';

test('TodayExecutionSummary Preact Component — renderiza métricas e anel de progresso', () => {
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
  assert.match(html, /<strong>45m de 1h 30m<\/strong>/);
  assert.match(html, /class="chart-ring chart-ring--ok"[^>]*aria-label="Progresso do plano de hoje: 50 de 100"/);
  assert.doesNotMatch(html, /<progress/);
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
  // No plan means no ring at all, never an unexplained empty one.
  assert.doesNotMatch(html, /chart-ring/);
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

test('TodayExecutionSummary Preact Component — renderiza barra empilhada de tempo quando há minutos informados', () => {
  const html = render(
    h(TodayExecutionSummary, {
      availableMinutesFormatted: '2h',
      plannedMinutesFormatted: '1h 30m',
      executedMinutesFormatted: '45m',
      dateFormatted: '16 de março de 2026',
      progressPercent: 50,
      availableMinutes: 120,
      plannedMinutes: 90,
      executedMinutes: 45,
    })
  );

  assert.match(html, /chart-stacked/);
  assert.match(html, /today-execution-budget-track/);
  assert.match(html, /Executado/);
  assert.match(html, /A realizar/);
  assert.match(html, /Livre/);
});

test('TodayGoalsCard Preact Component — renderiza metas diárias com BulletBars e input de meta', () => {
  const html = render(
    h(TodayGoalsCard, {
      topicosHoje: 2,
      metaTopicosHoje: 3,
      questoesHoje: 25,
      metaQuestoesHoje: 50,
      revisoesConcluidasHoje: 4,
      totalRevisoesHoje: 4,
      tempoHojeSegundos: 5400,
      tempoHojeFormatado: '1h 30m',
      metaHorasHoje: 3,
      metaHorasFormatado: '3h',
      pctTempo: 50,
      todayDayOfWeek: 2,
    })
  );

  assert.match(html, /Tópicos concluídos hoje/);
  assert.match(html, /2 <span>\/ 3<\/span>/);
  assert.match(html, /Questões resolvidas hoje/);
  assert.match(html, /25 <span>\/ 50<\/span>/);
  assert.match(html, /Revisões de hoje concluídas/);
  assert.match(html, /4 <span>\/ 4<\/span>/);
  assert.match(html, /Tempo estudado hoje/);
  assert.match(html, /1h 30m/);
  assert.match(html, /de 3h · 50%/);
  assert.match(html, /updateMetaHoursDay\(2,this\.value\)/);
  assert.match(html, /chart-bullet/);
});

test('createTodayTabController — renderTodayGoalsHtml gera marcação acessível', () => {
  const controller = createTodayTabController({
    formatPlanMinutes: mins => `${mins}m`,
    formatDatePt: () => '16/03/2026',
    formatDuration: s => `${Math.floor(s / 60)}m`,
    formatHoras: h => `${h}h`,
  });

  const goalsHtml = controller.renderTodayGoalsHtml({
    topicosHoje: 1,
    metaTopicosHoje: 2,
    questoesHoje: 10,
    metaQuestoesHoje: 20,
    revisoesConcluidasHoje: 0,
    totalRevisoesHoje: 2,
    tempoHojeSegundos: 1800,
    tempoHojeFormatado: '30m',
    metaHorasHoje: 1,
    metaHorasFormatado: '1h',
    pctTempo: 50,
    todayDayOfWeek: 1,
  });

  assert.match(goalsHtml, /metas-hoje-grid/);
  assert.match(goalsHtml, /30m/);
  assert.match(goalsHtml, /de 1h · 50%/);
  assert.match(goalsHtml, /chart-bullet/);
});

test('TodayWeeklyRhythmCard Preact Component — renderiza gráfico de colunas para os 7 dias', () => {
  const days = [
    { dayName: 'Seg', dateISO: '2026-11-02', studiedMinutes: 120, studiedFormatted: '2h', isToday: false, isPast: true },
    { dayName: 'Ter', dateISO: '2026-11-03', studiedMinutes: 90, studiedFormatted: '1h 30m', isToday: true, isPast: false },
    { dayName: 'Qua', dateISO: '2026-11-04', studiedMinutes: 0, studiedFormatted: '0m', isToday: false, isPast: false },
    { dayName: 'Qui', dateISO: '2026-11-05', studiedMinutes: 0, studiedFormatted: '0m', isToday: false, isPast: false },
    { dayName: 'Sex', dateISO: '2026-11-06', studiedMinutes: 0, studiedFormatted: '0m', isToday: false, isPast: false },
    { dayName: 'Sáb', dateISO: '2026-11-07', studiedMinutes: 0, studiedFormatted: '0m', isToday: false, isPast: false },
    { dayName: 'Dom', dateISO: '2026-11-08', studiedMinutes: 0, studiedFormatted: '0m', isToday: false, isPast: false },
  ];

  const html = renderTodayWeeklyRhythmHtml({
    days,
    dailyTargetMinutes: 90,
    dailyTargetFormatted: '1h 30m',
    totalWeekMinutes: 210,
    totalWeekFormatted: '3h 30m',
    activeDaysCount: 2,
  });

  assert.match(html, /Ritmo semanal/);
  assert.match(html, /Esforço na semana/);
  assert.match(html, /2 de 7 dias/);
  assert.match(html, /3h 30m total/);
  assert.match(html, /chart-columns/);
  assert.match(html, /plan-execution-axis/);
  assert.match(html, /font-bold text-brand/); // today highlighted
});
