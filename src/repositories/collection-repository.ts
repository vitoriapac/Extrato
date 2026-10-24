import { createReviewsRepository } from './reviews-repository.ts';
import { createPlanningRepository } from './planning-repository.ts';
import { createSessionsRepository } from './sessions-repository.ts';
import { createSubjectsRepository } from './subjects-repository.ts';
import { createSettingsRepository } from './settings-repository.ts';

export interface CollectionRepository<T extends { id?: string } = any> {
  readonly all: () => T[];
  readonly findById: (id: string) => T | null;
  readonly add: (item: T) => T;
  readonly remove: (id: string) => T | null;
  readonly update: (id: string, changes: Partial<T>) => T | null;
}

export function createCollectionRepository<T extends { id?: string } = any>({
  getState,
  field,
}: {
  getState?: () => Record<string, any>;
  field?: string;
} = {}): CollectionRepository<T> {
  if (typeof getState !== 'function' || !field)
    throw new TypeError('Repositório requer estado e coleção.');
  const collection = (): T[] => {
    const value = getState()?.[field];
    return Array.isArray(value) ? value : [];
  };
  return Object.freeze({
    all: () => collection(),
    findById: (id: string) => collection().find(item => item.id === id) || null,
    add: (item: T) => {
      collection().push(item);
      return item;
    },
    remove: (id: string) => {
      const items = collection(),
        index = items.findIndex(item => item.id === id);
      return index < 0 ? null : items.splice(index, 1)[0];
    },
    update: (id: string, changes: Partial<T>) => {
      const item = collection().find(entry => entry.id === id);
      if (!item) return null;
      Object.assign(item, changes);
      return item;
    },
  });
}

export function createAppRepositories(getState: () => Record<string, any>) {
  const repositories: Record<string, any> = Object.fromEntries(
    [
      'calendar',
      'questoes',
      'simulados',
      'dailyPlans',
      'studyPlans',
      'recommendationFeedback',
      'topicHistory',
      'metasPorDisciplina',
    ].map(field => [field, createCollectionRepository({ getState, field })])
  );
  repositories.subjects = createSubjectsRepository({ getState });
  repositories.studySessions = createSessionsRepository({ getState });
  repositories.reviewAgenda = createReviewsRepository({ getState });
  repositories.planning = createPlanningRepository({ getState });
  repositories.settings = createSettingsRepository({ getState });
  return Object.freeze(repositories);
}
