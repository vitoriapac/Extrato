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
  assert.match(reading.howAmI.rhythm.text, /volume de carga de 70%/);
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
  const html = renderPreparationReading(reading);
  assert.match(html, /Como estou/);
  assert.match(html, /O que mais pesa/);
  assert.match(html, /O que fazer/);
  assert.equal((html.match(/class="btn small"/g) || []).length, 1);
  assert.doesNotMatch(html, /porque|garante|graças/i);
});

test('o que mudou depois das recomendações: só mostra resultados medidos e não afirma causa', async () => {
  const { renderRecommendationFollowupSummary } =
    await import('../../src/ui/performance/preparation-reading-renderer.js');
  assert.equal(renderRecommendationFollowupSummary([]), '');
  assert.equal(
    renderRecommendationFollowupSummary([{ state: 'insufficient', topicName: 'X', action: 'Y' }]),
    ''
  );
  const html = renderRecommendationFollowupSummary([
    {
      state: 'positive',
      topicName: 'Juros compostos',
      action: 'Revisar',
      metrics: [{ label: 'Domínio', before: 41, after: 52 }],
    },
  ]);
  assert.match(html, /Juros compostos/);
  assert.match(html, /Domínio de 41 para 52/);
  assert.match(html, /não indica que a recomendação causou/);
  assert.doesNotMatch(html, /porque|graças a|garante/i);
});

test('leitura da preparação: a Prontidão traz barra e tendência, sem causa', () => {
  const readiness = { value: 46, availableFactors: ['coverage', 'mastery', 'retention'] };
  const pair = {
    current: { date: '2026-11-08', score: 53 },
    previous: { date: '2026-10-11', score: 56 },
  };
  const down = buildPreparationReading({
    model: { readiness, readinessDelta: -3, readinessPair: pair },
    weeklyBrief: { current: week() },
  });
  assert.equal(down.howAmI.readiness.verdict.state, 'down');
  const steady = buildPreparationReading({
    model: { readiness, readinessDelta: 1, readinessPair: pair },
  });
  assert.equal(steady.howAmI.readiness.verdict.state, 'steady');
  const up = buildPreparationReading({
    model: { readiness, readinessDelta: 4, readinessPair: pair },
  });
  assert.equal(up.howAmI.readiness.verdict.state, 'up');
  const none = buildPreparationReading({ model: { readiness, readinessDelta: null } });
  assert.equal(none.howAmI.readiness.verdict, null);
  const html = renderPreparationReading(down);
  assert.match(html, /performance-reading__bar/);
  assert.match(html, /aria-label="Prontidão 46 em uma escala de 0 a 100"/);
  assert.match(html, /Tendência: em queda frente ao período anterior/);
  assert.match(html, /data-window="sevenDays"[^>]*>7 dias</);
  assert.doesNotMatch(html, /porque|graças a|garante/i);
});

test('ação aparece com motivo e ressalvas antes dos controles e da análise detalhada', () => {
  const reading = buildPreparationReading({
    model: { readiness: { value: 46, availableFactors: ['coverage', 'mastery', 'retention'] } },
    nextBestAction: action({ reasons: ['Revisão prevista para hoje'], evidence: 'Baixa', currentAllocationMinutes: null }),
  });
  const html = renderPreparationReading(reading);
  assert.match(html, /Revisão prevista para hoje/);
  assert.ok(html.indexOf('O que fazer') < html.indexOf('O que mais pesa'));
  assert.ok(html.indexOf('No plano:') < html.indexOf('Abrir em Hoje'));
  assert.match(html, /Evidência:.*baixa/);
});

test('projeção mantém intervalo, confiança e limite juntos; conteúdo da ação é escapado', () => {
  const reading = buildPreparationReading({
    projection: { projection: { calibratedSimulationBand: { low: 69, high: 93 } }, confidence: { level: 'low' }, current: { targetScore: 80 } },
    nextBestAction: action({ topicName: '<script>conteúdo</script>', reasons: ['<img src=x>'] }),
  });
  const html = renderPreparationReading(reading);
  assert.match(html, /69% a 93%, confiança baixa/);
  assert.match(html, /Não é chance de aprovação/);
  assert.match(html, /data-window="history"/);
  assert.doesNotMatch(html, /<script>|<img src=x>/);
  assert.match(html, /&lt;script>/);
});
