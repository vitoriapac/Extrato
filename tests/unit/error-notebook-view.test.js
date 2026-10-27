import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { ErrorNotebookView } from '../../src/ui/views/ErrorNotebookView.js';
import { createErrorFlashcard } from '../../src/domain/notebook/error-notebook-engine.js';

test('ErrorNotebookView — renderiza métricas e mensagem de deck vazio quando não há cards pendentes', () => {
  const html = render(
    h(ErrorNotebookView, {
      flashcards: [],
      subjects: [
        { id: 's1', name: 'Direito Administrativo', topics: [{ id: 't1', name: 'Atos' }] },
      ],
      todayDate: '2026-10-27',
    })
  );

  assert.ok(html.includes('Caderno de Erros Ativo'));
  assert.ok(html.includes('Revisões Hoje'));
  assert.ok(html.includes('0 cards'));
  assert.ok(html.includes('Tudo revisado por hoje!'));
});

test('ErrorNotebookView — renderiza card ativo com enunciado e botão de revelação', () => {
  const card = createErrorFlashcard({
    topicId: 't1',
    subjectId: 's1',
    statementSummary: 'É cabível mandado de segurança contra ato de gestão comercial?',
    bancaTrap:
      'Confundir concessionária de serviço público com empresa pública em ato puramente privado.',
    correctConcept: 'Não cabe MS contra ato de mera gestão comercial (Súmula 333/STJ).',
    todayDate: '2026-10-27',
  });

  const html = render(
    h(ErrorNotebookView, {
      flashcards: [card],
      subjects: [
        {
          id: 's1',
          name: 'Direito Constitucional',
          topics: [{ id: 't1', name: 'Remédios Constitucionais' }],
        },
      ],
      todayDate: '2026-10-27',
    })
  );

  assert.ok(html.includes('É cabível mandado de segurança contra ato de gestão comercial?'));
  assert.ok(html.includes('Direito Constitucional'));
  assert.ok(html.includes('Remédios Constitucionais'));
  assert.ok(html.includes('Revelar Pegadinha'));
});
