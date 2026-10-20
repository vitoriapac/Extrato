import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseDate,
  parseCsvRows,
  normalizeQuestionImportRows,
  QuestionImportError
} from '../../src/domain/questions/question-import-normalizer.js';

// Espelha as chaves de ERROR_CATEGORIES em src/app.js.
const KEYS = ['naoSabia', 'esqueci', 'interpretacao', 'calculo', 'desatencao', 'chute'];
const opts = { errorCategoryKeys: KEYS, defaultDate: '2026-10-20' };

test('parseDate converte formatos brasileiros e ISO para YYYY-MM-DD', () => {
  assert.equal(parseDate('19/10/2026'), '2026-10-19');
  assert.equal(parseDate('19/10/2026 14:30:00'), '2026-10-19');
  assert.equal(parseDate('05-08-2025'), '2025-08-05');
  assert.equal(parseDate('2026-10-19'), '2026-10-19');
  assert.equal(parseDate('2026-10-19T10:00:00Z'), '2026-10-19');
  assert.equal(parseDate('', '2026-01-01'), '2026-01-01');
  assert.equal(parseDate('data-invalida'), null);
});

test('parseCsvRows interpreta virgula, ponto-e-virgula e campos com aspas', () => {
  const csv = 'col1,col2,"col, com virgula"\nval1;val2;val3\n';
  const rows1 = parseCsvRows('a,b,"c, d"\n1,2,3');
  assert.equal(rows1.length, 2);
  assert.equal(rows1[0].values[2], 'c, d');

  const rows2 = parseCsvRows('a;b;c\n1;2;3');
  assert.equal(rows2.length, 2);
  assert.deepEqual(rows2[1].values, ['1', '2', '3']);
});

test('interpreta formato padrão StudyTrack (resumo com disciplina, tópico, acertos e erros)', () => {
  const csv = 'Data,Disciplina,Tópico,Resolvidas,Acertos,Erros\n19/10/2026,Português,Crase,20,18,2\n19/10/2026,Matemática,Porcentagem,15,12,3';
  const result = normalizeQuestionImportRows(csv, opts);
  assert.equal(result.length, 2);
  assert.equal(result[0].subjectName, 'Português');
  assert.equal(result[0].topicName, 'Crase');
  assert.equal(result[0].date, '2026-10-19');
  assert.equal(result[0].resolved, 20);
  assert.equal(result[0].correct, 18);
  assert.equal(result[0].sourceLinesCount, 1);
});

test('interpreta formato QConcursos (Matéria, Assunto, Resolvidas, Acertos)', () => {
  const csv = 'materia;assunto;data;questoes;acertos\nConhecimentos Bancários;PIX;15/09/2026;30;27';
  const result = normalizeQuestionImportRows(csv, opts);
  assert.equal(result.length, 1);
  assert.equal(result[0].subjectName, 'Conhecimentos Bancários');
  assert.equal(result[0].topicName, 'PIX');
  assert.equal(result[0].date, '2026-09-15');
  assert.equal(result[0].resolved, 30);
  assert.equal(result[0].correct, 27);
});

test('interpreta formato questão por questão (QConcursos/Tec com Resultado "Acertou"/"Errou") e agrega por data e tópico', () => {
  const csv = `Data,Disciplina,Assunto,Resultado
18/10/2026,Informática,Segurança da Informação,Acertou
18/10/2026,Informática,Segurança da Informação,Acertou
18/10/2026,Informática,Segurança da Informação,Errou
18/10/2026,Informática,Redes de Computadores,Acertou`;

  const result = normalizeQuestionImportRows(csv, opts);
  assert.equal(result.length, 2);

  const seg = result.find(r => r.topicName === 'Segurança da Informação');
  assert.ok(seg);
  assert.equal(seg.resolved, 3);
  assert.equal(seg.correct, 2);
  assert.equal(seg.sourceLinesCount, 3);

  const redes = result.find(r => r.topicName === 'Redes de Computadores');
  assert.ok(redes);
  assert.equal(redes.resolved, 1);
  assert.equal(redes.correct, 1);
});

test('interpreta formato Tec Concursos (Data da Resolução, Matéria, Caderno, Resultado "Certo"/"Errado")', () => {
  const csv = `Data da Resolução,Matéria,Caderno,Resultado
2026-10-10,Direito Administrativo,Atos Administrativos,Certo
2026-10-10,Direito Administrativo,Atos Administrativos,Errado
2026-10-10,Direito Administrativo,Atos Administrativos,Certo`;

  const result = normalizeQuestionImportRows(csv, opts);
  assert.equal(result.length, 1);
  assert.equal(result[0].subjectName, 'Direito Administrativo');
  assert.equal(result[0].topicName, 'Atos Administrativos');
  assert.equal(result[0].resolved, 3);
  assert.equal(result[0].correct, 2);
});

test('rejeita arquivo vazio, cabeçalhos inválidos e valores inconsistentes', () => {
  assert.throws(() => normalizeQuestionImportRows('', opts), error => error instanceof QuestionImportError && error.issues[0].code === 'empty');
  assert.throws(() => normalizeQuestionImportRows('sem_cabecalho_valido\n1,2,3', opts), error => error instanceof QuestionImportError);

  const csvInvalido = `Data,Disciplina,Tópico,Resolvidas,Acertos
19/10/2026,Português,Crase,10,15
19/10/2026,,Sintaxe,10,8
data_errada,Matemática,Geometria,10,8
19/10/2026,História,Brasil,0,0`;

  assert.throws(() => normalizeQuestionImportRows(csvInvalido, opts), error => {
    assert.ok(error instanceof QuestionImportError);
    assert.equal(error.issues.length, 4);
    return true;
  });
});

