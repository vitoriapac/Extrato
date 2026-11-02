import test from 'node:test';
import assert from 'node:assert/strict';
import { countActiveFilters, filterPanelLabel, toggleFilterPanel } from '../../src/ui/filter-panel.js';

test('conta apenas filtros diferentes do estado inicial', () => {
  assert.equal(
    countActiveFilters(
      { period: '30', subjectId: 'abc', type: '' },
      { period: '30', subjectId: '', type: '' }
    ),
    1
  );
  assert.equal(filterPanelLabel(1), 'Filtros (1 ativo)');
  assert.equal(filterPanelLabel(2), 'Filtros (2 ativos)');
});

test('botão Filtros abre e fecha o painel e atualiza aria-expanded', () => {
  const classes = new Set();
  const panel = { classList: { contains: c => classes.has(c), toggle: (c, on) => (on ? classes.add(c) : classes.delete(c)) } };
  const attrs = {};
  const toggle = { setAttribute: (k, v) => (attrs[k] = v) };
  const doc = /** @type {any} */ ({
    getElementById: id => (id === 'agendaFilters' ? panel : null),
    querySelector: sel => (sel === '[aria-controls="agendaFilters"]' ? toggle : null),
  });
  assert.equal(toggleFilterPanel(doc, 'agenda'), true);
  assert.equal(classes.has('show'), true);
  assert.equal(attrs['aria-expanded'], 'true');
  assert.equal(toggleFilterPanel(doc, 'agenda'), false);
  assert.equal(attrs['aria-expanded'], 'false');
  assert.equal(toggleFilterPanel(doc, 'desconhecido'), false);
});
