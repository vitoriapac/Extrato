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
      correct: 72,
      total: 100,
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
  assert.match(html, /72%/);
  assert.match(html, /Ponto de Corte \(78%\)/);
  assert.match(html, /-6 pts/);
  assert.match(html, /Média Histórica/);
  assert.match(html, /\+2 pts/);

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
  assert.match(html, /Criar 7 dias de Remediação/);
  assert.match(html, /Gerar .* rascunhos p\/ Caderno de Erros/);
});
