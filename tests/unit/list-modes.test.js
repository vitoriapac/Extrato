import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  CONTROLLER_PAGED,
  DEFAULT_PAGE_SIZE,
  DOM_LISTS,
  OUTSIDE_THE_MOUNTER,
  PAGINATION_THRESHOLD,
} from '../../src/ui/list-modes.ts';
import { PAGED_LIST_RENDERERS } from '../../src/ui/events/delegated-actions.ts';

test('a regra: acima de 20 itens possíveis pagina, o resto usa Mostrar mais', () => {
  assert.equal(PAGINATION_THRESHOLD, 20);
  const wrong = DOM_LISTS.filter(list => {
    if (list.exception) return false;
    return list.ceiling > PAGINATION_THRESHOLD !== (list.mode === 'pages');
  }).map(list => `${list.selector}: teto ${list.ceiling} em "${list.mode}"`);
  assert.deepEqual(wrong, [], 'lista fora da regra e sem exceção declarada');
});

test('exceção só existe onde a regra seria quebrada, e sempre com motivo', () => {
  for (const list of DOM_LISTS.filter(item => item.exception !== undefined)) {
    assert.ok(list.exception.length > 20, `${list.selector}: motivo curto demais`);
    assert.equal(list.mode, 'more', `${list.selector}: exceção só vale para "Mostrar mais"`);
    assert.ok(list.ceiling > PAGINATION_THRESHOLD, `${list.selector}: exceção sem necessidade`);
  }
});

test('listas paginadas têm rótulo, tamanho de página e teto acima do limiar', () => {
  for (const list of DOM_LISTS.filter(item => item.mode === 'pages')) {
    assert.ok(list.label, `${list.selector}: falta o rótulo da contagem`);
    assert.ok(
      list.limit >= 1 && list.limit <= PAGINATION_THRESHOLD,
      `${list.selector}: página inválida`
    );
    assert.ok(list.ceiling > PAGINATION_THRESHOLD, `${list.selector}: pagina uma lista curta`);
  }
  assert.ok(DOM_LISTS.some(list => list.limit === DEFAULT_PAGE_SIZE));
});

test('cada lista é declarada uma vez só', () => {
  const selectors = DOM_LISTS.map(list => list.selector);
  assert.equal(new Set(selectors).size, selectors.length);
});

test('as listas paginadas por controller batem com as ações goToListPage', () => {
  const declared = new Set(CONTROLLER_PAGED.map(item => item.key));
  // A chave real das páginas por disciplina é `subjectTopics:<id>`; o resolvedor a trata à parte.
  for (const key of Object.keys(PAGED_LIST_RENDERERS))
    assert.ok(declared.has(key), `${key}: ação goToListPage sem declaração em CONTROLLER_PAGED`);
  for (const item of CONTROLLER_PAGED) {
    assert.ok(item.ceiling > PAGINATION_THRESHOLD, `${item.key}: pagina uma lista curta`);
    if (item.key !== 'subjectTopics')
      assert.ok(PAGED_LIST_RENDERERS[item.key], `${item.key}: declarada sem ação goToListPage`);
  }
});

test('os grupos do plano seguem paginados: sessões, questões, simulados, agenda e históricos', () => {
  const keys = CONTROLLER_PAGED.map(item => item.key);
  for (const key of [
    'sessionDays',
    'questions',
    'simulations',
    'agendaToday',
    'agendaOverdue',
    'agendaUpcoming',
    'agendaCompleted',
    'calendar',
    'subjectTopics',
    'priorityHistory',
  ])
    assert.ok(keys.includes(key), `${key} deixou de ser paginada`);
  const domPaged = DOM_LISTS.filter(item => item.mode === 'pages').map(item => item.selector);
  for (const selector of [
    '#decisionHistoryDashboard',
    '#retentionRecords',
    '#upcomingList',
    '#calAtrasadas',
  ])
    assert.ok(domPaged.includes(selector), `${selector} deixou de ser paginada`);
});

// Guarda: "Mostrar mais" escrito à mão fora do montador volta a abrir um quinto mecanismo.
test('nenhum "Mostrar mais" escrito à mão fora do montador e das exceções declaradas', () => {
  const root = join(import.meta.dirname, '..', '..');
  const allowed = new Set([
    'src/ui/progressive-list.ts',
    'src/ui/list-modes.ts',
    ...OUTSIDE_THE_MOUNTER.map(item => item.file),
  ]);
  const found = [];
  const walk = dir => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.(ts|tsx)$/.test(name)) {
        const rel = relative(root, path).replaceAll('\\', '/');
        const code = readFileSync(path, 'utf8')
          .split('\n')
          .filter(line => !line.trim().startsWith('//') && !line.trim().startsWith('*'))
          .join('\n');
        if (/Mostrar mais|data-progressive-legacy|data-lazy-more/.test(code) && !allowed.has(rel))
          found.push(rel);
      }
    }
  };
  walk(join(root, 'src'));
  assert.deepEqual(found, []);
  for (const item of OUTSIDE_THE_MOUNTER)
    assert.ok(item.reason.length > 20, `${item.file}: motivo`);
});
