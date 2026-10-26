export function createEditableCollectionController({
  service,
  clone = (value: unknown) => structuredClone(value),
  render = () => {},
  normalize = (value: unknown) => value,
  onSaved = () => {},
  initialState = {},
}: any = {}) {
  if (!service || typeof service.find !== 'function')
    throw new TypeError('Controlador de edição requer serviço de coleção.');
  const state = { editingId: null, editingIsNew: false, draft: null, ...initialState };
  const reset = () => Object.assign(state, { editingId: null, editingIsNew: false, draft: null });
  return Object.freeze({
    state,
    begin: (id: string, { isNew = false } = {}) => {
      if (state.editingIsNew && state.editingId !== id) service.remove(state.editingId);
      const item = service.find(id);
      if (!item) return null;
      Object.assign(state, { editingId: id, editingIsNew: isNew, draft: clone(item) });
      render();
      return state.draft;
    },
    update: (field: string, value: unknown) => {
      if (!state.draft) return null;
      state.draft[field] = value;
      return state.draft;
    },
    cancel: () => {
      if (state.editingIsNew && state.editingId) service.remove(state.editingId);
      reset();
      render();
    },
    save: () => {
      if (!state.draft || !service.find(state.editingId)) return null;
      const saved = service.update(state.editingId, normalize(clone(state.draft)));
      reset();
      onSaved(saved);
      return saved;
    },
    reset,
  });
}
