import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCriticalVulnerabilitiesViewModel } from '../../src/application/analytics/build-critical-vulnerabilities-view-model.js';

test('buildCriticalVulnerabilitiesViewModel identifica tópicos frágeis com alta incidência', () => {
  const subjects = [
    {
      id: 's1',
      name: 'Direito Constitucional',
      topics: [
        { id: 't1', name: 'Controle de Constitucionalidade', incidence: 'Alta' },
        { id: 't2', name: 'Direitos Fundamentais', incidence: 'Média' },
        { id: 't3', name: 'Poder Legislativo', incidence: 'Baixa' },
      ],
    },
  ];

  const metricsByTopic = {
    t1: { mastery: { score: 45 }, coverage: 100 }, // Frágil com alta incidência
    t2: { mastery: { score: 90 }, coverage: 100 }, // Consolidado
    t3: { mastery: { score: 50 }, coverage: 100 }, // Frágil com baixa incidência
  };

  const model = buildCriticalVulnerabilitiesViewModel({
    subjects,
    metricsByTopic,
    blueprint: { masteryTarget: 80 },
    limit: 4,
  });

  assert.equal(model.vulnerabilities.length, 2);
  // t1 deve ser o primeiro devido à alta incidência e maior severidade
  assert.equal(model.vulnerabilities[0].topicId, 't1');
  assert.equal(model.vulnerabilities[0].mastery, 45);
  assert.equal(model.vulnerabilities[0].urgency, 'critical');
  assert.equal(model.vulnerabilities[0].gap, 35);
});

test('buildCriticalVulnerabilitiesViewModel retorna vazio quando todo domínio está acima da meta', () => {
  const subjects = [
    {
      id: 's1',
      name: 'Direito Constitucional',
      topics: [
        { id: 't1', name: 'Direitos Fundamentais', incidence: 'Alta' },
      ],
    },
  ];

  const metricsByTopic = {
    t1: { mastery: { score: 95 }, coverage: 100 },
  };

  const model = buildCriticalVulnerabilitiesViewModel({
    subjects,
    metricsByTopic,
    blueprint: { masteryTarget: 80 },
  });

  assert.equal(model.vulnerabilities.length, 0);
  assert.match(model.summary, /Nenhuma vulnerabilidade crítica/);
});

test('buildCriticalVulnerabilitiesViewModel ignora tópico sem domínio medido', () => {
  const model = buildCriticalVulnerabilitiesViewModel({
    subjects: [
      {
        id: 's1',
        name: 'Português',
        topics: [{ id: 't1', name: 'Crase', incidence: 'Alta' }],
      },
    ],
    // estudado (cobertura), mas sem nenhuma questão: não há domínio para comparar com a meta
    metricsByTopic: { t1: { coverage: 100 } },
    blueprint: { masteryTarget: 80 },
  });

  assert.equal(model.vulnerabilities.length, 0);
});

test('buildCriticalVulnerabilitiesViewModel conta só tópicos com domínio medido', () => {
  const subjects = [
    {
      id: 's1',
      name: 'Português',
      topics: [
        { id: 't1', name: 'Crase', incidence: 'Alta' },
        { id: 't2', name: 'Regência', incidence: 'Alta' },
      ],
    },
  ];
  const medido = buildCriticalVulnerabilitiesViewModel({
    subjects,
    metricsByTopic: { t1: { mastery: { score: 90 }, coverage: 100 }, t2: { coverage: 100 } },
    blueprint: { masteryTarget: 80 },
  });
  assert.equal(medido.measuredTopicsCount, 1);
  assert.equal(medido.vulnerabilities.length, 0);

  const semNada = buildCriticalVulnerabilitiesViewModel({ subjects, metricsByTopic: {} });
  assert.equal(semNada.measuredTopicsCount, 0);
});
