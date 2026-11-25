import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseRawSyllabusText,
  mergeParsedSyllabusTopics,
  splitParsedSyllabusTopic,
  serializeParsedSyllabusJson,
} from '../../src/application/subjects/raw-syllabus-parser.js';

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

test('parseRawSyllabusText — remove ruído de PDF, junta hifenização e reconhece FGV/FCC/Vunesp/Cesgranrio', () => {
  const rawText = `
ANEXO II - CONTEÚDO PROGRAMÁTICO
CONHECIMENTOS BÁSICOS
Página 14 de 48
RACIOCÍNIO LÓGICO-MATEMÁTICO: 1 Estruturas lógicas. 2 Lógica de argumentação.
CONHECIMENTOS ESPECÍFICOS
DIREITO TRIBUTÁRIO (CTN E CF/88):
Sistema Tributário Nacional: princípios constitucionais tributários; limitações ao poder de tributar; Lei Complementar nº 116/2003; administra-
ção tributária e dívida ativa.
`;

  const result = parseRawSyllabusText(rawText);

  assert.equal(result.totalSubjects, 2);
  assert.equal(result.subjects[0].name, 'RACIOCÍNIO LÓGICO-MATEMÁTICO');
  assert.equal(result.subjects[0].topics.length, 2);
  assert.equal(result.subjects[1].name, 'DIREITO TRIBUTÁRIO (CTN E CF/88)');
  assert.ok(result.subjects[1].topics.length >= 3);
  assert.ok(
    result.subjects[1].topics.some(t => t.name.includes('administração tributária e dívida ativa'))
  );
});

test('mergeParsedSyllabusTopics, splitParsedSyllabusTopic e serializeParsedSyllabusJson funcionam de forma pura', () => {
  const initial = [
    {
      name: 'Direito Constitucional',
      topics: [
        { name: 'Direitos e garantias' },
        { name: 'fundamentais (Art. 5º)' },
        { name: 'Poder Executivo; Poder Legislativo', code: '3' },
      ],
    },
  ];

  const merged = mergeParsedSyllabusTopics(initial, 0, 1);
  assert.equal(merged[0].topics.length, 2);
  assert.equal(merged[0].topics[0].name, 'Direitos e garantias fundamentais (Art. 5º)');

  const split = splitParsedSyllabusTopic(merged, 0, 1);
  assert.equal(split[0].topics.length, 3);
  assert.equal(split[0].topics[1].name, 'Poder Executivo');
  assert.equal(split[0].topics[2].name, 'Poder Legislativo');
  assert.equal(split[0].topics[2].code, '3.2');

  const json = JSON.parse(
    serializeParsedSyllabusJson({ subjects: split }, { name: 'TJ-SP', banca: 'Vunesp', year: 2026 })
  );
  assert.equal(json.name, 'TJ-SP');
  assert.equal(json.banca, 'Vunesp');
  assert.equal(json.subjects[0].topics.length, 3);
});
