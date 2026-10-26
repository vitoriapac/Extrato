import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { SubjectsTab } from '../../src/ui/tabs/subjects/SubjectsTab.js';
import { SubjectBlock } from '../../src/ui/tabs/subjects/SubjectBlock.js';
import { SubjectTopicRow } from '../../src/ui/tabs/subjects/SubjectTopicRow.js';

const mockStatusOptions = ['Não iniciado', 'Em andamento', 'Concluído'];
const mockStatusClasses = {
  'Não iniciado': 'st-nao',
  'Em andamento': 'st-andamento',
  Concluído: 'st-concluido',
};
const mockDiffOptions = ['Fácil', 'Médio', 'Difícil'];
const mockDiffClasses = {
  Fácil: 'diff-facil',
  Médio: 'diff-medio',
  Difícil: 'diff-dificil',
};

test('SubjectsTab Preact Component — exibe estado vazio quando sem disciplinas', () => {
  const html = render(
    h(SubjectsTab, {
      subjects: [],
      archivedSubjects: [],
      subjectProgressFn: () => 0,
      subjectTopicFilters: new Map(),
      subjectTopicLimits: new Map(),
      openNotesIds: new Set(),
      statusOptions: mockStatusOptions,
      statusClasses: mockStatusClasses,
      difficultyOptions: mockDiffOptions,
      difficultyClasses: mockDiffClasses,
      topicMatchesExamFn: () => true,
      matchesSearchFn: () => true,
      pluralizeFn: (c, s) => `${c} ${s}`,
    })
  );

  assert.ok(html.includes('empty-state'));
  assert.ok(html.includes('Nenhuma disciplina cadastrada ainda.'));
  assert.ok(html.includes('+ Adicionar primeira disciplina'));
});

test('SubjectsTab Preact Component — renderiza disciplinas ativas e arquivadas', () => {
  const sampleSubject = {
    id: 'sub-1',
    name: 'Direito Constitucional',
    collapsed: false,
    archived: false,
    topics: [
      {
        id: 'top-1',
        name: 'Direitos Fundamentais',
        status: 'Concluído',
        difficulty: 'Médio',
        link: 'https://exemplo.com',
        tags: ['cai muito'],
        archived: false,
      },
    ],
  };

  const archivedSubject = {
    id: 'sub-archived',
    name: 'Direito Administrativo Legado',
    archived: true,
    archivedAt: '2026-01-01T00:00:00.000Z',
    topics: [],
  };

  const html = render(
    h(SubjectsTab, {
      subjects: [sampleSubject],
      archivedSubjects: [archivedSubject],
      subjectProgressFn: () => 100,
      subjectTopicFilters: new Map(),
      subjectTopicLimits: new Map(),
      openNotesIds: new Set(),
      statusOptions: mockStatusOptions,
      statusClasses: mockStatusClasses,
      difficultyOptions: mockDiffOptions,
      difficultyClasses: mockDiffClasses,
      topicMatchesExamFn: () => true,
      matchesSearchFn: () => true,
      pluralizeFn: (c, s) => `${c} ${s}`,
    })
  );

  assert.ok(html.includes('Direito Constitucional'));
  assert.ok(html.includes('Direitos Fundamentais'));
  assert.ok(html.includes('100% · 1 de 1 tópico'));
  assert.ok(html.includes('Disciplinas arquivadas'));
  assert.ok(html.includes('Direito Administrativo Legado'));
});

test('SubjectTopicRow Preact Component — renderiza campos de input, seletores e tags', () => {
  const topic = {
    id: 'top-10',
    name: 'Atos Administrativos',
    status: 'Em andamento',
    difficulty: 'Difícil',
    link: 'https://curso.com/atos',
    tags: ['revisar'],
    notes: 'Atenção aos requisitos de validade',
    archived: false,
  };

  const html = render(
    h(SubjectTopicRow, {
      subjectId: 'sub-1',
      topic,
      isOpenNotes: true,
      statusOptions: mockStatusOptions,
      statusClasses: mockStatusClasses,
      difficultyOptions: mockDiffOptions,
      difficultyClasses: mockDiffClasses,
    })
  );

  assert.ok(html.includes('value="Atos Administrativos"'));
  assert.ok(html.includes('value="https://curso.com/atos"'));
  assert.ok(html.includes('st-andamento'));
  assert.ok(html.includes('diff-dificil'));
  assert.ok(html.includes('revisar'));
  assert.ok(html.includes('Atenção aos requisitos de validade'));
});
