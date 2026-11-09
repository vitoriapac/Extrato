import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { renderToString } from 'preact-render-to-string';
import {
  BUILTIN_EXAM_CATALOG,
  BUILTIN_BLUEPRINTS,
  filterCatalogItems,
  canUserAccessExam,
  convertBlueprintToImportPreset,
  loadCatalogCache,
  saveCatalogCache,
  fetchCatalogList,
  fetchExamBlueprint,
  CLOUD_CATALOG_STORAGE_KEY,
} from '../../src/application/subjects/cloud-catalog-service.js';
import {
  previewExamStructureImport,
  createExamImportService,
} from '../../src/application/subjects/exam-import-service.js';
import { CloudExamCatalogModal } from '../../src/ui/components/CloudExamCatalogModal.js';

class MemoryStorage {
  constructor() {
    this._data = new Map();
  }
  getItem(k) {
    return this._data.has(k) ? this._data.get(k) : null;
  }
  setItem(k, v) {
    this._data.set(k, String(v));
  }
  removeItem(k) {
    this._data.delete(k);
  }
  clear() {
    this._data.clear();
  }
  get length() {
    return this._data.size;
  }
  key(index) {
    return Array.from(this._data.keys())[index] || null;
  }
}

test('BUILTIN_EXAM_CATALOG — contém editais oficiais curados em diversas áreas de concurso', () => {
  assert.ok(BUILTIN_EXAM_CATALOG.length >= 6);
  const categories = new Set(BUILTIN_EXAM_CATALOG.map(item => item.category));
  assert.ok(categories.has('bancario'));
  assert.ok(categories.has('fiscal'));
  assert.ok(categories.has('tribunais'));
  assert.ok(categories.has('policial'));
  assert.ok(categories.has('administrativa'));
  assert.ok(categories.has('oab'));
  assert.ok(categories.has('enem'));
});

test('filterCatalogItems — filtra por categoria corretamente', () => {
  const bancarios = filterCatalogItems(BUILTIN_EXAM_CATALOG, { category: 'bancario' });
  assert.ok(bancarios.length >= 2);
  assert.ok(bancarios.every(item => item.category === 'bancario'));

  const fiscais = filterCatalogItems(BUILTIN_EXAM_CATALOG, { category: 'fiscal' });
  assert.equal(fiscais.length, 1);
  assert.equal(fiscais[0].slug, 'receita-federal-afrfb');

  const todos = filterCatalogItems(BUILTIN_EXAM_CATALOG, { category: 'todos' });
  assert.equal(todos.length, BUILTIN_EXAM_CATALOG.length);
});

test('filterCatalogItems — filtra por termo de busca insensível a maiúsculas e acentuação', () => {
  const porBanca = filterCatalogItems(BUILTIN_EXAM_CATALOG, { query: 'cesgranrio' });
  assert.ok(porBanca.length >= 2);
  assert.ok(porBanca.every(item => item.organizerBanca.toLowerCase() === 'cesgranrio'));

  const porAcento = filterCatalogItems(BUILTIN_EXAM_CATALOG, { query: 'policia' });
  assert.ok(porAcento.length >= 1);
  assert.equal(porAcento[0].slug, 'pf-agente-2021');

  const termoInexistente = filterCatalogItems(BUILTIN_EXAM_CATALOG, { query: 'concurso_inexistente_xyz' });
  assert.equal(termoInexistente.length, 0);
});

test('canUserAccessExam — libera editais gratuitos para Free e exige Pro para editais Premium', () => {
  const freeItem = BUILTIN_EXAM_CATALOG.find(i => !i.isPremium);
  const premiumItem = BUILTIN_EXAM_CATALOG.find(i => i.isPremium);

  assert.ok(freeItem);
  assert.ok(premiumItem);

  assert.equal(canUserAccessExam(freeItem, false), true);
  assert.equal(canUserAccessExam(freeItem, true), true);

  assert.equal(canUserAccessExam(premiumItem, false), false);
  assert.equal(canUserAccessExam(premiumItem, true), true);
});

test('convertBlueprintToImportPreset e previewExamStructureImport — integração direta e determinística', () => {
  const item = BUILTIN_EXAM_CATALOG.find(i => i.slug === 'caixa-tbn-2024');
  assert.ok(item);
  const blueprint = BUILTIN_BLUEPRINTS['caixa-tbn-2024'];
  assert.ok(blueprint);

  const preset = convertBlueprintToImportPreset(item, blueprint);
  assert.equal(preset.id, 'caixa-tbn-2024');
  assert.ok(Array.isArray(preset.subjects));
  assert.ok(preset.subjects.length > 0);

  // Executa o preview do exam-import-service
  const preview = previewExamStructureImport({
    preset,
    subjects: [], // Estado inicial sem disciplinas
  });

  assert.equal(preview.addedSubjects, preset.subjects.length);
  assert.ok(preview.addedTopics > 0);
  assert.equal(preview.existingSubjects, 0);
  assert.equal(preview.warnings.length, 0);
});

