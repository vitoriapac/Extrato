import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRawSyllabusText } from '../../src/application/subjects/raw-syllabus-parser.js';

test('parseRawSyllabusText — analisa texto contínuo no padrão Cebraspe com subitens numerados', () => {
  const rawText = `
DIREITO ADMINISTRATIVO: 1 Estado, governo e administração pública. 1.1 Conceito, elementos, poderes e organização. 2 Atos administrativos. 2.1 Conceito, requisitos, atributos, classificação e espécies. 2.2 Invalidação, anulação e revogação. 3 Processo administrativo.
`;

  const result = parseRawSyllabusText(rawText);

  assert.equal(result.totalSubjects, 1);
  assert.equal(result.subjects[0].name, 'DIREITO ADMINISTRATIVO');
  assert.ok(result.totalTopics >= 5);

  const topicNames = result.subjects[0].topics.map(t => t.name);
  assert.ok(topicNames.some(n => n.includes('Estado, governo e administração pública')));
  assert.ok(topicNames.some(n => n.includes('Atos administrativos')));
  assert.ok(topicNames.some(n => n.includes('Invalidação, anulação e revogação')));
});

test('parseRawSyllabusText — analisa múltiplas disciplinas com marcadores em linhas separadas', () => {
  const rawText = `
LÍNGUA PORTUGUESA
1 Compreensão e interpretação de textos.
2 Tipologia textual.
3 Ortografia oficial.

DIREITO CONSTITUCIONAL:
- Direitos fundamentais
- Organização dos poderes
- Controle de constitucionalidade
`;

  const result = parseRawSyllabusText(rawText);

  assert.equal(result.totalSubjects, 2);
  assert.equal(result.subjects[0].name, 'LÍNGUA PORTUGUESA');
  assert.equal(result.subjects[0].topics.length, 3);

  assert.equal(result.subjects[1].name, 'DIREITO CONSTITUCIONAL');
  assert.equal(result.subjects[1].topics.length, 3);
  assert.equal(result.subjects[1].topics[0].name, 'Direitos fundamentais');
});

test('parseRawSyllabusText — atribui tópicos sem cabeçalho à disciplina padrão e gera aviso', () => {
  const rawText = `
1. Introdução ao estudo da disciplina
2. Tópico inicial
`;

  const result = parseRawSyllabusText(rawText);

  assert.equal(result.totalSubjects, 1);
  assert.equal(result.subjects[0].name, 'Conteúdo Programático');
  assert.equal(result.totalTopics, 2);
  assert.ok(result.warnings.length > 0);
});

test('parseRawSyllabusText — lida com texto vazio graciosamente', () => {
  const result = parseRawSyllabusText('   ');

  assert.equal(result.totalSubjects, 0);
  assert.equal(result.totalTopics, 0);
  assert.ok(result.warnings.length > 0);
});
