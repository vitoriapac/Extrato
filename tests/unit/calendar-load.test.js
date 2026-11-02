import test from 'node:test';
import assert from 'node:assert/strict';
import { renderCalendarMonth } from '../../src/ui/renderers/calendar-renderer.js';

const event = (date, status = 'Pendente') => ({ date, status, subject: 'S', label: 'Revisão', origem: 'Agenda' });

test('calendário do mês: intensidade pelas revisões pendentes, com texto no nome do dia', () => {
  const { html } = renderCalendarMonth({
    month: new Date(2026, 9, 1),
    events: [
      event('2026-10-05'),
      event('2026-10-05'),
      event('2026-10-05'),
      event('2026-10-06'),
      event('2026-10-07', 'Concluído'),
    ],
    today: '2026-10-01',
    daysUntil: () => 1,
    escapeHtml: String,
    escapeAttr: String,
  });
  const day = n => html.match(new RegExp(`<div class="month-day[^"]*"[^>]*><div class="day-number">${n}(<span[^<]*</span>)?</div>`))[0];
  assert.match(day(5), /load-3/);
  assert.match(day(5), /3 revisões pendentes/);
  assert.match(day(6), /load-1/);
  assert.match(day(6), /\(1 revisão pendente\)/);
  // Completed reviews are not load.
  assert.match(day(7), /load-0/);
  assert.doesNotMatch(day(7), /pendente/);
  assert.match(html, /Fundo do dia: mais escuro, mais revisões pendentes/);
});