test('createExamImportService — importa blueprint em memória preservando histórico', () => {
  const item = BUILTIN_EXAM_CATALOG.find(i => i.slug === 'caixa-tbn-2024');
  const blueprint = BUILTIN_BLUEPRINTS['caixa-tbn-2024'];
  const preset = convertBlueprintToImportPreset(item, blueprint);

  const localState = {
    subjects: [],
  };

  const subjectService = {
    create: (name) => {
      const newSubject = { id: `subj_${Date.now()}_${Math.random()}`, name, topics: [] };
      localState.subjects.push(newSubject);
      return newSubject;
    },
    addTopic: (subjectId, topicData) => {
      const subject = localState.subjects.find(s => s.id === subjectId);
      if (subject) {
        subject.topics.push({ id: `top_${Date.now()}_${Math.random()}`, ...topicData });
      }
    },
    updateTopic: (subjectId, topicId, patch) => {
      const subject = localState.subjects.find(s => s.id === subjectId);
      const topic = subject?.topics.find(t => t.id === topicId);
      if (topic) Object.assign(topic, patch);
    },
  };

  const importService = createExamImportService({
    subjectService,
    getSubjects: () => localState.subjects,
  });

  const result = importService.importExamStructure({ preset });
  assert.equal(result.addedSubjects, preset.subjects.length);
  assert.equal(localState.subjects.length, preset.subjects.length);
});

test('loadCatalogCache e saveCatalogCache — operam em Storage isolado', () => {
  const storage = new MemoryStorage();
  assert.equal(loadCatalogCache(storage), null);

  /** @type {import('../../src/application/subjects/cloud-catalog-service.js').CloudExamCatalogItem[]} */
  const mockItems = [
    {
      id: 'mock-1',
      slug: 'mock-1',
      title: 'Concurso Mock',
      organizerBanca: 'FGV',
      examYear: 2026,
      category: /** @type {const} */ ('fiscal'),
      isPremium: true,
      version: '2026-v1',
      description: 'Mock',
      subjectsCount: 5,
      topicsCount: 20,
      publishedAt: '2026-01-01T00:00:00Z',
    },
  ];

  saveCatalogCache(mockItems, storage);
  assert.ok(storage.getItem(CLOUD_CATALOG_STORAGE_KEY));

  const loaded = loadCatalogCache(storage);
  assert.ok(Array.isArray(loaded));
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].slug, 'mock-1');
});

test('fetchCatalogList — usa resposta da API quando disponível e salva em cache', async () => {
  const storage = new MemoryStorage();
  const mockRows = [
    {
      id: 'api-1',
      slug: 'api-concurso',
      title: 'Concurso da API',
      organizer_banca: 'Cebraspe',
      exam_year: 2026,
      category: 'policial',
      is_premium: false,
      version: '2026-v1',
      description: 'API Concurso Desc',
      subjects_count: 8,
      topics_count: 45,
      published_at: '2026-05-01T00:00:00Z',
    },
  ];

  const fakeFetch = async () => ({
    ok: true,
    json: async () => mockRows,
  });

  const items = await fetchCatalogList({
    fetchImpl: /** @type {any} */ (fakeFetch),
    apiUrl: 'https://test-supabase.co',
    storage,
  });

  assert.equal(items.length, 1);
  assert.equal(items[0].slug, 'api-concurso');
  assert.equal(items[0].category, 'policial');

  // Confere se gravou em cache
  const cached = loadCatalogCache(storage);
  assert.ok(cached);
  assert.equal(cached[0].slug, 'api-concurso');
});

test('fetchCatalogList — recai sobre o catálogo builtin caso API falhe ou esteja offline', async () => {
  const fakeFailingFetch = async () => {
    throw new Error('Falha de rede / sem conexão');
  };

  const items = await fetchCatalogList({
    fetchImpl: /** @type {any} */ (fakeFailingFetch),
    apiUrl: 'https://test-supabase.co',
  });

  assert.ok(items.length >= 6);
  assert.equal(items[0].slug, BUILTIN_EXAM_CATALOG[0].slug);
});

test('fetchExamBlueprint — recupera blueprint de slug conhecido', async () => {
  const bp = await fetchExamBlueprint('caixa-tbn-2024');
  assert.ok(bp);
  assert.equal(bp.id, 'caixa-tbn-2024');
  assert.ok(bp.subjects.length > 0);

  const inexistente = await fetchExamBlueprint('slug-desconhecido');
  assert.equal(inexistente, null);
});

test('CloudExamCatalogModal — renderiza com Tabler Icons e conformidade estrita de Zero Emojis (WCAG AA)', () => {
  const html = renderToString(
    h(CloudExamCatalogModal, {
      open: true,
      onClose: () => {},
      isPro: false,
      onUpgradeRequired: () => {},
      onImportBlueprint: () => {},
    })
  );

  // Validação de acessibilidade e estrutura
  assert.ok(html.includes('Catálogo de Editais na Nuvem'));
  assert.ok(html.includes('Buscar por concurso, banca organizadora'));
  assert.ok(html.includes('icon-tabler'));

  // PROIBIÇÃO ESTRITA DE EMOJIS (Zero Emojis Policy)
  const emojiRegex = /\p{Extended_Pictographic}/u;
  const hasEmoji = emojiRegex.test(html);
  assert.equal(hasEmoji, false, `Violação detectada: a UI gerada contém emojis proibidos: ${html.match(emojiRegex)?.[0]}`);
});
