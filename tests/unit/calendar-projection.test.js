import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeDailyCalendarLoad,
  expandRecurringCalendarItems,
  getAvailableMinutesForDate,
  getWeekDates,
  isCalendarItemOverdue,
  sortCalendarItemsForDay,
} from '../../src/domain/calendar/calendar-projection.ts';
import { buildCalendarIcs } from '../../src/domain/calendar/calendar-ics.ts';
import { buildUnifiedCalendarItems } from '../../src/application/calendar/build-unified-reviews.ts';
import { buildAgendaBuckets } from '../../src/application/reviews/build-agenda-buckets.ts';

test('isCalendarItemOverdue não marca eventos oficiais passados como atrasados', () => {
  assert.equal(
    isCalendarItemOverdue({ kind: 'event', status: 'Não iniciado', date: '2026-11-10' }, '2026-11-17'),
    false
  );
  assert.equal(
    isCalendarItemOverdue({ kind: 'task', status: 'Não iniciado', date: '2026-11-10' }, '2026-11-17'),
    true
  );
  assert.equal(
    isCalendarItemOverdue({ kind: 'essay', status: 'Cancelado', date: '2026-11-10' }, '2026-11-17'),
    false
  );
});

test('sortCalendarItemsForDay ordena itens com horário cronologicamente antes dos sem horário', () => {
  const sorted = sortCalendarItemsForDay([
    { title: 'Beta sem hora', subject: '', startTime: null },
    { title: 'Simulado tarde', subject: '', startTime: '14:00' },
    { title: 'Revisão manhã', subject: '', startTime: '08:30' },
    { title: 'Alfa sem hora', subject: '', startTime: null },
  ]);
  assert.deepEqual(
    sorted.map(x => x.title),
    ['Revisão manhã', 'Simulado tarde', 'Alfa sem hora', 'Beta sem hora']
  );
});

test('computeDailyCalendarLoad ignora eventos informativos e detecta conflitos de horário', () => {
  /** @type {import('../../src/domain/calendar/calendar-projection.ts').UnifiedCalendarItem[]} */
  const items = [
    {
      key: 'Calendário:1',
      id: '1',
      date: '2026-11-17',
      kind: 'mock_exam',
      title: 'Simulado',
      label: 'Simulado',
      status: 'Não iniciado',
      origem: 'Calendário',
      subjectId: null,
      subject: '',
      startTime: '09:00',
      endTime: '12:00',
      estimatedMinutes: 180,
      isEvent: false,
      isDraggable: true,
    },
    {
      key: 'Calendário:2',
      id: '2',
      date: '2026-11-17',
      kind: 'essay',
      title: 'Redação',
      label: 'Redação',
      status: 'Não iniciado',
      origem: 'Calendário',
      subjectId: null,
      subject: '',
      startTime: '11:00',
      endTime: '12:30',
      estimatedMinutes: 90,
      isEvent: false,
      isDraggable: true,
    },
    {
      key: 'Calendário:3',
      id: '3',
      date: '2026-11-17',
      kind: 'event',
      title: 'Publicação do edital',
      label: 'Publicação do edital',
      status: 'Não iniciado',
      origem: 'Calendário',
      subjectId: null,
      subject: '',
      startTime: '15:00',
      estimatedMinutes: 60,
      isEvent: true,
      isDraggable: true,
    },
  ];

  const load = computeDailyCalendarLoad(items, '2026-11-17');
  assert.equal(load.totalMinutes, 270);
  assert.equal(load.itemCount, 3);
  assert.equal(load.actionableCount, 2);
  assert.equal(load.conflicts.length, 1);
  assert.equal(load.conflicts[0].first.id, '1');
  assert.equal(load.conflicts[0].second.id, '2');
});

test('getWeekDates retorna 7 dias consecutivos de domingo a sábado em fuso local', () => {
  const week = getWeekDates('2026-11-17'); // terça-feira
  assert.deepEqual(week, [
    '2026-11-15',
    '2026-11-16',
    '2026-11-17',
    '2026-11-18',
    '2026-11-19',
    '2026-11-20',
    '2026-11-21',
  ]);
});

