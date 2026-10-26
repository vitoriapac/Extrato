export function createQuestionController({ service, onChange = () => {} }: any = {}) {
  if (!service) throw new Error('question service is required');
  const refresh = () => onChange(service.list());
  return {
    create(input: Record<string, unknown>) {
      const value = service.create(input);
      refresh();
      return value;
    },
    update(id: string, changes: Record<string, unknown>) {
      const value = service.update(id, changes);
      refresh();
      return value;
    },
    remove(id: string) {
      const value = service.remove(id);
      refresh();
      return value;
    },
    refresh,
  };
}
