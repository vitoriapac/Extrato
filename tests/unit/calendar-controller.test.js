import test from 'node:test';
import assert from 'node:assert/strict';
import { createCalendarState } from '../../src/ui/calendar/calendar-state.js';
import { createCalendarController } from '../../src/ui/calendar/calendar-controller.js';
function service() {
  const items = [];
  return {
    items,
    create(item) {
      const value = { id: 'c' + (items.length + 1), status: 'Pendente', ...item };
      items.push(value);
      return value;
    },
    getById(id) {
      return items.find(x => x.id === id);
    },
    update(id, patch) {
      const item = this.getById(id);
      Object.assign(item, patch);
      return item;
    },
    remove(id) {
      const index = items.findIndex(x => x.id === id);
      return index < 0 ? null : items.splice(index, 1)[0];
    },
  };
}
test('controlador do calendário mantém mutações fora do renderer', () => {
  const repository = service(),
    state = createCalendarState(),
    renders = [];
  const controller = createCalendarController({
    service: repository,
    state,
    onChange: () => renders.push(state.filters),
  });
  const item = controller.create({ title: 'Revisão' });
  controller.beginEdit(item.id);
  controller.update('title', 'Revisão atualizada');
  controller.save();
  controller.complete(item.id);
  controller.setFilter('status', 'Concluído');
  assert.equal(repository.items[0].title, 'Revisão atualizada');
  assert.equal(repository.items[0].status, 'Concluído');
  assert.equal(state.filters.status, 'Concluído');
  assert.ok(renders.length >= 4);
});
test('controlador do calendário cancela edição sem persistir o rascunho', () => {
  const repository = service(),
    state = createCalendarState(),
    controller = createCalendarController({ service: repository, state });
  const item = controller.create({ title: 'Original' });
  controller.beginEdit(item.id);
  controller.update('title', 'Rascunho');
  controller.cancelEdit();
  assert.equal(repository.items[0].title, 'Original');
});
test('controlador cobre visualização, seleção, filtros e mês', () => {
  const repository = service(),
    state = createCalendarState({ month: new Date(2026, 8, 1) }),
    controller = createCalendarController({ service: repository, state });
  controller.setView('agenda');
  controller.select('c1');
  controller.setFilter('status', 'Concluído');
  controller.clearFilters();
  controller.goToNextMonth();
  assert.equal(state.view, 'agenda');
  assert.equal(state.selectedId, 'c1');
  assert.equal(state.filters.status, '');
  assert.equal(state.month.getMonth(), 9);
  controller.clearSelection();
  assert.equal(state.selectedId, null);
});

test('filtros e mês voltam a lista do calendário para a página 1', () => {
  const state = createCalendarState({ month: new Date(2026, 8, 1) });
  const controller = createCalendarController({ service: service(), state });
  assert.equal(state.calendarPage, 1);
  state.calendarPage = 3;
  controller.setFilter('status', 'Concluído');
  assert.equal(state.calendarPage, 1);
  state.calendarPage = 2;
  controller.clearFilters();
  assert.equal(state.calendarPage, 1);
  state.calendarPage = 2;
  controller.setMonth(new Date(2026, 9, 1));
  assert.equal(state.calendarPage, 1);
});
