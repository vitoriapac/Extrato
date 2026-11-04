import test from 'node:test';
import assert from 'node:assert/strict';
import { renderReviewRead } from '../../src/ui/renderers/reviews-renderer.js';
import { renderCalendarRead } from '../../src/ui/renderers/calendar-renderer.js';

const escape = value => String(value).replace(/"/g, '&quot;').replace(/</g, '&lt;');

test('Concluir e Editar de revisões nomeiam disciplina e tópico para leitores de tela', () => {
  const html = renderReviewRead({
    item: { id: 'r1', date: '2026-11-03', status: 'Pendente' },
    view: { date: '03/11', subject: 'Direito', topic: 'Atos "administrativos"', pending: true, difficulty: 'Média' },
    mobile: false,
    escapeHtml: escape,
    escapeAttr: escape,
    daysPill: '',
    difficultyClass: {},
    statusClass: {},
    ratingLabel: () => '',
    today: '2026-11-03',
  });
  assert.match(html, /aria-label="Concluir revisão: Direito, Atos &quot;administrativos&quot;">Concluir</);
  assert.match(html, /aria-label="Editar revisão: Direito, Atos &quot;administrativos&quot;">Editar</);
});

test('Concluir e Editar de tarefas de estudo nomeiam disciplina, tipo e data', () => {
  const html = renderCalendarRead({
    item: { id: 'c1', date: '2026-11-03', status: 'Pendente' },
    view: { date: '03/11', week: 'S1', subject: 'Português', reviewType: 'Revisão 24h', status: 'Pendente', pending: true },
    mobile: true,
    escapeHtml: escape,
    daysPill: '',
    statusClass: {},
    today: '2026-11-03',
  });
  assert.match(html, /aria-label="Concluir tarefa: Português, Revisão 24h, 03\/11">Concluir</);
  assert.match(html, /aria-label="Editar tarefa: Português, Revisão 24h, 03\/11">Editar</);
});
