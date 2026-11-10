import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPreparationReading } from '../../src/application/performance/build-preparation-reading.js';
import { renderPreparationReading } from '../../src/ui/performance/preparation-reading-renderer.js';

const week = (over = {}) => ({
  studiedMinutes: 380,
  plannedMinutes: 540,
  planFulfillmentPct: 70,
  ...over,
});
const action = (over = {}) => ({
  state: 'ACTION_OPTIONAL',
  action: { recommendationId: 'rec-1', suggestedMinutes: 40 },
  label: 'Revisar',
  topicName: 'Juros compostos',
  subjectName: 'Matemática',
  activePlanId: 'plan-1',
  currentAllocationMinutes: 40,
  weeklyPlannedMinutes: 120,
  ...over,
});

test('leitura da preparação: a ação é a de Hoje, com o mesmo ID, medida contra o plano', () => {
  const reading = buildPreparationReading({
    model: { readiness: { value: 46, availableFactors: ['coverage', 'mastery', 'retention'] } },
    weeklyBrief: { current: week(), overdueReviews: 2 },
    nextBestAction: action(),
  });
  assert.equal(reading.whatToDo.action.recommendationId, 'rec-1');
  assert.match(reading.whatToDo.action.planNote, /No plano da semana/);
  assert.match(reading.whatToDo.deficit, /Faltam/);
  assert.match(reading.howAmI.rhythm.text, /70% do tempo planejado/);
  assert.ok(reading.pulling.some(item => /revisões vencidas/.test(item.text)));
});

test('leitura da preparação: declara cada estado de evidência ausente', () => {
  const reading = buildPreparationReading({
    model: { current: { resolved: 12 } },
    nextBestAction: { state: 'INSUFFICIENT_EVIDENCE', reason: 'Registre sessões.' },
  });
  const text = reading.evidence.join(' ');
  assert.match(text, /Sem simulados comparáveis/);
  assert.match(text, /Amostra pequena/);
  assert.match(text, /Sem plano ativo/);
  assert.match(text, /Sem tempo planejado/);
  assert.equal(reading.whatToDo.action, null);
  assert.equal(reading.whatToDo.reason, 'Registre sessões.');
});

test('leitura da preparação: sem plano ativo a ação diz que não está medida contra o plano', () => {
  const reading = buildPreparationReading({ nextBestAction: action({ activePlanId: null }) });
  assert.match(reading.whatToDo.action.planNote, /Sem plano ativo/);
});

test('leitura da preparação: o render tem um botão sólido, três blocos e nenhum termo causal', () => {
  const reading = buildPreparationReading({
    model: { readiness: { value: 46, availableFactors: ['coverage', 'mastery', 'retention'] } },
    weeklyBrief: { current: week(), overdueReviews: 1 },
    nextBestAction: action(),
  });
  const html = renderPreparationReading(reading, { rangeLabel: 'Últimos 30 dias' });
  assert.match(html, /Como estou/);
  assert.match(html, /O que mais pesa/);
  assert.match(html, /O que fazer/);
  assert.equal((html.match(/class="btn small"/g) || []).length, 1);
  assert.doesNotMatch(html, /porque|garante|graças/i);
});
