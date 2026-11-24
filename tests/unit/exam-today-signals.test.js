import test from 'node:test';
import assert from 'node:assert/strict';
import { buildExamTodaySignals } from '../../src/application/analytics/build-exam-today-signals.ts';
import { renderExamTodaySignals } from '../../src/ui/renderers/exam-today-renderer.ts';

const blueprint = {
  targetScore: 80,
  activeExamTags: [],
  scoringMode: 'certo-errado',
  subjects: [{ subjectId: 'esp', minScore: 50 }],
};
const subjects = [{ id: 'esp', name: 'Específicos' }];

test('A prova hoje: nota projetada × meta, mínimo no último simulado e pendências', () => {
  const model = buildExamTodaySignals({
    calibration: { available: true, central: 72.4, target: 80 },
    simulations: [
      { date: '2026-10-01', breakdown: [{ subjectId: 'esp', correct: 40, total: 50 }] },
      // O mais recente manda: 20 certas e 15 erradas em 50 → 10% líquida, abaixo de 50%.
      {
        date: '2026-11-01',
        scoring: 'certo-errado',
        breakdown: [{ subjectId: 'esp', correct: 20, wrong: 15, total: 50 }],
      },
    ],
    blueprint,
    subjects,
    overdue: 9,
  });
  assert.deepEqual(model.score, {
    available: true,
    central: 72,
    target: 80,
    gap: -8,
    net: true,
    cutoff: null,
    cutoffGap: null,
    low: null,
    high: null,
    confidenceLabel: null,
    simulations: 0,
    questionAccuracy: null,
  });
  assert.deepEqual(model.minimum.names, ['Específicos']);
  assert.equal(model.minimum.simulationDate, '2026-11-01');
  const html = renderExamTodaySignals(model);
  assert.match(html, /Nota líquida projetada/);
  assert.match(html, /8 p\.p\. abaixo da meta de 80%/);
  assert.match(html, /Específicos · simulado de 01\/11\/2026/);
  assert.match(html, /id="overviewAttentionViewAll"[^>]*data-signal-tab="hoje"/);
  assert.match(html, /9<\/strong><span class="overview-signal__label">Pendências atrasadas/);
});

test('A prova hoje mostra a faixa, não o centro, e não fica verde com a meta dentro dela', () => {
  const calibration = {
    available: true,
    central: 81.2,
    low: 69.4,
    high: 93,
    target: 80,
    confidenceLabel: 'Baixa',
    observations: [{}, {}, {}],
  };
  const model = buildExamTodaySignals({
    calibration,
    blueprint: { targetScore: 80, subjects: [] },
    today: '2026-11-24',
    questions: [
      { date: '2026-11-20', resolved: 100, correct: 68 },
      { date: '2026-11-21', resolved: 40, correct: 40, retry: true }, // refeitas não contam
      { date: '2026-10-01', resolved: 100, correct: 100 }, // fora dos 30 dias
    ],
  });
  assert.equal(model.score.low, 69);
  assert.equal(model.score.high, 93);
  assert.equal(model.score.questionAccuracy, 68);
  const html = renderExamTodaySignals(model);
  assert.match(html, /overview-signal--warning/);
  assert.match(html, /69–93%<\/strong>/);
  assert.match(html, /Meta de 80% dentro da faixa · confiança baixa, 3 simulados comparáveis/);
  assert.match(html, /acerto em questões \(30 dias\): 68%, abaixo dos simulados/);
  assert.doesNotMatch(html, /81%/);

  // Faixa toda acima, questões coerentes e amostra pequena de questões: verde, sem aviso.
  const ok = renderExamTodaySignals(
    buildExamTodaySignals({
      calibration: { ...calibration, central: 88, low: 82, high: 94 },
      blueprint: { targetScore: 80, subjects: [] },
      today: '2026-11-24',
      questions: [{ date: '2026-11-20', resolved: 20, correct: 10 }],
    })
  );
  assert.match(ok, /overview-signal--success/);
  assert.match(ok, /Faixa toda acima da meta de 80%/);
  assert.doesNotMatch(ok, /acerto em questões/);

  // Certo/errado: nota líquida não se compara com acerto bruto; corte abaixo da faixa toda é perigo.
  const net = buildExamTodaySignals({
    calibration: { ...calibration, central: 50, low: 40, high: 60 },
    blueprint: {
      targetScore: 80,
      scoringMode: 'certo-errado',
      cutoff: { score: 65, maxScore: 100 },
      subjects: [],
    },
    today: '2026-11-24',
    questions: [{ date: '2026-11-20', resolved: 100, correct: 30 }],
  });
  assert.equal(net.score.questionAccuracy, null);
  const netHtml = renderExamTodaySignals(net);
  assert.match(netHtml, /overview-signal--danger/);
  assert.match(netHtml, /Faixa toda abaixo do corte de 65% · meta 80%/);
});

test('A prova hoje sem projeção nem mínimos diz o que falta, sem números inventados', () => {
  const html = renderExamTodaySignals(
    buildExamTodaySignals({
      calibration: { available: false, target: null },
      blueprint: { subjects: [] },
    })
  );
  assert.match(html, /Registre simulados comparáveis para projetar/);
  assert.match(html, /Defina os mínimos eliminatórios nas Metas/);
  assert.match(html, /Revisões e tarefas em dia/);
});
