import test from 'node:test';
import assert from 'node:assert/strict';
import { renderDecisionHistory } from '../../src/ui/renderers/studytrack32-renderer.ts';
import { renderAdherenceCloseHistory } from '../../src/ui/renderers/weekly-adherence-renderer.ts';

const esc = value => String(value ?? '');
const item = n => ({
  subjectName: `Disciplina ${n}`,
  topicName: `Tópico ${n}`,
  strategyLabel: 'Estratégia',
  reasons: [],
  outcomeLabel: 'Sem resultado',
  explanationSnapshot: null,
});

const count = (html, pattern) => (html.match(pattern) || []).length;

test('histórico de decisões renderiza todas as decisões, sem template de "Mostrar mais"', () => {
  const html = renderDecisionHistory(
    { items: Array.from({ length: 12 }, (_, i) => item(i)) },
    { escapeHtml: esc }
  );
  assert.equal(count(html, /<article/g), 12);
  assert.doesNotMatch(html, /data-lazy-more|Mostrar mais/);
});

test('retratos de aderência: todas as dobras, corpo só ao abrir, sem "Mostrar mais"', () => {
  const row = n => ({
    period: {
      start: `2026-09-${String(n).padStart(2, '0')}`,
      end: `2026-09-${String(n + 6).padStart(2, '0')}`,
    },
    revision: 1,
    adherence: { assessment: { label: 'Execução alinhada' }, model: { summary: {}, priority: {} } },
  });
  const html = renderAdherenceCloseHistory(Array.from({ length: 9 }, (_, i) => row(i + 1)));
  const outsideTemplates = html.replace(/<template data-lazy>.*?<\/template>/gs, '');
  assert.equal(count(outsideTemplates, /<details>/g), 9);
  assert.equal(count(html, /<summary>[^<]*<\/summary><template data-lazy>/g), 9);
  assert.doesNotMatch(html, /data-lazy-more|Mostrar mais/);
});

test('histórico de prioridades: tópicos em páginas de 10 e observações sem botão escrito à mão', async () => {
  const { renderPriorityHistory } =
    await import('../../src/ui/renderers/strategic-history-renderer.ts');
  const point = n => ({
    date: `2026-09-${String(n + 1).padStart(2, '0')}`,
    classification: 'Atenção',
    profile: { score: 50 },
    change: { label: 'Primeiro registro', reasons: [] },
    current: n === 0,
  });
  const rows = Array.from({ length: 25 }, (_, i) => ({
    topicId: `t${i}`,
    subjectName: 'Disciplina',
    topicName: `Tópico ${i}`,
    state: 'Primeiro registro',
    history: Array.from({ length: 8 }, (_, n) => point(n)),
  }));
  const model = { subjects: [], rows };
  const html = renderPriorityHistory(model, { page: 3, expandedTopics: new Set(['t20']) });
  assert.equal(count(html, /class="priority-history-topic"/g), 5);
  assert.match(html, /Exibindo 21–25 de 25 tópicos/);
  assert.match(html, /goToListPage\('priorityHistory',2\)/);
  // Observações do tópico aberto: todas no DOM; o botão é do montador de listas.
  assert.equal(count(html, /<li><time/g), 8);
  assert.doesNotMatch(
    html,
    /Mostrar mais|togglePriorityTopicObservations|showMorePriorityHistoryTopics/
  );
  // Página fora do intervalo cai na última.
  assert.match(renderPriorityHistory(model, { page: 99 }), /Exibindo 21–25 de 25 tópicos/);
});

test('replanejamento pós-simulado: o título diz de qual replanejamento se trata em cada estado', async () => {
  const { renderPostSimulationReplan } = await import('../../src/ui/renderers/studytrack32-renderer.js');
  const opts = { escapeHtml: String };
  assert.match(
    renderPostSimulationReplan({ state: 'insufficient_capacity', message: 'x' }, opts),
    /Replanejamento pós-simulado indisponível/
  );
  assert.match(
    renderPostSimulationReplan({ state: 'balanced', message: 'x' }, opts),
    /Sem replanejamento pós-simulado necessário/
  );
});
