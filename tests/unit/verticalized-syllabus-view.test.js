import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { VerticalizedSyllabusView } from '../../src/ui/views/VerticalizedSyllabusView.js';

test('VerticalizedSyllabusView — renderiza tabela de disciplinas com etapas de estudo e botão de ação', () => {
  const subjects = [
    {
      id: 's1',
      name: 'Direito Constitucional',
      topics: [
        {
          id: 't1',
          name: 'Direitos Individuais e Coletivos',
          status: 'Em andamento',
          stageChecklist: {
            theoryDone: true,
            summaryDone: false,
            lawOrNotesDone: true,
            questionsDone: false,
          },
        },
      ],
    },
  ];

  const html = render(
    h(VerticalizedSyllabusView, {
      subjects,
      onToggleStage: () => {},
      onStartStudy: () => {},
    })
  );

  assert.match(html, /Edital Verticalizado Interativo/);
  assert.match(html, /Direito Constitucional/);
  assert.match(html, /Direitos Individuais e Coletivos/);
  assert.match(html, /Teoria/);
  assert.match(html, /Resumo/);
  assert.match(html, /Lei Seca/);
  assert.match(html, /Questões/);
  assert.match(html, /▶ Estudar/);
  assert.match(html, /Colar Edital \(PDF\)/);
});

test('VerticalizedSyllabusView — renderiza estado vazio quando não há tópicos', () => {
  const html = render(
    h(VerticalizedSyllabusView, {
      subjects: [],
    })
  );

  assert.match(html, /Nenhum tópico encontrado no edital/);
});
