import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { buildAchievementNotice } from '../../src/application/achievements/achievement-notice.js';
import { AchievementToast } from '../../src/ui/components/AchievementToast.js';

const badges = [
  { id: 'hours100', name: 'Cem horas', desc: '100 horas de estudo registradas' },
  { id: 'q1000', name: 'Mil questões', desc: '1.000 questões resolvidas' },
  { id: 'sim5', name: 'Cinco simulados', desc: 'Completou 5 simulados' },
  { id: 'streak7', name: 'Uma semana de foco', desc: '7 dias seguidos estudando' },
];

test('uma conquista: título com o nome e o critério cumprido', () => {
  const notice = buildAchievementNotice(['hours100'], badges);
  assert.equal(notice.title, 'Conquista desbloqueada: Cem horas');
  assert.equal(notice.description, '100 horas de estudo registradas');
  assert.deepEqual(notice.badgeIds, ['hours100']);
});

test('várias conquistas na mesma ação viram um aviso só, com no máximo três emblemas', () => {
  const two = buildAchievementNotice(['hours100', 'q1000'], badges);
  assert.equal(two.title, '2 conquistas desbloqueadas');
  assert.equal(two.description, 'Cem horas e Mil questões');
  const four = buildAchievementNotice(['hours100', 'q1000', 'sim5', 'streak7'], badges);
  assert.equal(four.title, '4 conquistas desbloqueadas');
  assert.equal(four.description, 'Cem horas, Mil questões, Cinco simulados e Uma semana de foco');
  assert.equal(four.badgeIds.length, 3);
});

test('sem conquista conhecida não há aviso', () => {
  assert.equal(buildAchievementNotice([], badges), null);
  assert.equal(buildAchievementNotice(['inexistente'], badges), null);
});

test('o aviso é anunciado (status, polite), tem link para as conquistas e botão de fechar com nome', () => {
  const html = render(
    h(AchievementToast, {
      notice: buildAchievementNotice(['hours100'], badges),
      onView: () => {},
      onDismiss: () => {},
    })
  );
  assert.match(html, /role="status"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /Conquista desbloqueada: Cem horas/);
  assert.match(html, /Ver conquistas/);
  assert.match(html, /aria-label="Fechar aviso de conquista"/);
  assert.match(html, /assets\/achievements\/hours100\.png/);
  assert.match(html, /<img[^>]* alt[ />]/);
});
