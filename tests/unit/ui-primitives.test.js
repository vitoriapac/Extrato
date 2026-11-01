import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import {
  Button,
  Badge,
  StatusPill,
  Card,
  SectionHeader,
  ProgressBar,
  Dialog,
  EmptyState,
  MetricCard,
  Icon,
  renderIconSvg,
} from '../../src/ui/primitives/index.js';

test('UI Primitives — Button renderiza variantes e tamanhos acessíveis', () => {
  const primaryHtml = render(h(Button, { variant: 'primary', children: 'Salvar' }));
  assert.ok(primaryHtml.includes('btn-primary'));
  assert.ok(primaryHtml.includes('bg-brand'));
  assert.ok(primaryHtml.includes('Salvar'));

  const smallDangerHtml = render(
    h(Button, { variant: 'danger', size: 'small', disabled: true, children: 'Excluir' })
  );
  assert.ok(smallDangerHtml.includes('btn-danger'));
  assert.ok(smallDangerHtml.includes('btn-small'));
  assert.ok(smallDangerHtml.includes('disabled'));
  assert.ok(smallDangerHtml.includes('Excluir'));
});

test('UI Primitives — Button tem níveis tonal e terciário sem o preenchimento do primário', () => {
  const tonalHtml = render(h(Button, { variant: 'tonal', children: 'Iniciar' }));
  assert.match(tonalHtml, /class="btn [^"]*\btonal\b/);
  assert.ok(!tonalHtml.includes('bg-brand'));

  const tertiaryHtml = render(h(Button, { variant: 'tertiary', children: 'Ver detalhes' }));
  assert.match(tertiaryHtml, /class="btn [^"]*\btertiary\b/);
  assert.ok(!tertiaryHtml.includes('bg-brand'));
});

test('UI Primitives — Badge / StatusPill renderiza estados e classes semânticas', () => {
  const successHtml = render(h(Badge, { variant: 'success', children: 'Concluído' }));
  assert.ok(successHtml.includes('status-pill--success'));
  assert.ok(successHtml.includes('bg-green-bg'));
  assert.ok(successHtml.includes('Concluído'));

  const pillWarningHtml = render(h(StatusPill, { variant: 'warning', children: 'Pendente' }));
  assert.ok(pillWarningHtml.includes('status-pill--warning'));
  assert.ok(pillWarningHtml.includes('bg-amber-bg'));
  assert.ok(pillWarningHtml.includes('Pendente'));
});

test('UI Primitives — Card e SectionHeader respeitam contratos de apresentação', () => {
  const cardHtml = render(
    h(Card, {
      variant: 'insight',
      as: 'article',
      children: 'Conteúdo de insight',
    })
  );
  assert.ok(cardHtml.startsWith('<article'));
  assert.ok(cardHtml.includes('card--insight'));
  assert.ok(cardHtml.includes('Conteúdo de insight'));

  const headerHtml = render(
    h(SectionHeader, {
      title: 'Desempenho Geral',
      eyebrow: 'Métrica Estratégica',
      description: 'Visão consolidada por disciplina',
      level: 2,
    })
  );
  assert.ok(headerHtml.includes('<h2 class="module-heading__title'));
  assert.ok(headerHtml.includes('Desempenho Geral</h2>'));
  assert.ok(headerHtml.includes('Métrica Estratégica</span>'));
  assert.ok(headerHtml.includes('Visão consolidada por disciplina</p>'));
});

test('UI Primitives — ProgressBar calcula percentual e expõe atributos acessíveis', () => {
  const progressHtml = render(
    h(ProgressBar, {
      value: 75,
      max: 100,
      label: 'Taxa de acertos',
      showValueText: true,
      variant: 'success',
    })
  );
  assert.ok(progressHtml.includes('role="progressbar"'));
  assert.ok(progressHtml.includes('aria-valuenow="75"'));
  assert.ok(progressHtml.includes('aria-valuemax="100"'));
  assert.ok(progressHtml.includes('width:75%') || progressHtml.includes('width: 75%'));
  assert.ok(progressHtml.includes('Taxa de acertos'));
  assert.ok(progressHtml.includes('75%'));
});

test('UI Primitives — EmptyState comunica ausência de dados com role status', () => {
  const emptyHtml = render(
    h(EmptyState, {
      title: 'Nenhuma questão respondida',
      message: 'Inicie uma sessão para começar a pontuar.',
    })
  );
  assert.ok(emptyHtml.includes('role="status"'));
  assert.ok(emptyHtml.includes('empty-state'));
  assert.ok(emptyHtml.includes('Nenhuma questão respondida'));
  assert.ok(emptyHtml.includes('Inicie uma sessão para começar a pontuar.'));
});

test('UI Primitives — MetricCard formata rótulo, valor e detalhes', () => {
  const metricHtml = render(
    h(MetricCard, {
      label: 'Tempo Total',
      value: '42h 30m',
      detail: '+15% em relação à semana anterior',
    })
  );
  assert.ok(metricHtml.includes('ui-metric'));
  assert.ok(metricHtml.includes('Tempo Total'));
  assert.ok(metricHtml.includes('42h 30m'));
  assert.ok(metricHtml.includes('+15% em relação à semana anterior'));
});

