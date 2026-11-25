import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseRawSyllabusText,
  splitFgvProseTopics,
} from '../../src/application/subjects/raw-syllabus-parser.js';
import { buildPostEditalDiff } from '../../src/domain/exams/post-edital-diff.js';

test('raw-syllabus-parser protege referências jurídicas e quebra prosa FGV separada por ponto e vírgula', () => {
  const fgvText = `DIREITO ADMINISTRATIVO:
Regime jurídico administrativo e Lei nº 8.112/1990; Processo administrativo no âmbito federal (Lei nº 9.784/1999); Responsabilidade civil do Estado: responsabilidade objetiva e subjetiva, reparação do dano e direito de regresso; Improbidade administrativa segundo a Lei 14.230/2021.`;

  const parsed = parseRawSyllabusText(fgvText);
  assert.equal(parsed.totalSubjects, 1);
  assert.equal(parsed.subjects[0].name, 'DIREITO ADMINISTRATIVO');
  assert.ok(parsed.subjects[0].topics.length >= 4);
  assert.ok(
    parsed.subjects[0].topics.some(t => t.name.includes('Lei nº 8.112/1990')),
    'Não deve cortar Lei nº 8.112/1990 no ponto'
  );
  assert.ok(parsed.subjects[0].topics.some(t => t.name.includes('Improbidade administrativa')));

  const subtopics = splitFgvProseTopics('Item A; Item B (art. 5º; art. 6º); Item C');
  assert.equal(subtopics.length, 3);
});

test('raw-syllabus-parser une quebras artificiais de coluna dupla em PDF', () => {
  const pdfWrapped = `DIREITO CONSTITUCIONAL:
Controle de constitucionalidade das
leis e atos normativos.
Organização dos Poderes.`;
  const parsed = parseRawSyllabusText(pdfWrapped);
  assert.equal(parsed.subjects[0].topics.length, 2);
  assert.equal(
    parsed.subjects[0].topics[0].name,
    'Controle de constitucionalidade das leis e atos normativos.'
  );
});

test('buildPostEditalDiff calcula bagagem reaproveitada, equivalências candidatas e delta pós-edital sem mutar estado', () => {
  const existingSubjects = [
    {
      id: 'sub1',
      name: 'Direito Administrativo',
      topics: [
        { id: 't1', name: 'Atos Administrativos', status: 'Em andamento' },
        { id: 't2', name: 'Licitações e Contratos Administrativos', status: 'Em andamento' },
      ],
    },
  ];
  const diff = buildPostEditalDiff({
    incomingSubjects: [
      {
        name: 'Direito Administrativo',
        topics: [
          { name: 'Atos Administrativos' },
          { name: 'Licitações Contratos Administrativos Nova Lei' },
          { name: 'Terceiro Setor e Parcerias Público-Privadas' },
        ],
      },
    ],
    existingSubjects,
    sessions: [{ topicId: 't1', durationSeconds: 1800 }],
    questions: [{ topicId: 't2', resolved: 10, correct: 8 }],
    blueprintSubjects: [{ subjectId: 'sub1', questionWeight: 2 }],
    daysToExam: 45,
    weeklyAvailableMinutes: 1200,
  });

  assert.equal(diff.coveredCount, 1);
  assert.equal(diff.equivalentCandidateCount, 1);
  assert.equal(diff.deltaNewCount, 1);
  assert.equal(diff.baggageReusePercent, 33);
  assert.equal(diff.deltaEstimatedHours, 1.5);
  assert.equal(diff.viable, true);
});
