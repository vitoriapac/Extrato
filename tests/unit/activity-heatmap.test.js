import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildActivityCalendarHeatmapVisual,
  buildActivityHoursHeatmapVisual,
  getMondayFirstWeekday,
} from '../../src/domain/analytics/activity-heatmap-models.js';
import { renderActivityHeatmap } from '../../src/ui/primitives/charts/charts.js';

test('getMondayFirstWeekday normaliza Segunda = 0 a Domingo = 6', () => {
  // 2026-10-26 é Segunda-feira
  const seg = new Date('2026-10-26T12:00:00');
  assert.equal(getMondayFirstWeekday(seg), 0);

  // 2026-10-28 é Quarta-feira
  const qua = new Date('2026-10-28T12:00:00');
  assert.equal(getMondayFirstWeekday(qua), 2);

  // 2026-11-01 é Domingo
  const dom = new Date('2026-11-01T12:00:00');
  assert.equal(getMondayFirstWeekday(dom), 6);
});

test('buildActivityCalendarHeatmapVisual lida com lista vazia graciosamente', () => {
  const visual = buildActivityCalendarHeatmapVisual({ cells: [] });
  assert.equal(visual.weeksCount, 0);
  assert.equal(visual.days.length, 0);
  assert.equal(visual.activeDaysCount, 0);
  assert.equal(visual.totalDaysCount, 0);
  assert.equal(visual.weekdayLabels.length, 3);
  assert.deepEqual(
    visual.weekdayLabels.map(l => l.label),
    ['Seg', 'Qua', 'Sex']
  );
});

test('buildActivityCalendarHeatmapVisual gera semanas, meses e níveis de 0 a 4', () => {
  const cells = [
    { date: '2026-10-19', value: 0, level: 0 }, // Seg
    { date: '2026-10-20', value: 1800, level: 1 }, // Ter
    { date: '2026-10-21', value: 3600, level: 2 }, // Qua
    { date: '2026-10-22', value: 7200, level: 3 }, // Qui
    { date: '2026-10-23', value: 14400, level: 4 }, // Sex
    { date: '2026-10-24', value: 0, level: 0 }, // Sab
    { date: '2026-10-25', value: 0, level: 0 }, // Dom
    { date: '2026-10-26', value: 3600, level: 2 }, // Seg (semana seguinte)
  ];

  const visual = buildActivityCalendarHeatmapVisual({
    cells,
    tooltipForSummary: s => `${s.date}: ${s.value}s`,
  });

  assert.equal(visual.days.length, 8);
  assert.equal(visual.activeDaysCount, 5);
  assert.equal(visual.totalDaysCount, 8);
  assert.ok(visual.weeksCount >= 2);

  // Verifica posicionamento da segunda semana
  const dayOct26 = visual.days.find(d => d.date === '2026-10-26');
  assert.ok(dayOct26);
  assert.equal(dayOct26.dayOfWeek, 0); // Segunda
  assert.equal(dayOct26.weekIndex, 1);
  assert.equal(dayOct26.level, 2);
  assert.match(dayOct26.tooltip, /2026-10-26: 3600s/);

  // Rótulo de Outubro
  assert.ok(visual.monthLabels.some(m => m.label === 'Out'));
});