test('buildUnifiedCalendarItems evita duplicidade quando simulado está vinculado e preserva buckets', () => {
  const items = buildUnifiedCalendarItems({
    calendar: [
      {
        id: 'cal-1',
        date: '2026-11-20',
        kind: 'mock_exam',
        title: 'Simulado Nacional',
        status: 'Não iniciado',
        linkedSimulationId: 'sim-1',
      },
      {
        id: 'cal-2',
        date: '2026-11-10',
        kind: 'event',
        title: 'Prazo de inscrição',
        status: 'Não iniciado',
      },
    ],
    simulados: [
      { id: 'sim-1', nome: 'Simulado Nacional', date: '2026-11-20', correct: 0, total: 0 },
      { id: 'sim-2', nome: 'Simulado Extra', date: '2026-11-22', correct: 0, total: 0 },
    ],
    today: '2026-11-17',
  });

  assert.equal(items.filter(i => i.title === 'Simulado Nacional').length, 1);
  assert.equal(items.some(i => i.id === 'sim-2' && i.origem === 'Simulado'), true);

  const buckets = buildAgendaBuckets(items, '2026-11-17');
  assert.equal(buckets.overdue.total, 0); // evento passado não vira atrasado
  assert.equal(buckets.next7.total, 2); // cal-1 + sim-2
});

test('getAvailableMinutesForDate lê horasPorDia da semana e usa horasDiarias como fallback', () => {
  const metas = {
    horasDiarias: 2,
    horasPorDia: { '2': 3.5, '0': 1 },
  };
  assert.equal(getAvailableMinutesForDate(metas, '2026-11-17'), 210); // terça = 2
  assert.equal(getAvailableMinutesForDate(metas, '2026-11-15'), 60); // domingo = 0
  assert.equal(getAvailableMinutesForDate(metas, '2026-11-18'), 120); // quarta fallback
});

test('expandRecurringCalendarItems projeta ocorrências semanais sem mutar o array original', () => {
  /** @type {import('../../src/domain/calendar/calendar-projection.ts').UnifiedCalendarItem[]} */
  const base = [
    {
      key: 'Calendário:r1',
      id: 'r1',
      date: '2026-11-01',
      kind: 'essay',
      title: 'Redação semanal',
      label: 'Redação semanal',
      status: 'Não iniciado',
      origem: 'Calendário',
      subjectId: null,
      subject: '',
      recurrence: 'weekly',
      isEvent: false,
      isDraggable: true,
    },
  ];
  const expanded = expandRecurringCalendarItems(base, '2026-11-01', '2026-11-22');
  assert.equal(base.length, 1);
  assert.deepEqual(
    expanded.map(x => x.date),
    ['2026-11-01', '2026-11-08', '2026-11-15', '2026-11-22']
  );
  assert.equal(expanded[1].isRecurringInstance, true);
  assert.equal(expanded[1].isDraggable, false);
});

test('buildCalendarIcs gera VCALENDAR válido com eventos com horário e dia inteiro', () => {
  /** @type {import('../../src/domain/calendar/calendar-projection.ts').UnifiedCalendarItem[]} */
  const items = [
    {
      key: 'Calendário:1',
      id: '1',
      date: '2026-11-20',
      kind: 'event',
      title: 'Prova Oficial, Bloco A',
      label: 'Prova Oficial, Bloco A',
      status: 'Não iniciado',
      origem: 'Calendário',
      subjectId: null,
      subject: 'Direito',
      startTime: '08:00',
      endTime: '12:00',
      location: 'Escola Central',
      isEvent: true,
      isDraggable: true,
    },
    {
      key: 'Calendário:2',
      id: '2',
      date: '2026-11-21',
      kind: 'task',
      title: 'Revisar resumo',
      label: 'Revisar resumo',
      status: 'Não iniciado',
      origem: 'Calendário',
      subjectId: null,
      subject: '',
      isEvent: false,
      isDraggable: true,
    },
  ];
  const ics = buildCalendarIcs(items);
  assert.match(ics, /BEGIN:VCALENDAR/);
  assert.match(ics, /DTSTART:20261120T080000/);
  assert.match(ics, /DTEND:20261120T120000/);
  assert.match(ics, /SUMMARY:Prova Oficial\\, Bloco A/);
  assert.match(ics, /LOCATION:Escola Central/);
  assert.match(ics, /DTSTART;VALUE=DATE:20261121/);
  assert.match(ics, /DTEND;VALUE=DATE:20261122/);
  assert.match(ics, /END:VCALENDAR/);
});
