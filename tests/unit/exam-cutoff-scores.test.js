import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateCutoffScores,
  validateExamCatalog,
  isOfficialSourceUrl,
  cutoffScoresFor,
} from '../../src/domain/exams/exam-catalog.js';

const entry = {
  banca: 'Cesgranrio',
  cargo: 'Escriturário',
  praca: 'Nacional',
  ano: 2023,
  modalidade: 'Ampla concorrência',
  score: 60,
  scale: 100,
  sourceUrl: 'https://www.cesgranrio.org.br/concursos/resultado',
};
const validate = overrides => validateCutoffScores({ p: { cutoffScores: [{ ...entry, ...overrides }] } });

test('nota de corte com link oficial e campos completos é aceita', () => {
  assert.deepEqual(validate({}).errors, []);
  assert.equal(validate({ sourceUrl: 'https://www.gov.br/mgi/resultado' }).valid, true);
});

test('nota de corte sem link oficial é recusada', () => {
  assert.match(validate({ sourceUrl: '' }).errors[0], /sem link oficial/);
  assert.match(validate({ sourceUrl: 'https://blogdoconcurso.com.br/nota' }).errors[0], /sem link oficial/);
  assert.match(validate({ sourceUrl: 'http://www.gov.br/x' }).errors[0], /sem link oficial/);
  assert.equal(isOfficialSourceUrl('https://evilgov.br/x'), false);
  assert.equal(isOfficialSourceUrl('https://gov.br.evil.com/x'), false);
});

test('campos obrigatórios e escala são validados', () => {
  assert.match(validate({ praca: '' }).errors[0], /falta praca/);
  assert.match(validate({ banca: ' ' }).errors[0], /falta banca/);
  assert.match(validate({ ano: '2023' }).errors[0], /ano inválido/);
  assert.match(validate({ scale: 0 }).errors[0], /escala inválida/);
  assert.match(validate({ score: 120 }).errors[0], /fora da escala/);
});

test('catálogo real segue válido e perfil sem nota devolve lista vazia', () => {
  assert.equal(validateExamCatalog().valid, true);
  assert.deepEqual(cutoffScoresFor('bb-escriturario-2023'), []);
  assert.deepEqual(cutoffScoresFor('inexistente'), []);
});