test('buildActivityHoursHeatmapVisual gera matriz 7x24 e identifica horários de pico', () => {
  const sessions = [
    // Segunda-feira às 14h: 60 minutos
    { startedAt: '2026-10-26T14:10:00', durationSeconds: 3600 },
    // Segunda-feira às 14h: mais 30 minutos (mesmo bloco)
    { startedAt: '2026-10-26T14:45:00', durationSeconds: 1800 },
    // Quarta-feira às 09h: 90 minutos
    { startedAt: '2026-10-28T09:00:00', durationSeconds: 5400 },
    // Sexta-feira às 20h: 120 minutos
    { startedAt: '2026-10-30T20:00:00', durationSeconds: 7200 },
  ];

  const visual = buildActivityHoursHeatmapVisual({ sessions });

  assert.equal(visual.rows.length, 7);
  assert.equal(visual.hourLabels.length, 6); // 00h, 04h, 08h, 12h, 16h, 20h
  assert.equal(visual.totalStudyMinutes, 300); // 90 + 90 + 120 = 300 min (5h)

  // Segunda-feira (índice 0), hora 14
  const monRow = visual.rows[0];
  assert.equal(monRow.weekdayName, 'Seg');
  const cell14 = monRow.cells.find(c => c.hour === 14);
  assert.ok(cell14);
  assert.equal(cell14.minutes, 90);
  assert.equal(cell14.sessionsCount, 2);

  // Pico máximo foi Sexta-feira às 20h (120 minutos)
  assert.equal(visual.peakHour, 20);
  assert.equal(visual.peakWeekday, 'Sexta-feira');
  assert.equal(visual.maxMinutes, 120);

  // A célula de 120 min deve ter level 4 (pico máximo)
  const friRow = visual.rows[4];
  const cell20 = friRow.cells.find(c => c.hour === 20);
  assert.ok(cell20);
  assert.equal(cell20.level, 4);
});

test('renderActivityHeatmap renderiza o modo calendário contínuo com acessibilidade', () => {
  const cells = [
    { date: '2026-10-26', value: 3600, level: 3, selected: true },
    { date: '2026-10-27', value: 1800, level: 1 },
  ];
  const calendarVisual = buildActivityCalendarHeatmapVisual({
    cells,
    tooltipForSummary: s => `${s.date}: atividade`,
  });

  const html = renderActivityHeatmap({
    mode: 'calendar',
    calendarVisual,
    activityStreak: 7,
    goalStreak: 5,
    selectedDate: '2026-10-26',
    selectedTooltip: '26 de Outubro: 1h de estudo',
  });

  // Estrutura geral
  assert.match(html, /activity-heatmap-container/);
  assert.match(html, /role="region"/);
  assert.match(html, /role="group"/);
  assert.match(html, /aria-label="Visualização do heatmap"/);

  // Modos de visualização
  assert.match(html, /Calendário contínuo/);
  assert.match(html, /Horários do dia \(24h\)/);
  assert.match(html, /data-delegated-click="setHeatmapMode\('hours'\)"/);

  // Streaks
  assert.match(html, /Atividade:.*7 dias/);
  assert.match(html, /Meta:.*5 dias/);

  // Célula selecionada e legenda
  assert.match(html, /data-delegated-click="selectHeatmapDay\('2026-10-26'\)"/);
  assert.match(html, /selected/);
  assert.match(html, /heat-3/);
  assert.match(html, /Menos/);
  assert.match(html, /Mais/);

  // Detalhe da seleção
  assert.match(html, /26 de Outubro: 1h de estudo/);
  assert.match(html, /data-delegated-click="viewSelectedHeatmapSessions\(\)"/);
});

test('renderActivityHeatmap renderiza o modo horários 24h com cards de insights', () => {
  const sessions = [
    { startedAt: '2026-10-26T14:00:00', durationSeconds: 7200 },
  ];
  const hoursVisual = buildActivityHoursHeatmapVisual({ sessions });

  const html = renderActivityHeatmap({
    mode: 'hours',
    hoursVisual,
  });

  // Cards de insights
  assert.match(html, /Horário de Maior Foco/);
  assert.match(html, /14:00/);
  assert.match(html, /Dia Mais Produtivo/);
  assert.match(html, /Segunda-feira/);
  assert.match(html, /Tempo Total Mapeado/);
  assert.match(html, /2h/);

  // Grade 7 x 24
  assert.match(html, /grid-cols-24/);
  assert.match(html, /Seg/);
  assert.match(html, /00h/);
  assert.match(html, /20h/);
});

