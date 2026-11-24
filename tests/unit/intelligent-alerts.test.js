import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALERT_TYPES,
  buildIntelligentAlerts,
  createDiagnosticAlert,
} from '../../src/domain/diagnostics/alerts.js';

test('cria alerta com contrato estruturado e id determinístico', () => {
  const alert = createDiagnosticAlert({
    type: 'performance_decline',
    subjectId: 's1',
    reason: 'Queda medida.',
    recommendedAction: 'Revisar.',
    createdAt: '2026-09-07',
  });
  assert.equal(alert.id, 'performance_decline:s1');
  assert.equal(alert.resolvedAt, null);
  assert.ok(ALERT_TYPES.includes(alert.type));
});

test('gera alertas acionáveis para déficit, tendência, revisão e tópico crítico', () => {
  const alerts = buildIntelligentAlerts({
    today: '2026-09-07',
    overdueReviews: 2,
    weeklyBalanceMinutes: -180,
    subjects: [
      {
        subjectId: 's1',
        name: 'Direito',
        trend: { direction: 'down', state: 'strong_down', delta: -12 },
        daysSinceStudy: 16,
      },
    ],
    topics: [
      {
        topicId: 't1',
        subjectId: 's1',
        name: 'Constitucional',
        mastery: 40,
        examImpact: 90,
        evidenceStrength: 0.2,
      },
    ],
  });
  assert.deepEqual(
    new Set(alerts.map(item => item.type)),
    new Set([
      'review_critical',
      'weekly_deficit',
      'performance_decline',
      'subject_neglected',
      'low_mastery_high_exam_impact',
      'insufficient_evidence',
    ])
  );
  assert.ok(alerts.every(item => item.reason && item.recommendedAction));
});

test('não interpreta domínio ausente como zero e usa erros apenas com diagnóstico suficiente', () => {
  const base = {
    topicId: 't1',
    subjectId: 's1',
    name: 'Probabilidade',
    mastery: null,
    examImpact: 90,
    evidenceStrength: 0.1,
  };
  const without = buildIntelligentAlerts({ topics: [base] });
  assert.ok(!without.some(item => item.type === 'low_mastery_high_exam_impact'));
  assert.ok(!without.some(item => item.type === 'error_pattern'));
  const withPattern = buildIntelligentAlerts({
    topics: [
      {
        ...base,
        dominantError: {
          key: 'calculo',
          label: 'cálculo',
          share: 55,
          recommendation: { action: 'Treinar cálculos guiados' },
        },
      },
    ],
  });
  const alert = withPattern.find(item => item.type === 'error_pattern');
  assert.equal(alert.recommendedAction, 'Treinar cálculos guiados');
  assert.equal(alert.topicId, 't1');
});

test('disciplinas paradas viram um alerta só, da de maior peso na prova para a de menor', () => {
  const row = (subjectId, name, daysSinceStudy, examWeight) => ({
    subjectId,
    name,
    daysSinceStudy,
    examWeight,
    trend: { direction: 'stable' },
  });
  const alerts = buildIntelligentAlerts({
    subjects: [
      row('a', 'Atendimento', 29, 5),
      row('b', 'Tecnologia', 33, 10),
      row('c', 'Inglês', 40, 0),
      row('d', 'Matemática', 20, 10),
      row('e', 'Recente', 3, 50),
    ],
  });
  const neglected = alerts.filter(item => item.type === 'subject_neglected');
  assert.equal(neglected.length, 1);
  assert.equal(neglected[0].id, 'subjects-neglected');
  assert.equal(neglected[0].severity, 'high');
  // Peso desempata primeiro, depois quem está parada há mais tempo.
  assert.match(
    neglected[0].reason,
    /^4 disciplinas sem estudo há 14 dias ou mais, da de maior peso na prova para a de menor: Tecnologia \(33 dias\), Matemática \(20 dias\), Atendimento \(29 dias\) e mais 1\.$/
  );
  assert.match(neglected[0].recommendedAction, /as de pouco peso podem esperar/);

  // Uma só continua como antes.
  const single = buildIntelligentAlerts({ subjects: [row('a', 'Atendimento', 15, 0)] });
  assert.equal(single[0].reason, 'Atendimento está há 15 dias sem estudo registrado.');
  assert.equal(single[0].severity, 'medium');
});
