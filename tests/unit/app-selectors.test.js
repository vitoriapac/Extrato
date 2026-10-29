import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getSubjectById,
  getTopicById,
  getSubjectName,
  getTopicName,
  entitySubjectId,
  entitySubjectName,
  allTopics,
  activeSubjects,
  activeTopics,
  subjectsForSelection,
  topicsForSelection,
  diasParaRevisao,
  diasParaRevisaoPill,
  monthKey,
  monthLabel,
  collectMonthKeys,
  startOfWeek,
  isSameWeek,
  isSameMonth,
  createAppSelectors,
} from '../../src/application/selectors/app-selectors.js';

const mockSubjects = [
  {
    id: 's1',
    name: 'Direito Constitucional',
    archived: false,
    topics: [
      { id: 't1', name: 'Controle de Constitucionalidade', archived: false },
      { id: 't2', name: 'Direitos Fundamentais', archived: true },
    ],
  },
  {
    id: 's2',
    name: 'Direito Administrativo',
    archived: true,
    topics: [{ id: 't3', name: 'Atos Administrativos', archived: false }],
  },
];

test('App Selectors — consultas de matérias e tópicos', () => {
  assert.equal(getSubjectById(mockSubjects, 's1')?.name, 'Direito Constitucional');
  assert.equal(getSubjectById(mockSubjects, 's99'), null);

  const foundTopic = getTopicById(mockSubjects, 't1');
  assert.ok(foundTopic);
  assert.equal(foundTopic.topic.name, 'Controle de Constitucionalidade');
  assert.equal(foundTopic.subject.name, 'Direito Constitucional');

  assert.equal(getSubjectName(mockSubjects, 's1'), 'Direito Constitucional');
  assert.equal(getSubjectName(mockSubjects, 's99'), 'Disciplina removida');

  assert.equal(getTopicName(mockSubjects, 't1'), 'Controle de Constitucionalidade');
  assert.equal(getTopicName(mockSubjects, 't99'), 'Tópico removido');
});

test('App Selectors — entitySubjectId e entitySubjectName polimórficos', () => {
  assert.equal(entitySubjectId(mockSubjects, { subjectId: 's1' }), 's1');
  assert.equal(entitySubjectId(mockSubjects, { subject: 'Direito Constitucional' }), 's1');
  assert.equal(entitySubjectId(mockSubjects, { subject: 'Inexistente' }), null);

  assert.equal(entitySubjectName(mockSubjects, { subjectId: 's1' }), 'Direito Constitucional');
  assert.equal(entitySubjectName(mockSubjects, { subject: 'Desconhecida' }), 'Desconhecida');
  assert.equal(entitySubjectName(mockSubjects, {}), '—');
});

test('App Selectors — listagens ativas e opções de seleção', () => {
  const all = allTopics(mockSubjects);
  assert.equal(all.length, 3);

  const actSubjects = activeSubjects(mockSubjects);
  assert.equal(actSubjects.length, 1);
  assert.equal(actSubjects[0].id, 's1');

  const actTopics = activeTopics(mockSubjects);
  assert.equal(actTopics.length, 1);
  assert.equal(actTopics[0].id, 't1');

  // subjectsForSelection preserva a disciplina selecionada mesmo se arquivada
  const optionsArchived = subjectsForSelection(mockSubjects, 's2');
  assert.equal(optionsArchived.length, 2);

  // topicsForSelection
  const topicOpts = topicsForSelection(mockSubjects, 's1', 't2');
  assert.equal(topicOpts.length, 2); // t1 (ativo) e t2 (selecionado)
});

test('App Selectors — diasParaRevisao e pills de status', () => {
  const today = '2026-10-29';

  assert.equal(diasParaRevisao('2026-10-29', today), 0);
  assert.equal(diasParaRevisao('2026-10-25', today), -4);
  assert.equal(diasParaRevisao('2026-11-02', today), 4);
  assert.equal(diasParaRevisao('', today), null);

  assert.ok(diasParaRevisaoPill('2026-10-25', 'Pendente', today).includes('dias-atrasada'));
  assert.ok(diasParaRevisaoPill('2026-10-29', 'Pendente', today).includes('dias-hoje'));
  assert.ok(diasParaRevisaoPill('2026-11-02', 'Pendente', today).includes('dias-proxima'));
  assert.ok(diasParaRevisaoPill('2026-11-20', 'Pendente', today).includes('dias-futura'));
  assert.ok(diasParaRevisaoPill('2026-10-25', 'Concluído', today).includes('—'));
});

test('App Selectors — datas civis, semanas e agrupamentos mensais', () => {
  const today = '2026-10-29'; // Quinta-feira

  // Segunda-feira da semana de 2026-10-29 é 2026-10-26
  assert.equal(startOfWeek('2026-10-29'), '2026-10-26');
  assert.equal(isSameWeek('2026-10-27', today), true);
  assert.equal(isSameWeek('2026-11-03', today), false);

  assert.equal(monthKey('2026-10-29'), '2026-10');
  assert.equal(monthLabel('2026-10'), 'Outubro de 2026');
  assert.equal(isSameMonth('2026-10-01', today), true);
  assert.equal(isSameMonth('2026-11-01', today), false);

  const keys = collectMonthKeys(
    [{ date: '2026-08-15' }, { date: '2026-09-10' }],
    [{ date: '2026-08-20' }, { date: '2026-10-01' }]
  );
  assert.deepEqual(keys, ['2026-08', '2026-09', '2026-10']);
});

test('App Selectors — createAppSelectors orquestra estado com reatividade', () => {
  const state = { subjects: mockSubjects };
  const selectors = createAppSelectors({
    getState: () => state,
    getToday: () => '2026-10-29',
  });

  assert.equal(selectors.getSubjectName('s1'), 'Direito Constitucional');
  assert.equal(selectors.activeSubjects().length, 1);
  assert.equal(selectors.diasParaRevisao('2026-10-29'), 0);
});