test('renderActivityHeatmap mantém uma única parada de Tab na grade (roving tabindex)', () => {
  const calendarVisual = buildActivityCalendarHeatmapVisual({
    cells: [
      { date: '2026-10-25', value: 0, level: 0 },
      { date: '2026-10-26', value: 3600, level: 3, selected: true },
      { date: '2026-10-27', value: 1800, level: 1 },
    ],
    tooltipForSummary: s => `${s.date}: atividade`,
  });
  const html = renderActivityHeatmap({ mode: 'calendar', calendarVisual });

  assert.equal((html.match(/data-heatmap-date=/g) || []).length, 3);
  assert.equal((html.match(/tabindex="0"[^>]*data-heatmap-date|data-heatmap-date[^>]*tabindex="0"/gi) || []).length, 1);
  assert.match(html, /tabindex="0"[^>]*data-heatmap-date="2026-10-26"|data-heatmap-date="2026-10-26"[^>]*tabindex="0"/i);
});

test('renderActivityHeatmap com controls traz título, período e filtros dentro do card', () => {
  const calendarVisual = buildActivityCalendarHeatmapVisual({
    cells: [{ date: '2026-10-26', value: 3600, level: 3 }],
    tooltipForSummary: s => `${s.date}: atividade`,
  });
  const controls = { subjects: [{ id: 's1', name: 'Português <b>' }], subjectId: '', weeks: 52, onlyActiveDays: false };
  const html = renderActivityHeatmap({ mode: 'calendar', calendarVisual, controls });

  assert.match(html, /<h3[^>]*>Consistência de estudos<\/h3>/);
  assert.match(html, /aria-label="Período do heatmap"/);
  assert.match(html, /<option value="52" selected[^>]*>Últimas 52 semanas/);
  assert.match(html, /Todo o período/);
  assert.match(html, /Filtros do mapa<\/summary>/);
  assert.doesNotMatch(html, /<details[^>]*\sopen/);
  assert.match(html, /Português &lt;b>/);

  const active = renderActivityHeatmap({ mode: 'calendar', calendarVisual, metric: 'questions', controls });
  assert.match(active, /<details[^>]*\sopen/);
  assert.match(active, /Filtros do mapa \(ativos\)/);

  assert.doesNotMatch(renderActivityHeatmap({ mode: 'calendar', calendarVisual }), /Consistência de estudos|Filtros do mapa/);
});

test('renderActivityHeatmap resume o período: dias ativos, maior sequência e dia mais ativo', () => {
  // 2026-10-26 é segunda: ativos seg, ter, qua (sequência 3), pausa na quinta, ativo na sexta e na segunda seguinte.
  const cells = /** @type {Array<[string, number]>} */ ([
    ['2026-10-26', 3], ['2026-10-27', 1], ['2026-10-28', 2], ['2026-10-29', 0], ['2026-10-30', 4],
    ['2026-10-31', 0], ['2026-11-01', 0], ['2026-11-02', 2],
  ]).map(([date, level]) => ({ date, value: level * 1800, level }));
  const calendarVisual = buildActivityCalendarHeatmapVisual({ cells, tooltipForSummary: s => s.date });
  const html = renderActivityHeatmap({ mode: 'calendar', calendarVisual });

  assert.match(html, /Dias com atividade<\/dt><dd[^>]*>5 de 8<\/dd>/);
  assert.match(html, /Maior sequência no período<\/dt><dd[^>]*>3 dias<\/dd>/);
  assert.match(html, /Dia da semana mais ativo<\/dt><dd[^>]*>Segunda<\/dd>/);

  const empty = buildActivityCalendarHeatmapVisual({ cells: [{ date: '2026-10-26', value: 0, level: 0 }], tooltipForSummary: s => s.date });
  assert.doesNotMatch(renderActivityHeatmap({ mode: 'calendar', calendarVisual: empty, hasActivity: false }), /heatmap-insights/);
});
