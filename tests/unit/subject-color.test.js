import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assignSubjectColors,
  isSubjectColor,
  subjectColorOf,
  SUBJECT_COLOR_COUNT,
  SUBJECT_COLOR_NAMES,
} from '../../src/domain/subjects/subject-color.js';

test('cor por disciplina: oito nomes, faixa válida e atribuição pela menos usada', () => {
  assert.equal(SUBJECT_COLOR_NAMES.length, SUBJECT_COLOR_COUNT);
  assert.equal(isSubjectColor(1), true);
  assert.equal(isSubjectColor(8), true);
  for (const bad of [0, 9, 1.5, '2', null, undefined]) assert.equal(isSubjectColor(bad), false);
  const subjects = Array.from({ length: 10 }, (_, i) => ({ id: `s${i}`, ...(i === 0 ? { color: 3 } : {}) }));
  assignSubjectColors(subjects);
  assert.deepEqual(
    subjects.map(s => s.color),
    [3, 1, 2, 4, 5, 6, 7, 8, 1, 2]
  );
});

test('cor por disciplina: disciplina recém-criada usa a posição até ganhar cor salva', () => {
  const list = [{ id: 'a', color: 5 }, { id: 'b' }, { id: 'c' }];
  assert.equal(subjectColorOf(list[0], list), 5);
  assert.equal(subjectColorOf(list[2], list), 3);
  assert.equal(subjectColorOf({ id: 'x' }, list), 1);
});