test('categorias de erro do CSV são gravadas com as chaves de ERROR_CATEGORIES do app', () => {
  const expected = {
    lacuna: 'naoSabia', 'Conteúdo': 'naoSabia', 'Não sabia': 'naoSabia', naoSabia: 'naoSabia',
    'Atenção': 'desatencao', 'Distração': 'desatencao', 'Desatenção': 'desatencao',
    'Interpretação': 'interpretacao', Leitura: 'interpretacao', Pegadinha: 'interpretacao',
    Tempo: 'chute', Chute: 'chute', Esqueci: 'esqueci', 'Cálculo': 'calculo'
  };
  for (const [raw, key] of Object.entries(expected)) {
    const [record] = normalizeQuestionImportRows(`Disciplina,Data,Resolvidas,Acertos,Motivo\nPortuguês,19/10/2026,5,2,${raw}`, opts);
    assert.deepEqual(Object.keys(record.errorBreakdown), KEYS, raw);
    assert.equal(record.errorBreakdown[key], 3, `${raw} → ${key}`);
    assert.equal(record.unknownErrorCategoryCount, 0, raw);
  }
});

test('categoria de erro desconhecida importa a linha sem categoria e é contada', () => {
  const csv = `Disciplina,Data,Resultado,Motivo
Português,19/10/2026,Errou,sono
Português,19/10/2026,Errou,atencao
Português,19/10/2026,Acertou,`;
  const [record] = normalizeQuestionImportRows(csv, opts);
  assert.equal(record.resolved, 3);
  assert.equal(record.unknownErrorCategoryCount, 1);
  assert.equal(record.errorBreakdown.desatencao, 1);
  assert.equal(Object.values(record.errorBreakdown).reduce((a, b) => a + b, 0), 1);
});

test('normalizeQuestionImportRows exige errorCategoryKeys', () => {
  assert.throws(() => normalizeQuestionImportRows('Disciplina,Acertos\nPortuguês,1'), /errorCategoryKeys/);
});

test('parseDate rejeita datas que não existem no calendário', () => {
  assert.equal(parseDate('31/02/2026'), null);
  assert.equal(parseDate('2026-13-01'), null);
  assert.equal(parseDate('00/01/2026'), null);
  assert.equal(parseDate('2026-04-31'), null);
  assert.equal(parseDate('29/02/2028'), '2028-02-29');
  assert.equal(parseDate('29/02/2026'), null);

  assert.throws(
    () => normalizeQuestionImportRows('Data,Disciplina,Resolvidas,Acertos\n31/02/2026,Português,10,8', opts),
    error => error instanceof QuestionImportError && error.issues[0].code === 'invalid_date' && error.issues[0].line === 2
  );
});

test('linha sem data usa a defaultDate injetada; defaultDate é obrigatória', () => {
  const [semColuna] = normalizeQuestionImportRows('Disciplina,Resolvidas,Acertos\nPortuguês,10,8', opts);
  assert.equal(semColuna.date, '2026-10-20');
  const [celulaVazia] = normalizeQuestionImportRows('Data,Disciplina,Resolvidas,Acertos\n,Português,10,8', opts);
  assert.equal(celulaVazia.date, '2026-10-20');

  assert.throws(() => normalizeQuestionImportRows('Disciplina,Acertos\nPortuguês,1', { errorCategoryKeys: KEYS }), /defaultDate/);
  assert.throws(() => normalizeQuestionImportRows('Disciplina,Acertos\nPortuguês,1', { errorCategoryKeys: KEYS, defaultDate: '2026-02-31' }), /defaultDate/);
});

test('delimitador é detectado no cabeçalho e só ele separa colunas', () => {
  const pontoEVirgula = parseCsvRows('Disciplina;Tópico;Resolvidas;Acertos\nPortuguês;Crase, regência;10;8');
  assert.deepEqual(pontoEVirgula[1].values, ['Português', 'Crase, regência', '10', '8']);

  const tab = parseCsvRows('Disciplina\tTópico\tResolvidas\nPortuguês\tCrase; regência, uso\t10');
  assert.deepEqual(tab[1].values, ['Português', 'Crase; regência, uso', '10']);

  const virgula = parseCsvRows('Disciplina,Tópico,Resolvidas\nPortuguês,"Crase, regência",10');
  assert.deepEqual(virgula[1].values, ['Português', 'Crase, regência', '10']);

  // Separador entre aspas no cabeçalho não conta; empate → vírgula.
  assert.equal(parseCsvRows('"a;b;c",d\n1,2')[0].values.length, 2);
  assert.equal(parseCsvRows('Disciplina\nPortuguês;Crase')[1].values.length, 1);

  const [record] = normalizeQuestionImportRows('Data;Disciplina;Tópico;Resolvidas;Acertos\n19/10/2026;Português;Crase, regência;10;8', opts);
  assert.equal(record.topicName, 'Crase, regência');
  assert.equal(record.resolved, 10);
});

test('modelo CSV para download é datado com o dia informado e passa na importação', async () => {
  const { buildQuestionImportTemplate, QUESTION_IMPORT_TEMPLATE_FILE_NAME } = await import('../../src/features/question-import/question-import-template.js');
  assert.match(QUESTION_IMPORT_TEMPLATE_FILE_NAME, /\.csv$/);
  const records = normalizeQuestionImportRows(buildQuestionImportTemplate('2026-03-07'), opts);
  assert.equal(records.length, 2);
  assert.ok(records.every(record => record.date === '2026-03-07'));
});
