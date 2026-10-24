import type { TopicDifficulty, TopicStatus } from '../core/types.ts';

export const STORAGE_KEY = 'bb-premium-study-data';
export const BACKUP_KEY = STORAGE_KEY + '-automatic-backup';
export const BACKUP_INDEX_KEY = BACKUP_KEY + '-index';
export const AUTOMATIC_BACKUP_SLOTS = 5;
export const CURRENT_SCHEMA_VERSION = 28;
export const MAX_BACKUP_FILE_SIZE = 10 * 1024 * 1024;
export const DB_NAME = 'extrato-estudos-db';
export const DB_VERSION = 1;
export const STORE_NAME = 'app-state';
export const DEMO_STORAGE_KEY = 'bb-premium-study-demo';
export const MODE_STORAGE_KEY = 'bb-premium-mode';

export const STATUS_OPTIONS: TopicStatus[] = [
  'Não iniciado',
  'Em andamento',
  'Revisão',
  'Concluído',
];
export const REVIEW_OPTIONS: string[] = [
  '—',
  'Revisão rápida',
  'Revisão completa',
  'Questões',
  'Resumo/Mapa mental',
];
export const STATUS_CLASS: Record<TopicStatus, string> = {
  'Não iniciado': 'st-nao',
  'Em andamento': 'st-and',
  Revisão: 'st-rev',
  Concluído: 'st-con',
};
export const TIPO_AGENDA_OPTIONS: string[] = [
  'Revisão 24h',
  'Revisão 3 dias',
  'Revisão 7 dias',
  'Revisão 14 dias',
  'Revisão 15 dias',
  'Revisão 30 dias',
  'Revisão livre',
];
export const DIFFICULTY_OPTIONS: TopicDifficulty[] = ['Fácil', 'Médio', 'Difícil'];
export const DIFFICULTY_WEIGHT: Record<TopicDifficulty, number> = {
  Fácil: 1,
  Médio: 2,
  Difícil: 3,
};
export const DIFFICULTY_CLASS: Record<TopicDifficulty, string> = {
  Fácil: 'diff-facil',
  Médio: 'diff-medio',
  Difícil: 'diff-dificil',
};
