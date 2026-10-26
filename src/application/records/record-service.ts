export function createRecordService({
  repository,
  clock,
  idGenerator,
  prefix,
  normalize = (value: unknown) => value,
}: any = {}) {
  if (!repository || !clock || typeof idGenerator !== 'function')
    throw new TypeError('Serviço de registros requer dependências.');
  return Object.freeze({
    list: () => repository.all(),
    find: (id: string) => repository.findById(id),
    create: (input: Record<string, unknown>) =>
      repository.add(normalize({ id: idGenerator(prefix), createdAt: clock.nowISO(), ...input })),
    update: (id: string, changes: Record<string, unknown>) => {
      const current = repository.findById(id);
      return current ? repository.update(id, normalize({ ...current, ...changes })) : null;
    },
    remove: (id: string) => repository.remove(id),
  });
}