test('UI Primitives — Dialog renderiza título e ponto de montagem', () => {
  const dialogHtml = render(
    h(Dialog, {
      open: true,
      onClose: () => {},
      title: 'Importar Edital',
      children: 'Formulário de importação',
    })
  );
  assert.ok(dialogHtml.includes('Importar Edital'));
  assert.ok(dialogHtml.includes('Formulário de importação'));
  assert.ok(dialogHtml.includes('aria-label="Fechar"'));
});

test('UI Primitives — Icon renderiza SVG acessível ou decorativo com traço fino', () => {
  const decorativeHtml = render(h(Icon, { name: 'search', size: 18 }));
  assert.ok(decorativeHtml.includes('<svg'));
  assert.ok(decorativeHtml.includes('viewBox="0 0 24 24"'));
  assert.ok(decorativeHtml.includes('width="18"'));
  assert.ok(decorativeHtml.includes('aria-hidden="true"'));
  assert.ok(decorativeHtml.includes('stroke="currentColor"'));
  assert.ok(decorativeHtml.includes('icon-tabler-search'));

  const accessibleHtml = render(
    h(Icon, { name: 'download', size: 20, 'aria-label': 'Baixar backup' })
  );
  assert.ok(accessibleHtml.includes('role="img"'));
  assert.ok(accessibleHtml.includes('aria-label="Baixar backup"'));
  assert.ok(!accessibleHtml.includes('aria-hidden="true"'));
  assert.ok(accessibleHtml.includes('icon-tabler-download'));

  // Teste de renderIconSvg para templates de string
  const svgString = renderIconSvg('player-play', { size: 14, class: 'mr-1' });
  assert.ok(svgString.includes('<svg'));
  assert.ok(svgString.includes('icon-tabler-player-play'));
  assert.ok(svgString.includes('width="14"'));
});

test('UI Primitives — ícones da Fase 2 do plano visual existem nos dados do Tabler', () => {
  const phaseTwoIcons = [
    'layout-dashboard', 'chart-line', 'sun', 'books', 'calendar-month', 'repeat', 'list-check',
    'map-2', 'help-circle', 'dots', 'gauge', 'progress', 'loader-2', 'circle-check', 'flame',
    'list-details', 'clock', 'trophy', 'trending-up', 'arrow-right', 'player-play', 'player-pause',
    'refresh', 'square-check', 'focus-2', 'picture-in-picture', 'book', 'pencil', 'clipboard-text',
    'circle-x', 'alert-triangle', 'bolt', 'plus', 'file-import', 'download', 'file-export',
    'file-type-pdf', 'cloud-upload', 'cloud-download', 'database', 'trash', 'filter', 'chevron-down',
    'flask', 'route', 'logout', 'alert-circle', 'info-circle', 'calculator', 'building-bank',
    'device-laptop', 'language', 'scale', 'circle-dashed',
  ];
  for (const name of phaseTwoIcons) {
    const svg = renderIconSvg(name);
    assert.ok(svg.includes(`icon-tabler-${name}`), name);
    // Unknown names fall back to "help"; a real icon has its own paths.
    assert.notEqual(svg.replace(`icon-tabler-${name}`, ''), renderIconSvg('help').replace('icon-tabler-help', ''), name);
  }
});

test('UI Primitives — Badge mostra ícone decorativo por estado, além da cor', () => {
  const expected = {
    success: 'circle-check',
    warning: 'alert-triangle',
    danger: 'alert-circle',
    info: 'info-circle',
    insufficient: 'circle-dashed',
  };
  for (const [variant, icon] of Object.entries(expected)) {
    const html = render(h(Badge, { variant, children: 'Estado' }));
    assert.ok(html.includes(`icon-tabler-${icon}`), variant);
    assert.ok(html.includes('aria-hidden="true"'), variant);
    assert.ok(html.includes('width="14"'), variant);
    assert.ok(html.includes('Estado'), variant);
  }
  assert.ok(!render(h(Badge, { variant: 'default', children: 'Neutro' })).includes('<svg'));
  assert.ok(!render(h(Badge, { variant: 'success', icon: false, children: 'Sem ícone' })).includes('<svg'));
  assert.ok(render(h(Badge, { variant: 'info', icon: 'flask', children: 'Demo' })).includes('icon-tabler-flask'));
});

test('UI Primitives — EmptyState, MetricCard e Button aceitam ícones nos tamanhos do sistema', () => {
  const empty = render(h(EmptyState, { title: 'Sem sessões', icon: 'clock' }));
  assert.ok(empty.includes('icon-tabler-clock'));
  assert.ok(empty.includes('width="32"') && empty.includes('stroke-width="1.5"'));
  assert.ok(empty.includes('aria-hidden="true"'));
  assert.ok(!render(h(EmptyState, { title: 'Sem ícone' })).includes('<svg'));

  const metric = render(h(MetricCard, { label: 'Prontidão', value: 72, icon: 'gauge' }));
  assert.ok(metric.includes('icon-tabler-gauge') && metric.includes('width="14"'));

  const button = render(
    h(Button, { iconLeft: 'plus', iconRight: 'arrow-right', children: 'Nova disciplina' })
  );
  assert.ok(button.indexOf('icon-tabler-plus') < button.indexOf('Nova disciplina'));
  assert.ok(button.indexOf('Nova disciplina') < button.indexOf('icon-tabler-arrow-right'));
  assert.equal((button.match(/width="14"/g) || []).length, 2);
  assert.equal((button.match(/aria-hidden="true"/g) || []).length, 2);
});
