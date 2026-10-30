import test from 'node:test';
import assert from 'node:assert/strict';
import { renderTopicAnalyticsState } from '../../src/ui/tabs/subjects/topic-analytics-view.js';

test('renderTopicAnalyticsState — formata estado analítico e métricas do tópico', () => {
  const subject = { id: 's1', name: 'Direito' };
  const topic = { id: 't1', name: 'Atos Administrativos', status: 'Concluído' };

  const html = renderTopicAnalyticsState({
    subject,
    topic,
    topicMasteryIndex: () => ({
      score: 85,
      confidence: 0.8,
      evidence: { evidenceStrength: 0.8, evidenceLabel: 'Alta' },
    }),
    topicRetentionScore: () => ({
      score: 90,
      available: true,
      evidence: { evidenceLabel: 'Alta' },
    }),
    diagnoseTopic: () => ({
      lastActivity: '2026-10-25',
      performance: { accuracy: 85, resolved: 20 },
      trend: { icon: 'minus', label: 'Estável', delta: 0 },
    }),
    topicReviewHealthScore: () => ({
      value: 80,
      level: 'good',
      reasons: ['Revisões em dia'],
    }),
    diasParaRevisao: () => -3,
    localDateFromTimestamp: () => '2026-10-25',
    prerequisiteBlockers: () => [],
    allTopics: () => [],
    needsMaintenance: () => false,
    getTopicName: () => 'Atos Administrativos',
    escapeHtml: s => s,
  });

  assert.match(html, /Estado analítico/);
  assert.match(html, /Consolidado/);
  assert.match(html, /Cobertura/);
  assert.match(html, /100%/);
  assert.match(html, /Domínio/);
  assert.match(html, /85%/);
  assert.match(html, /Retenção/);
  assert.match(html, /90%/);
});
