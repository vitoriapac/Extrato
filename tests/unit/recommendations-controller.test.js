import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildExcludedCandidates,
  renderExcludedCandidatesHtml,
  renderPendingOutcomeHtml,
  formatRecommendationHistoryLabel,
  createRecommendationsController,
} from '../../src/ui/controllers/recommendations-controller.js';

test('buildExcludedCandidates — filtra itens visíveis e limita a 6 itens', () => {
  const candidates = Array.from({ length: 10 }, (_, i) => ({
    id: `rec-${i}`,
    subjectId: 's1',
    topicId: `t${i}`,
    subjectName: 'Direito Constitucional',
    topicName: `Tópico ${i}`,
    examImpact: 50,
  }));

  const visibleIds = new Set(['rec-0', 'rec-1', 'rec-2']);
  const dismissedIds = new Set();
  const getTopicName = id => `Nome ${id}`;

  const excluded = buildExcludedCandidates(candidates, visibleIds, dismissedIds, getTopicName);
  assert.equal(excluded.length, 6);
  assert.equal(excluded[0].id, 'rec-3');
  assert.equal(excluded[5].id, 'rec-8');
});

test('buildExcludedCandidates — classifica estados de exclusão corretamente', () => {
  const getTopicName = id => (id === 't-pre' ? 'Controle de Constitucionalidade' : id);
  const candidates = [
    {
      id: 'rec-prereq',
      subjectName: 'Dir Const',
      topicName: 'Ações',
      blockedPrerequisites: ['t-pre'],
    },
    {
      id: 'rec-completed',
      subjectName: 'Dir Const',
      topicName: 'Direitos Fundamentais',
      completed: true,
    },
    {
      id: 'rec-consolidated',
      subjectName: 'Dir Const',
      topicName: 'Poder Legislativo',
      covered: true,
    },
    {
      id: 'rec-no-minutes',
      subjectName: 'Dir Const',
      topicName: 'Poder Judiciário',
      remainingMinutes: null,
      covered: false,
    },
    {
      id: 'rec-dismissed',
      subjectName: 'Dir Const',
      topicName: 'Processo Legislativo',
    },
    {
      id: 'rec-low-impact',
      subjectName: 'Dir Const',
      topicName: 'Disposições Transitórias',
      examImpact: 20,
    },
    {
      id: 'rec-lower-prio',
      subjectName: 'Dir Const',
      topicName: 'Segurança Pública',
      examImpact: 80,
    },
  ];

  const visibleIds = new Set();
  const dismissedIds = new Set(['rec-dismissed']);
  const excluded = buildExcludedCandidates(candidates, visibleIds, dismissedIds, getTopicName);

  assert.equal(excluded[0].stateIcon, '🔒');
  assert.ok(excluded[0].stateText.includes('Aguarda Controle de Constitucionalidade'));

  assert.equal(excluded[1].stateIcon, '✓');
  assert.equal(excluded[1].stateText, 'Atividade já realizada hoje');

  assert.equal(excluded[2].stateIcon, '✓');
  assert.equal(excluded[2].stateText, 'Concluído e consolidado');

  assert.equal(excluded[3].stateIcon, '○');
  assert.equal(excluded[3].stateText, 'Carga de estudo ainda não configurada');

  assert.equal(excluded[4].stateIcon, '○');
  assert.equal(excluded[4].stateText, 'Ocultado nesta sessão');

  assert.equal(excluded[5].stateIcon, '○');
  assert.equal(excluded[5].stateText, 'Baixa relevância configurada para a prova');
});

test('buildExcludedCandidates — respeita needsMaintenanceFn para tópicos cobertos', () => {
  const candidates = [
    {
      id: 'rec-maintenance',
      subjectName: 'Dir Const',
      topicName: 'Remédios Constitucionais',
      covered: true,
    },
  ];

  // Se precisa de manutenção, não deve cair em "Concluído e consolidado"
  const excluded = buildExcludedCandidates(
    candidates,
    new Set(),
    new Set(),
    id => id,
    item => item.id === 'rec-maintenance'
  );

  assert.equal(excluded[0].stateIcon, '★');
  assert.equal(excluded[0].stateText, 'Prioridade inferior às três recomendações atuais');
});

test('renderExcludedCandidatesHtml — gera HTML estruturado ou vazio', () => {
  assert.equal(renderExcludedCandidatesHtml([]), '');
  assert.equal(renderExcludedCandidatesHtml(null), '');

  const items = [
    {
      id: 'r1',
      subjectName: 'Matemática',
      topicName: 'Álgebra & Funções',
      stateIcon: '🔒',
      stateText: 'Aguarda Aritmética',
    },
  ];
  const html = renderExcludedCandidatesHtml(items, s => s.replace(/&/g, '&amp;'));
  assert.ok(html.includes('<details class="recommendation-exclusions">'));
  assert.ok(html.includes('Álgebra &amp; Funções'));
  assert.ok(html.includes('Aguarda Aritmética'));
});

test('renderPendingOutcomeHtml — renderiza prompt de feedback para pendências', () => {
  assert.equal(
    renderPendingOutcomeHtml([], id => id),
    ''
  );

  const feedbacks = [
    { recommendationId: 'rec-1', topicId: 'top-1', completed: true, useful: true },
    { recommendationId: 'rec-2', topicId: 'top-2', completed: true, useful: null },
  ];
  const html = renderPendingOutcomeHtml(feedbacks, id =>
    id === 'top-2' ? 'Crimes contra a Vida' : id
  );
  assert.ok(html.includes('O estudo de Crimes contra a Vida ajudou?'));
  assert.ok(html.includes("rateRecommendationOutcome('rec-2',true)"));
  assert.ok(html.includes("rateRecommendationOutcome('rec-2',false)"));
});

test('formatRecommendationHistoryLabel — formata taxa de aceitação, conclusão e utilidade', () => {
  assert.equal(formatRecommendationHistoryLabel(null), '');
  assert.equal(formatRecommendationHistoryLabel({ shown: 0 }), '');

  const summary = {
    shown: 10,
    accepted: 8,
    completed: 6,
    rated: 4,
    useful: 3,
    acceptanceRate: 80,
    completionRate: 75,
    usefulnessRate: 75,
  };
  const label = formatRecommendationHistoryLabel(summary);
  assert.equal(label, 'Histórico: 80% aceitas · 75% concluídas · 75% úteis');
});

test('createRecommendationsController — orquestra consultas usando contexto', () => {
  const state = {
    recommendationFeedback: [
      { recommendationId: 'rec-active', topicId: 'top-x', completed: true, useful: null },
    ],
  };
  const controller = createRecommendationsController({
    getState: () => state,
    getTopicName: id => (id === 'top-x' ? 'Direito Penal' : id),
    getSubjectName: id => id,
    escapeHtml: s => s,
    escapeAttr: s => s,
  });

  const pendingHtml = controller.getPendingOutcome();
  assert.ok(pendingHtml.includes('Direito Penal'));

  const excluded = controller.getExcluded(
    [
      { id: '1', completed: true, subjectName: 'Dir', topicName: 'Top' },
      { id: '2', completed: true, subjectName: 'Dir', topicName: 'Top2' },
    ],
    new Set(['1']),
    new Set()
  );
  assert.equal(excluded.length, 1);
  assert.equal(excluded[0].id, '2');

  const excludedHtml = controller.renderExcludedHtml(excluded);
  assert.ok(excludedHtml.includes('<details class="recommendation-exclusions">'));
});
