import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import {
  todaySubtabFromHash,
  todaySubtabHash,
  isTodaySubtab,
} from '../../src/ui/tabs/today/today-subtabs.js';
import { TodaySubtabsNav } from '../../src/ui/components/TodaySubtabsNav.js';
import {
  PerformancePageNav,
  performanceGroupOf,
} from '../../src/ui/performance/PerformancePageNav.js';
import { renderAchievementGroups } from '../../src/ui/renderers/achievement-renderer.js';
import { buildAchievementViewModel } from '../../src/application/achievements/build-achievement-view-model.js';

test('hash de Hoje: só "#hoje/conquistas" abre a subaba; o resto cai no plano', () => {
  assert.equal(todaySubtabFromHash('#hoje/conquistas'), 'conquistas');
  assert.equal(todaySubtabFromHash('#hoje/conquistas?x=1'), 'conquistas');
  assert.equal(todaySubtabFromHash('#hoje'), null);
  assert.equal(todaySubtabFromHash('#hoje/outra'), null);
  assert.equal(todaySubtabFromHash('#desempenho/conquistas'), null);
  assert.equal(todaySubtabHash('hoje'), '#hoje');
  assert.equal(todaySubtabHash('conquistas'), '#hoje/conquistas');
  assert.equal(isTodaySubtab('conquistas'), true);
  assert.equal(isTodaySubtab('history'), false);
});

test('abas de Hoje: tablist nomeada, uma aba selecionada e ligada ao painel', () => {
  const html = render(h(TodaySubtabsNav, { activeSubtab: 'conquistas' }));
  assert.equal((html.match(/role="tablist"/g) || []).length, 1);
  assert.match(html, /aria-label="Seções de Hoje"/);
  assert.match(html, /Plano de hoje/);
  assert.equal((html.match(/aria-selected="true"/g) || []).length, 1);
  assert.match(html, /aria-controls="todaySub-conquistas"/);
  assert.match(html, /id="todayTab-conquistas"/);
});

test('Desempenho não tem mais a subaba Conquistas', () => {
  const nav = render(h(PerformancePageNav, { activeSection: 'overview' }));
  assert.doesNotMatch(nav, /Conquistas/);
  assert.equal(performanceGroupOf('history'), null);
});

test('conquista desbloqueada mostra a data salva; sem data inferida, "antes de" o dia do registro', () => {
  const html = renderAchievementGroups(
    buildAchievementViewModel([
      {
        id: 'hours100',
        name: 'Cem horas',
        desc: 'x',
        category: 'consistency',
        unlocked: true,
        unlock: { unlockedAt: '2026-10-02', source: 'migrated' },
      },
      {
        id: 'streak7',
        name: 'Uma semana',
        desc: 'y',
        category: 'consistency',
        unlocked: true,
        unlock: { unlockedAt: null, source: 'migrated', recordedAt: '2026-11-13' },
      },
      { id: 'q1000', name: 'Mil', desc: 'z', category: 'learning', unlocked: false, unlock: null },
    ])
  );
  assert.match(html, /Desbloqueada em 02\/10\/2026/);
  assert.match(html, /Desbloqueada antes de 13\/11\/2026/);
  assert.equal((html.match(/class="badge-date"/g) || []).length, 2);
});

test('a busca global tem o comando Ver conquistas e a Visão Geral deixou de listar conquistas', async () => {
  const { SEARCH_COMMANDS } = await import('../../src/ui/controllers/search-controller.js');
  const achievements = SEARCH_COMMANDS.find(command => command.action === 'achievements');
  assert.equal(achievements.label, 'Ver conquistas');
  const overview = SEARCH_COMMANDS.find(command => command.tab === 'dashboard');
  assert.doesNotMatch(overview.keywords, /conquistas/);
});
