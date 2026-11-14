import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isNearAchievement,
  buildSessionAchievementNote,
} from '../../src/application/achievements/achievement-progress-note.js';
import { renderSessionResult } from '../../src/ui/renderers/session-result-renderer.js';

const progress = (current, target, unit) => ({ current, target, unit });

test('perto: falta até 10% do critério', () => {
  assert.equal(isNearAchievement(progress(90, 100, 'tópicos')), true); // falta 10 = 10%
  assert.equal(isNearAchievement(progress(89, 100, 'revisões')), false); // falta 11 > 10% e > 1
  assert.equal(isNearAchievement(progress(460, 500, 'questões')), true); // 40 = 8%
});

test('perto: cumprível hoje, por unidade (1 dia, 1 h, 30 questões, 1 simulado)', () => {
  assert.equal(isNearAchievement(progress(6, 7, 'dias')), true); // 14% mas falta 1 dia
  assert.equal(isNearAchievement(progress(5, 7, 'dias')), false);
  assert.equal(isNearAchievement(progress(9, 10, 'horas')), true);
  assert.equal(isNearAchievement(progress(8.9, 10, 'horas')), false);
  assert.equal(isNearAchievement(progress(70, 100, 'questões')), true); // falta 30
  assert.equal(isNearAchievement(progress(69, 100, 'questões')), false);
  assert.equal(isNearAchievement(progress(4, 5, 'simulados')), true);
});

test('perto: sem progresso, alvo inválido ou já cumprido não conta', () => {
  assert.equal(isNearAchievement(null), false);
  assert.equal(isNearAchievement(progress(5, 0, 'dias')), false);
  assert.equal(isNearAchievement(progress(10, 10, 'dias')), false);
});

const items = [
  { id: 'q1000', name: 'Mil questões', unlocked: false, progress: progress(963, 1000, 'questões') },
  { id: 'streak7', name: 'Uma semana de foco', unlocked: false, progress: progress(6, 7, 'dias') },
  { id: 'hours100', name: 'Cem horas', unlocked: true, progress: progress(100, 100, 'horas') },
];

test('sem desbloqueio novo, mostra a mais perto com quanto falta', () => {
  const note = buildSessionAchievementNote(items, { hours100: { source: 'migrated' } }, true);
  // Mil questões falta 3,7% do alvo; Uma semana falta 14,3%: a primeira é a mais perto.
  assert.equal(note.kind, 'near');
  assert.equal(note.text, 'Faltam 37 questões para Mil questões.');
});

test('desbloqueio da sessão tem prioridade sobre a mais perto', () => {
  const note = buildSessionAchievementNote(items, {}, true);
  assert.equal(note.kind, 'unlocked');
  assert.equal(note.text, 'Conquista desbloqueada: Cem horas.');
});

test('antes da primeira leitura nada é novo: cai na mais perto', () => {
  const note = buildSessionAchievementNote(items, {}, false);
  assert.equal(note.kind, 'near');
});

test('sem desbloqueio e sem nada perto não mostra nada', () => {
  const far = [
    { id: 'q500', name: 'Quinhentas', unlocked: false, progress: progress(10, 500, 'questões') },
  ];
  assert.equal(buildSessionAchievementNote(far, {}, true), null);
});

test('unidades: 1 dia no singular e horas com vírgula decimal', () => {
  const day = buildSessionAchievementNote(
    [{ id: 's', name: 'Semana', unlocked: false, progress: progress(6, 7, 'dias') }],
    {},
    true
  );
  assert.equal(day.text, 'Faltam 1 dia para Semana.');
  const hours = buildSessionAchievementNote(
    [{ id: 'h', name: 'Dez horas', unlocked: false, progress: progress(9.5, 10, 'horas') }],
    {},
    true
  );
  assert.equal(hours.text, 'Faltam 0,5 h para Dez horas.');
});

test('o resultado da sessão mostra a nota de conquista, e some quando não há', () => {
  const base = { type: 'Questões', subject: 'Português', duration: '10 min' };
  const withNote = renderSessionResult({
    ...base,
    achievement: { kind: 'near', text: 'Faltam 2 dias para Semana.' },
  });
  assert.match(withNote, /class="session-achievement" data-achievement-note="near"/);
  assert.match(withNote, /Faltam 2 dias para Semana\./);
  assert.doesNotMatch(renderSessionResult({ ...base, achievement: null }), /session-achievement/);
});

const planItem = (id, extra = {}) => ({ id, status: 'pending', plannedMinutes: 30, ...extra });
const badge = (id, name, current, target, unit, unlocked = false) => ({
  id,
  name,
  unlocked,
  progress: { current, target, unit },
});

test('marca do plano: a primeira atividade pendente que completa uma conquista, e só uma', async () => {
  const { pickPlanAchievementMark } =
    await import('../../src/application/achievements/achievement-progress-note.js');
  const items = [
    planItem('a', { status: 'completed', recommendedQuestions: 50 }),
    planItem('b', { recommendedQuestions: 10 }),
    planItem('c', { recommendedQuestions: 40 }),
    planItem('d', { recommendedQuestions: 40 }),
  ];
  const mark = pickPlanAchievementMark(
    items,
    [badge('q1000', 'Mil questões', 963, 1000, 'questões')],
    {
      studiedToday: true,
    }
  );
  // "a" já foi concluída, "b" não basta (10 < 37): a marca vai para "c", e "d" fica sem.
  assert.deepEqual(mark, {
    itemId: 'c',
    achievementId: 'q1000',
    text: 'Conclui a conquista Mil questões',
  });
});

test('marca do plano: horas contam o tempo que falta na atividade', async () => {
  const { pickPlanAchievementMark } =
    await import('../../src/application/achievements/achievement-progress-note.js');
  const hours = [badge('hours10', 'Dez horas', 9.6, 10, 'horas')];
  // Faltam 24 min; a atividade de 30 min já teve 10 min executados: sobram 20, não basta.
  assert.equal(
    pickPlanAchievementMark([planItem('a', { executedSeconds: 600 })], hours, {
      studiedToday: true,
    }),
    null
  );
  assert.equal(pickPlanAchievementMark([planItem('a')], hours, { studiedToday: true }).itemId, 'a');
});

test('marca do plano: sequência só conta se hoje ainda não teve estudo', async () => {
  const { pickPlanAchievementMark } =
    await import('../../src/application/achievements/achievement-progress-note.js');
  const streak = [badge('streak7', 'Uma semana de foco', 6, 7, 'dias')];
  assert.equal(pickPlanAchievementMark([planItem('a')], streak, { studiedToday: true }), null);
  assert.equal(
    pickPlanAchievementMark([planItem('a')], streak, { studiedToday: false }).achievementId,
    'streak7'
  );
  assert.equal(
    pickPlanAchievementMark([planItem('a')], [badge('streak7', 'S', 5, 7, 'dias')], {
      studiedToday: false,
    }),
    null
  );
});

test('marca do plano: sem conquista alcançável, já desbloqueada ou sem itens não marca nada', async () => {
  const { pickPlanAchievementMark } =
    await import('../../src/application/achievements/achievement-progress-note.js');
  assert.equal(pickPlanAchievementMark([], [badge('q100', 'Cem', 99, 100, 'questões')]), null);
  assert.equal(
    pickPlanAchievementMark(
      [planItem('a', { recommendedQuestions: 20 })],
      [badge('q100', 'Cem', 100, 100, 'questões', true), badge('q500', 'Q', 100, 500, 'questões')]
    ),
    null
  );
});
