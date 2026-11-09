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
  assert.match(html, /Estudar/);
  assert.match(html, /Colar Edital \(PDF\)/);
  assert.match(html, /tecconcursos\.com\.br\/questoes\/cadernos/);
  assert.match(html, /qconcursos\.com\/questoes-de-concursos\/questoes/);
});

test('VerticalizedSyllabusView — renderiza link de caderno personalizado quando customPracticeUrl é configurada', () => {
  const customNotebookUrl = 'https://www.tecconcursos.com.br/questoes/cadernos/proprio/8888';
  const subjects = [
    {
      id: 's2',
      name: 'Direito Administrativo',
      topics: [
        {
          id: 't2',
          name: 'Atos Administrativos',
          customPracticeUrl: customNotebookUrl,
        },
      ],
    },
  ];

  const html = render(
    h(VerticalizedSyllabusView, {
      subjects,
    })
  );

  assert.match(html, /Caderno/);
  assert.ok(html.includes(customNotebookUrl));
  assert.match(html, /QC/);
});

test('VerticalizedSyllabusView — renderiza estado vazio quando não há tópicos', () => {
  const html = render(
    h(VerticalizedSyllabusView, {
      subjects: [],
    })
  );

  assert.match(html, /Nenhum tópico encontrado no edital/);
});
