import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanTopicName,
  buildPracticeSearchQuery,
  isValidPracticeUrl,
  buildPracticeLinks,
} from '../../src/domain/questions/practice-link-generator.js';

test('cleanTopicName — limpa prefixos numéricos e marcadores de tópicos de concurso', () => {
  assert.equal(cleanTopicName('1. Atos Administrativos'), 'Atos Administrativos');
  assert.equal(cleanTopicName('1.1.2 Teoria Geral'), 'Teoria Geral');
  assert.equal(cleanTopicName('10.4.1. - Poder de Polícia'), 'Poder de Polícia');
  assert.equal(cleanTopicName('I - Direitos Fundamentais'), 'Direitos Fundamentais');
  assert.equal(cleanTopicName('IV. Da Organização do Estado'), 'Da Organização do Estado');
  assert.equal(cleanTopicName('a) Recursos em Espécie'), 'Recursos em Espécie');
  assert.equal(cleanTopicName('• Crimes contra o Patrimônio'), 'Crimes contra o Patrimônio');
  assert.equal(cleanTopicName('- Competência Tributária'), 'Competência Tributária');
  assert.equal(cleanTopicName('[NOVO] 1.1 Inquérito Policial.'), 'Inquérito Policial');
  assert.equal(cleanTopicName('(ATUALIZADO) Redação Oficial:'), 'Redação Oficial');
  assert.equal(cleanTopicName('  Direito    Financeiro  '), 'Direito Financeiro');
});

test('cleanTopicName — preserva artigos e nomes legítimos com abreviações', () => {
  assert.equal(cleanTopicName('Art. 5º da CF/88'), 'Art. 5º da CF/88');
  assert.equal(cleanTopicName('Lei 8.112/1990'), 'Lei 8.112/1990');
  assert.equal(cleanTopicName('Regimento Interno do STF'), 'Regimento Interno do STF');
});

test('buildPracticeSearchQuery — combina disciplina com tópicos genéricos ou curtos', () => {
  assert.equal(
    buildPracticeSearchQuery('1. Conceito', 'Direito Administrativo'),
    'Direito Administrativo Conceito'
  );
  assert.equal(
    buildPracticeSearchQuery('Teoria Geral', 'Direito Constitucional'),
    'Direito Constitucional Teoria Geral'
  );
  assert.equal(
    buildPracticeSearchQuery('Princípios', 'Direito Tributário'),
    'Direito Tributário Princípios'
  );
  assert.equal(
    buildPracticeSearchQuery('Controle de Constitucionalidade', 'Direito Constitucional'),
    'Controle de Constitucionalidade'
  );
  assert.equal(
    buildPracticeSearchQuery('Atos Administrativos', 'Direito Administrativo'),
    'Atos Administrativos'
  );
  assert.equal(buildPracticeSearchQuery('Crase'), 'Crase');
});

test('isValidPracticeUrl — valida apenas URLs seguras com protocolo http/https', () => {
  assert.equal(isValidPracticeUrl('https://www.tecconcursos.com.br/questoes/cadernos/123'), true);
  assert.equal(isValidPracticeUrl('http://qconcursos.com/questoes'), true);
  assert.equal(isValidPracticeUrl('javascript:alert(1)'), false);
  assert.equal(isValidPracticeUrl('/questoes/caderno'), false);
  assert.equal(isValidPracticeUrl(''), false);
  assert.equal(isValidPracticeUrl(null), false);
  assert.equal(isValidPracticeUrl(undefined), false);
});

test('buildPracticeLinks — gera URLs determinísticas para TEC e QConcursos', () => {
  const result = buildPracticeLinks({
    topicName: '1.2 Atos Administrativos',
    subjectName: 'Direito Administrativo',
  });

  assert.equal(result.cleanedTopicName, 'Atos Administrativos');
  assert.equal(result.query, 'Atos Administrativos');
  assert.equal(
    result.tecUrl,
    'https://www.tecconcursos.com.br/questoes/cadernos?q=Atos%20Administrativos'
  );
  assert.equal(
    result.qcUrl,
    'https://www.qconcursos.com/questoes-de-concursos/questoes?q=Atos%20Administrativos'
  );
  assert.equal(result.isCustom, false);
  assert.equal(result.primaryUrl, result.tecUrl);
  assert.equal(result.primaryLabel, 'Questões no TEC');
  assert.ok(Object.isFrozen(result));
});

test('buildPracticeLinks — utiliza customUrl quando fornecido e válido', () => {
  const custom = 'https://www.tecconcursos.com.br/questoes/cadernos/proprio/54321';
  const result = buildPracticeLinks({
    topicName: 'Crase',
    subjectName: 'Português',
    customUrl: custom,
  });

  assert.equal(result.isCustom, true);
  assert.equal(result.customUrl, custom);
  assert.equal(result.primaryUrl, custom);
  assert.equal(result.primaryLabel, 'Caderno do tópico');
  assert.ok(result.tecUrl.includes('Crase'));
  assert.ok(result.qcUrl.includes('Crase'));
});
