import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { RealWeekBanner } from '../../src/ui/components/RealWeekBanner.js';

test('RealWeekBanner — retorna null quando não há atrasos nem déficit', () => {
  const html = render(
    h(RealWeekBanner, {
      overdueCount: 0,
      deficitMinutes: 0,
    })
  );
  assert.equal(html, '');
});

test('RealWeekBanner — renderiza acolhimento empático quando há revisões em atraso', () => {
  const html = render(
    h(RealWeekBanner, {
      overdueCount: 4,
      deficitMinutes: 0,
      onOpenRecoveryMission: () => {},
    })
  );

  assert.match(html, /Sua semana não saiu como planejada\? Tudo bem\./);
  assert.match(html, /Replanejamento/);
  assert.match(html, /Você tem 4 revisões aguardando resgate/);
  assert.match(html, /Resgatar em 30 min/);
  assert.match(html, /icon-lucide-heart-handshake/);
  assert.match(html, /icon-lucide-bolt/);
  // Zero Unicode emojis policy
  assert.doesNotMatch(html, /[\u{1F300}-\u{1FAFF}]/u);
});

test('RealWeekBanner — renderiza acolhimento com déficit semanal e botão de recalibração', () => {
  const html = render(
    h(RealWeekBanner, {
      overdueCount: 0,
      deficitMinutes: 90,
      onRecalibrateWeek: () => {},
    })
  );

  assert.match(html, /Sua semana não saiu como planejada\? Tudo bem\./);
  assert.match(html, /1 h 30 min de tarefas marcadas ainda por fazer/);
  assert.match(html, /Redistribuir saldo pendente/);
  assert.match(html, /icon-lucide-refresh/);
  assert.doesNotMatch(html, /Resgatar em 30 min/);
});

test('RealWeekBanner — combina atrasos e déficit com microcopy sem culpa e ambas as ações', () => {
  const html = render(
    h(RealWeekBanner, {
      overdueCount: 5,
      deficitMinutes: 120,
      onOpenRecoveryMission: () => {},
      onRecalibrateWeek: () => {},
      onDismiss: () => {},
    })
  );

  assert.match(html, /5 revisões pendentes e 2 h a redistribuir/);
  assert.match(html, /A consistência se constrói na adaptação, não na culpa/);
  assert.match(html, /Resgatar em 30 min/);
  assert.match(html, /Redistribuir saldo pendente/);
  assert.match(html, /aria-label="Dispensar aviso de replanejamento"/);
});
