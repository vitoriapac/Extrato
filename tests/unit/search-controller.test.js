import test from 'node:test';
import assert from 'node:assert/strict';
import {
  performGlobalSearch,
  normalizeSearchText,
  createSearchController,
  SEARCH_COMMANDS,
} from '../../src/ui/controllers/search-controller.js';

test('normalizeSearchText — remove acentos e normaliza para minúsculas', () => {
  assert.equal(normalizeSearchText('Atenção e Foco'), 'atencao e foco');
  assert.equal(normalizeSearchText('CRÔNICA'), 'cronica');
  assert.equal(normalizeSearchText(null), '');
});

test('performGlobalSearch — localiza tópicos por nome, notas ou tags ignorando acentos', () => {
  const subjects = [
    {
      id: 'sub-1',
      name: 'Direito Constitucional',
      topics: [
        { id: 'top-1', name: 'Direitos Fundamentais', notes: 'Artigo 5º', tags: ['essencial'] },
        { id: 'top-2', name: 'Organização do Estado', notes: '', tags: [] },
      ],
    },
    {
      id: 'sub-2',
      name: 'Língua Portuguesa',
      topics: [{ id: 'top-3', name: 'Crase', notes: 'Regra geral', tags: ['pontuacao'] }],
    },
  ];

  // Busca por nome com acento na query
  const res1 = performGlobalSearch('fundamentais', subjects);
  assert.equal(res1.length, 1);
  assert.equal(res1[0].topicName, 'Direitos Fundamentais');
  assert.equal(res1[0].subjectName, 'Direito Constitucional');

  // Busca por tag
  const res2 = performGlobalSearch('essencial', subjects);
  assert.equal(res2.length, 1);
  assert.equal(res2[0].topicId, 'top-1');

  // Busca por nota
  const res3 = performGlobalSearch('artigo 5', subjects);
  assert.equal(res3.length, 1);
  assert.equal(res3[0].topicId, 'top-1');

  // Busca vazia
  assert.deepEqual(performGlobalSearch('   ', subjects), []);

  // Busca sem correspondência
  assert.deepEqual(performGlobalSearch('matematica', subjects), []);
});

test('SEARCH_COMMANDS — possui comandos válidos de navegação e ação', () => {
  assert.ok(SEARCH_COMMANDS.length >= 10);
  const dashboardCmd = SEARCH_COMMANDS.find(c => c.tab === 'dashboard');
  assert.ok(dashboardCmd);
  assert.match(dashboardCmd.keywords, /inicio/);
});

test('createSearchController — instanciação e busca integrada', () => {
  const dummyState = {
    subjects: [
      {
        id: 's1',
        name: 'Informática',
        topics: [{ id: 't1', name: 'Segurança da Informação' }],
      },
    ],
  };

  const controller = createSearchController({
    document: {},
    window: {},
    getState: () => dummyState,
    activateTab: () => {},
    showToast: () => {},
    jumpToTopic: () => {},
  });

  const results = controller.performSearch('seguranca');
  assert.equal(results.length, 1);
  assert.equal(results[0].topicName, 'Segurança da Informação');
});

test('SEARCH_COMMANDS — termos do glossário encontram o destino certo', () => {
  const find = query =>
    SEARCH_COMMANDS.filter(item =>
      normalizeSearchText(`${item.label} ${item.keywords}`).includes(normalizeSearchText(query))
    ).map(item => item.label);
  assert.ok(find('fecha').includes('Abrir fechamento semanal'));
  assert.ok(find('Aderência').includes('Abrir Planejamento e metas'));
  assert.ok(find('trajetória').includes('Abrir Desempenho'));
});
