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
  assert.doesNotMatch(html, /data-window="sevenDays"/);
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
  assert.match(html, /data-window="ninetyDays"/);
  assert.doesNotMatch(html, /<script>|<img src=x>/);
  assert.match(html, /&lt;script>/);
});

test('leitura da preparação: retrato fictício da demo é declarado; o real não', () => {
  const readiness = { value: 47, availableFactors: ['coverage', 'mastery', 'retention'] };
  const pairWith = id => ({
    current: { id, date: '2026-11-08', score: 56 },
    previous: { id: 'x', date: '2026-10-11', score: 55 },
  });
  const read = id =>
    buildPreparationReading({
      model: { readiness, readinessDelta: 1, readinessPair: pairWith(id) },
    }).howAmI.readiness.detail;
  assert.match(read('demo-readiness-3'), /retratos de fechamento são fictícios/);
  assert.doesNotMatch(read('readiness-3'), /fictícios/);
});

const gap = (id, over = {}) => ({
  topicId: id,
  topicName: `Tópico ${id}`,
  subjectId: 's1',
  subjectName: 'Informática',
  mastery: 40,
  examImpact: 90,
  improvementPotential: 60,
  effortEfficiency: 50,
  ...over,
});

test('"o que mais pesa" segue a fila do Diagnóstico (pontuação de prioridade) e leva a ele', () => {
  const reading = buildPreparationReading({
    candidates: [
      gap('a', { score: 50 }),
      gap('b', { score: 80 }),
      gap('c', { mastery: 90 }),
    ],
  });
  const texts = reading.pulling.map(item => item.text);
  assert.match(texts[0], /Tópico b/);
  assert.match(texts[1], /Tópico a/);
  assert.equal(texts.length, 2);
  assert.deepEqual(
    reading.pulling.map(item => item.link.target),
    ['diagnosis', 'diagnosis']
  );
});

test('"o que mais pesa" diz quando o tópico fraco está numa disciplina forte', () => {
  const read = subjectAccuracy =>
    buildPreparationReading({ candidates: [gap('a')], subjectAccuracy }).pulling[0].text;
  assert.match(
    read({ s1: { accuracy: 85, resolved: 120 } }),
    /Tópico fraco dentro de Informática, que tem 85% de precisão em questões \(todo o histórico\)\./
  );
  assert.doesNotMatch(read({ s1: { accuracy: 55, resolved: 120 } }), /dentro de Informática/);
  assert.doesNotMatch(read({ s1: { accuracy: 85, resolved: 10 } }), /dentro de Informática/);
});

test('"o que mais pesa" não cria um segundo critério de pior disciplina', () => {
  const reading = buildPreparationReading({
    weeklyBrief: { current: week(), weakestSubject: { id: 's9', name: 'Direito', accuracy: 30, resolved: 40 } },
  });
  assert.ok(!reading.pulling.some(item => /Direito/.test(item.text)));
});

test('uma fila só: Leitura e riscos da projeção seguem a mesma pontuação de prioridade', async () => {
  const { buildProjectionTopicRisks } = await import('../../src/application/projection/build-projection-topic-risks.js');
  const item = (id, score) => ({
    topicId: id,
    subjectId: 's1',
    topicName: id,
    mastery: 40,
    examImpact: 90,
    evidenceStrength: 0.8,
    score,
  });
  const candidates = [item('baixo', 10), item('alto', 90), item('meio', 50)];
  const risks = buildProjectionTopicRisks(candidates).map(risk => risk.topicId);
  const reading = buildPreparationReading({ candidates: candidates.map(c => ({ ...c, subjectName: 'D' })) })
    .pulling.map(p => p.text);
  assert.deepEqual(risks, ['alto', 'meio', 'baixo']);
  assert.match(reading[0], /alto/);
  assert.match(reading[1], /meio/);
});
