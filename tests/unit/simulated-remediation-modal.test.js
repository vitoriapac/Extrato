import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { SimulatedRemediationModal } from '../../src/ui/components/SimulatedRemediationModal.js';
import { buildSimulatedRemediationDiagnostic } from '../../src/domain/diagnostics/simulated-remediation.js';

test('SimulatedRemediationModal — retorna vazio se diagnostic for null', () => {
  const html = render(
    h(SimulatedRemediationModal, {
      open: true,
      onClose: () => {},
      diagnostic: null,
    })
  );

  assert.equal(html, '');
});

test('SimulatedRemediationModal — renderiza dados do diagnóstico, top 3 sangrias e plano de 7 dias', () => {
  const diagnostic = buildSimulatedRemediationDiagnostic({
    simulation: {
      id: 'sim-100',
      nome: 'Simulado TCU Auditor',
      date: '2026-10-26',
      correct: 32,
      total: 60,
      breakdown: [
        {
          id: 'b1',
          subjectId: 's1',
          topicId: 't1',
          subjectName: 'Controle Externo',
          topicName: 'Jurisprudência TCU',
          total: 20,
          correct: 8,
        },
        {
          id: 'b2',
          subjectId: 's2',
          topicId: 't2',
          subjectName: 'Auditoria Governamental',
          topicName: 'Amostragem',
          total: 20,
          correct: 10,
        },
        {
          id: 'b3',
          subjectId: 's3',
          topicId: 't3',
          subjectName: 'Direito Constitucional',
          topicName: 'Orçamento Público',
          total: 20,
          correct: 14,
        },
      ],
    },
    passingScorePercent: 78,
    historicalAverageScore: 70,
    weeklyAvailableHours: 25,
  });

  const html = render(
    h(SimulatedRemediationModal, {
      open: true,
      onClose: () => {},
      diagnostic,
    })
  );

  assert.match(html, /Raio-X Pós-Simulado e Plano de Remediação/);
  assert.match(html, /Simulado TCU Auditor/);
  assert.match(html, /53,3%/);
  assert.match(html, /Meta de nota \(78%\)/);
  assert.match(html, /-24,7 p\.p\./);
  assert.match(html, /Média dos outros simulados/);
  assert.match(html, /-16,7 p\.p\./);

  // Top 3 vulnerabilidades
  assert.match(html, /Top 3 Vulnerabilidades — Maior Sangria de Pontos/);
  assert.match(html, /Jurisprudência TCU/);
  assert.match(html, /Amostragem/);
  assert.match(html, /Orçamento Público/);
  assert.match(html, /-12 pontos perdidos/);

  // Plano de 7 dias
  assert.match(html, /Plano de Remediação — 7 Dias/);
  assert.match(html, /60% Foco Crítico/);
  assert.match(html, /40% Manutenção/);
  assert.match(html, /Dia 1/);
  assert.match(html, /Dia 7/);

  // Botões de ação
  assert.match(html, /Pôr os 7 dias na Agenda/);
  assert.match(html, /Gerar .* rascunhos p\/ Caderno de Erros/);
});

test('SimulatedRemediationModal — nota líquida, mínimo eliminatório, tempo e chutes', () => {
  const diagnostic = buildSimulatedRemediationDiagnostic({
    simulation: {
      id: 'sim-ce',
      nome: 'Simulado Cebraspe',
      correct: 0,
      total: 0,
      scoring: 'certo-errado',
      durationMinutes: 240,
      guessed: 10,
      guessedCorrect: 3,
      breakdown: [
        { id: 'a', subjectId: 'port', correct: 40, wrong: 10, total: 50 },
        { id: 'b', subjectId: 'esp', correct: 25, wrong: 20, total: 50 },
      ],
    },
    blueprintSubjects: [{ subjectId: 'esp', minScore: 20, questionWeight: 2 }],
    subjectsMap: new Map([['esp', { id: 'esp', name: 'Específicos' }]]),
  });
  // (40 − 10) + (25 − 20) = 35 de 100
  assert.equal(diagnostic.scorePercent, 35);
  assert.equal(diagnostic.minimumMisses[0].name, 'Específicos');
  // Específicos perde 45 pontos e Português 20; com peso 2, Específicos vem primeiro.
  assert.equal(diagnostic.topBleedingTopics[0].subjectId, 'esp');
  const html = render(h(SimulatedRemediationModal, { open: true, onClose: () => {}, diagnostic }));
  assert.match(html, /Nota líquida/);
  assert.match(html, /Abaixo do mínimo eliminatório/);
  assert.match(html, /2,4 min por questão/);
  // 3 certos − 7 errados = −4 p.p.
  assert.match(html, /3 de 10 chutes certos/);
  assert.match(html, /-4 p\.p\./);
  assert.match(html, /Deixar essas questões em branco teria rendido mais/);
});
