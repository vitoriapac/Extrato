import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import {
  BottomSheet,
  Combobox,
  DropdownMenu,
  Popover,
  SegmentedControl,
  SelectField,
  TOAST_VARIANT_ICONS,
  Tabs,
  Toast,
  ToastViewport,
  Tooltip,
  filterComboboxOptions,
  getRovingTabIndex,
  normalizeComboboxQuery,
} from '../../src/ui/primitives/index.js';

test('getRovingTabIndex — navega horizontal e verticalmente pulando itens desabilitados', () => {
  const disabledIdx = idx => idx === 1;
  assert.equal(getRovingTabIndex(0, 'ArrowRight', 4, 'horizontal', disabledIdx), 2);
  assert.equal(getRovingTabIndex(2, 'ArrowLeft', 4, 'horizontal', disabledIdx), 0);
  assert.equal(getRovingTabIndex(0, 'ArrowLeft', 4, 'horizontal', disabledIdx), 3);
  assert.equal(getRovingTabIndex(3, 'ArrowRight', 4, 'horizontal', disabledIdx), 0);
  assert.equal(
    getRovingTabIndex(3, 'Home', 4, 'horizontal', () => false),
    0
  );
  assert.equal(
    getRovingTabIndex(0, 'End', 4, 'horizontal', () => false),
    3
  );

  assert.equal(
    getRovingTabIndex(0, 'ArrowDown', 3, 'vertical', idx => idx === 1),
    2
  );
  assert.equal(
    getRovingTabIndex(2, 'ArrowUp', 3, 'vertical', idx => idx === 1),
    0
  );
  assert.equal(getRovingTabIndex(0, 'Enter', 3, 'horizontal'), null);
  assert.equal(getRovingTabIndex(0, 'ArrowRight', 0, 'horizontal'), null);
  assert.equal(
    getRovingTabIndex(0, 'ArrowRight', 2, 'horizontal', () => true),
    null
  );
});

test('Tabs — renderiza tablist, seleção ativa, badge, variant contained e painéis sem IDs órfãos', () => {
  const html = render(
    h(Tabs, {
      label: 'Modos de revisão',
      variant: 'contained',
      defaultValue: 'simulados',
      items: [
        { id: 'resumo', label: 'Resumo', icon: 'layout-dashboard', panel: h('p', null, 'Visão') },
        {
          id: 'simulados',
          label: 'Simulados',
          badge: 3,
          panel: h('p', null, 'Lista de simulados'),
        },
        { id: 'bloqueado', label: 'Arquivados', disabled: true, panel: h('p', null, 'Oculto') },
      ],
    })
  );

  assert.ok(html.includes('role="tablist"'));
  assert.ok(html.includes('aria-label="Modos de revisão"'));
  assert.ok(html.includes('ui-tabs__list--contained'));
  assert.ok(html.includes('icon-lucide-layout-dashboard'));
  assert.ok(html.includes('<span class="ui-tabs__badge">3</span>'));
  assert.ok(html.includes('aria-selected="true"'));
  assert.ok(html.includes('aria-selected="false"'));
  assert.ok(html.includes('disabled'));
  assert.ok(html.includes('Lista de simulados'));
  assert.ok(!html.includes('Visão'));

  const controlsMatch = html.match(/id="[^"]*-tab-simulados"[^>]*aria-controls="([^"]+)"/);
  assert.ok(controlsMatch);
  assert.ok(html.includes(`role="tabpanel" id="${controlsMatch[1]}"`));

  const withoutPanels = render(
    h(Tabs, {
      label: 'Filtros',
      value: 'todos',
      items: [
        { id: 'todos', label: 'Todos' },
        { id: 'erros', label: 'Com erro' },
      ],
    })
  );
  assert.ok(!withoutPanels.includes('aria-controls='));
  assert.ok(!withoutPanels.includes('role="tabpanel"'));

  const mountedHtml = render(
    h(Tabs, {
      label: 'Visualizações',
      keepMounted: true,
      defaultValue: 'a',
      items: [
        { id: 'a', label: 'A', panel: h('span', null, 'Painel A') },
        { id: 'b', label: 'B', panel: h('span', null, 'Painel B') },
      ],
    })
  );
  assert.ok(mountedHtml.includes('Painel A'));
  assert.ok(mountedHtml.includes('Painel B'));
  assert.ok(mountedHtml.includes('hidden'));
});

test('SegmentedControl — expõe role group, aria-pressed e modificadores', () => {
  const html = render(
    h(SegmentedControl, {
      label: 'Janela temporal',
      value: '30d',
      onChange: () => {},
      size: 'sm',
      fullWidth: true,
      options: [
        { value: '7d', label: '7 dias', icon: 'clock' },
        { value: '30d', label: '30 dias' },
        { value: '90d', label: '90 dias', disabled: true },
      ],
    })
  );

  assert.ok(html.includes('role="group"'));
  assert.ok(html.includes('aria-label="Janela temporal"'));
  assert.ok(html.includes('ui-segmented--sm'));
  assert.ok(html.includes('ui-segmented--full'));
  assert.ok(html.includes('icon-lucide-clock'));
  assert.equal((html.match(/aria-pressed="true"/g) || []).length, 1);
  assert.equal((html.match(/aria-pressed="false"/g) || []).length, 2);
  assert.ok(html.includes('disabled'));
});

test('Popover — oculta aria-controls fechado e vincula painel quando aberto', () => {
  const closedHtml = render(
    h(Popover, {
      triggerLabel: 'Opções da tabela',
      children: h('div', null, 'Conteúdo oculto'),
    })
  );
  assert.ok(closedHtml.includes('aria-expanded="false"'));
  assert.ok(closedHtml.includes('aria-haspopup="dialog"'));
  assert.ok(!closedHtml.includes('aria-controls='));
  assert.ok(!closedHtml.includes('Conteúdo oculto'));

  const openHtml = render(
    h(Popover, {
      defaultOpen: true,
      placement: 'top-end',
      triggerLabel: 'Configurar colunas',
      ariaLabel: 'Configuração de colunas',
      children: h('p', null, 'Painel ativo'),
    })
  );
  assert.ok(openHtml.includes('aria-expanded="true"'));
  assert.ok(openHtml.includes('ui-popover__panel--top-end'));
  assert.ok(openHtml.includes('Painel ativo'));
  const match = openHtml.match(/aria-controls="([^"]+)"/);
  assert.ok(match);
  assert.ok(
    openHtml.includes(`id="${match[1]}" role="dialog" aria-label="Configuração de colunas"`)
  );
});

test('DropdownMenu — renderiza menu acessível, variante danger, desabilitado e dica', () => {
  const closedHtml = render(
    h(DropdownMenu, {
      triggerAriaLabel: 'Ações da matéria',
      triggerLabel: '',
      items: [{ id: 'editar', label: 'Editar' }],
    })
  );
  assert.ok(closedHtml.includes('aria-haspopup="menu"'));
  assert.ok(closedHtml.includes('aria-expanded="false"'));
  assert.ok(closedHtml.includes('icon-lucide-dots'));
  assert.ok(!closedHtml.includes('role="menu"'));

  const openHtml = render(
    h(DropdownMenu, {
      defaultOpen: true,
      placement: 'bottom-end',
      triggerLabel: 'Ações',
      hint: 'Use Delete para remover rapidamente.',
      items: [
        { id: 'editar', label: 'Renomear', icon: 'pencil' },
        { id: 'arquivar', label: 'Arquivar', disabled: true },
        { id: 'excluir', label: 'Excluir meta', icon: 'trash', variant: 'danger' },
      ],
    })
  );
  assert.ok(openHtml.includes('aria-expanded="true"'));
  assert.ok(openHtml.includes('role="menu"'));
  assert.ok(openHtml.includes('ui-popover__panel--bottom-end'));
  assert.equal((openHtml.match(/role="menuitem"/g) || []).length, 3);
  assert.ok(openHtml.includes('icon-lucide-pencil'));
  assert.ok(openHtml.includes('icon-lucide-trash'));
  assert.ok(openHtml.includes('ui-menu__item--danger'));
  assert.ok(openHtml.includes('ui-menu__hint'));
  assert.ok(openHtml.includes('Use Delete para remover rapidamente.'));
});

test('SelectField — associa label, hint, error e modificadores de tamanho', () => {
  const html = render(
    h(SelectField, {
      id: 'campo-banca',
      label: 'Banca examinadora',
      size: 'compact',
      fullWidth: true,
      placeholder: 'Escolha a banca',
      hint: 'Usada na estimativa de perfil de questão.',
      error: 'Selecione uma banca válida.',
      options: [
        { value: 'cebraspe', label: 'Cebraspe' },
        { value: 'fgv', label: 'FGV', disabled: true },
      ],
    })
  );

  assert.ok(html.includes('<label for="campo-banca" class="ui-select-field__label">'));
  assert.ok(html.includes('select-control--compact'));
  assert.ok(html.includes('select-control--wide'));
  assert.ok(html.includes('aria-invalid="true"'));
  assert.ok(html.includes('aria-describedby="campo-banca-hint campo-banca-error"'));
  assert.match(
    html,
    /<option\b[^>]*\bvalue(?:="")?\b[^>]*\bdisabled\b[^>]*>Escolha a banca<\/option>/
  );
  assert.ok(html.includes('Cebraspe'));
  assert.match(
    html,
    /<option\b[^>]*value="fgv"[^>]*disabled|<option\b[^>]*disabled[^>]*value="fgv"/
  );
  assert.ok(html.includes('role="alert"'));
  assert.ok(html.includes('icon-lucide-alert-circle'));
});

test('Combobox — filtra sem acento, vincula listbox e expõe limpar/expandir', () => {
  assert.equal(
    normalizeComboboxQuery('  Direito Administrativo — Órgãos  '),
    'direito administrativo — orgaos'
  );
  const options = [
    { value: 'dir-adm', label: 'Direito Administrativo', detail: '14 tópicos' },
    { value: 'port', label: 'Língua Portuguesa', detail: 'Interpretação' },
    { value: 'ti', label: 'Tecnologia da Informação', disabled: true },
  ];
  assert.equal(filterComboboxOptions(options, 'administracao').length, 0);
  assert.equal(filterComboboxOptions(options, 'administrativo').length, 1);
  assert.equal(filterComboboxOptions(options, 'interpretacao')[0].value, 'port');
  assert.equal(filterComboboxOptions(options, '   ').length, 3);

  const openHtml = render(
    h(Combobox, {
      id: 'combo-materia',
      label: 'Disciplina',
      value: 'dir-adm',
      defaultOpen: true,
      options,
    })
  );
  assert.ok(openHtml.includes('role="combobox"'));
  assert.ok(openHtml.includes('aria-autocomplete="list"'));
  assert.ok(openHtml.includes('aria-expanded="true"'));
  assert.ok(openHtml.includes('aria-controls="combo-materia-listbox"'));
  assert.ok(openHtml.includes('role="listbox"'));
  assert.ok(openHtml.includes('value="Direito Administrativo"'));
  assert.ok(openHtml.includes('aria-label="Limpar seleção"'));
  assert.ok(openHtml.includes('aria-label="Recolher opções"'));
  assert.ok(openHtml.includes('icon-lucide-check'));
  assert.ok(openHtml.includes('aria-disabled="true"'));

  const emptyHtml = render(
    h(Combobox, {
      label: 'Assunto',
      defaultOpen: true,
      emptyMessage: 'Nenhum assunto encontrado',
      options: [],
    })
  );
  assert.ok(emptyHtml.includes('Nenhum assunto encontrado'));
});

test('BottomSheet — preserva open apenas em SSR quando aberto e aplica título/rodapé', () => {
  const closedHtml = render(
    h(BottomSheet, {
      open: false,
      onClose: () => {},
      title: 'Detalhes da revisão',
      children: h('p', null, 'Corpo'),
    })
  );
  assert.ok(closedHtml.includes('<dialog'));
  assert.ok(!closedHtml.includes('<dialog open'));
  assert.ok(closedHtml.includes('ui-bottom-sheet__handle'));
  assert.ok(closedHtml.includes('aria-label="Fechar"'));
  assert.ok(closedHtml.includes('icon-lucide-x'));

  const openHtml = render(
    h(BottomSheet, {
      open: true,
      onClose: () => {},
      title: 'Exportar histórico',
      description: 'Inclui sessões e revisões consolidadas.',
      maxWidth: 'lg',
      footer: h('button', { type: 'button' }, 'Confirmar'),
      children: h('div', null, 'Seleção de período'),
    })
  );
  assert.ok(openHtml.includes('<dialog open'));
  assert.ok(openHtml.includes('ui-bottom-sheet--lg'));
  assert.ok(openHtml.includes('aria-labelledby='));
  assert.ok(openHtml.includes('aria-describedby='));
  assert.ok(openHtml.includes('ui-bottom-sheet__footer'));
  assert.ok(openHtml.includes('Confirmar'));
});

test('Tooltip — mescla aria-describedby apenas quando visível e aplica posicionamento', () => {
  const closedHtml = render(
    h(
      Tooltip,
      { content: 'Calcular cobertura ponderada' },
      h('button', { type: 'button', 'aria-describedby': 'ajuda-externa' }, 'Peso')
    )
  );
  assert.ok(closedHtml.includes('aria-describedby="ajuda-externa"'));
  assert.ok(!closedHtml.includes('role="tooltip"'));

  const openHtml = render(
    h(
      Tooltip,
      {
        defaultOpen: true,
        placement: 'bottom',
        align: 'end',
        content: 'Cobertura ponderada pelo peso do edital',
      },
      h('button', { type: 'button', 'aria-describedby': 'ajuda-externa' }, 'Peso')
    )
  );
  const bubbleMatch = openHtml.match(/<span id="([^"]+)" role="tooltip"/);
  assert.ok(bubbleMatch);
  assert.ok(openHtml.includes(`aria-describedby="ajuda-externa ${bubbleMatch[1]}"`));
  assert.ok(openHtml.includes('ui-tooltip__bubble--bottom'));
  assert.ok(openHtml.includes('ui-tooltip__bubble--end'));
});

test('Toast e ToastViewport — diferencia live regions e ícones semânticos', () => {
  assert.deepEqual(TOAST_VARIANT_ICONS, {
    info: 'info-circle',
    success: 'circle-check',
    warning: 'alert-triangle',
    danger: 'alert-circle',
  });

  const infoHtml = render(
    h(Toast, {
      variant: 'success',
      title: 'Backup exportado',
      description: 'Arquivo salvo localmente.',
      actionLabel: 'Abrir',
      onAction: () => {},
      onDismiss: () => {},
    })
  );
  assert.ok(infoHtml.includes('role="status"'));
  assert.ok(infoHtml.includes('aria-live="polite"'));
  assert.ok(infoHtml.includes('ui-toast--success'));
  assert.ok(infoHtml.includes('icon-lucide-circle-check'));
  assert.ok(infoHtml.includes('Abrir'));
  assert.ok(infoHtml.includes('aria-label="Dispensar notificação"'));

  const dangerHtml = render(
    h(Toast, {
      variant: 'danger',
      title: 'Falha ao importar JSON',
    })
  );
  assert.ok(dangerHtml.includes('role="alert"'));
  assert.ok(dangerHtml.includes('aria-live="assertive"'));
  assert.ok(dangerHtml.includes('icon-lucide-alert-circle'));

  const viewportHtml = render(h(ToastViewport, null, h('div', null, 'Item')));
  assert.ok(viewportHtml.includes('<section role="region"'));
  assert.ok(viewportHtml.includes('aria-label="Notificações do sistema"'));
  assert.ok(viewportHtml.includes('ui-toast-viewport'));
});

test('Governança Fase 1/2 — camada CSS em ordem, zero hex solto e zero emojis nos primitivos compostos', () => {
  const tailwindInput = fs.readFileSync('styles/tailwind.input.css', 'utf8');
  const appCss = fs.readFileSync('styles/app.css', 'utf8');
  const compiledTailwind = fs.readFileSync('styles/tailwind.css', 'utf8');

  assert.match(tailwindInput, /^@layer theme, legacy, components, utilities;/);
  assert.match(appCss, /^@layer theme, legacy, components, utilities;/);
  assert.match(
    compiledTailwind,
    /@layer theme[\s\S]*@layer legacy[\s\S]*@layer components[\s\S]*@layer utilities/
  );

  const componentsStart = tailwindInput.indexOf('@layer components {');
  assert.ok(componentsStart >= 0);
  const componentsBlock = tailwindInput.slice(componentsStart);
  const looseHex = componentsBlock.match(/#[0-9a-fA-F]{3,8}\b/g);
  assert.equal(looseHex, null, `Hex solto encontrado em @layer components: ${looseHex}`);

  const emojiRegex = /\p{Extended_Pictographic}/u;
  const primitiveFiles = [
    'src/ui/primitives/button.tsx',
    'src/ui/primitives/tabs.tsx',
    'src/ui/primitives/popover.tsx',
    'src/ui/primitives/dropdown-menu.tsx',
    'src/ui/primitives/select-field.tsx',
    'src/ui/primitives/bottom-sheet.tsx',
    'src/ui/primitives/tooltip.tsx',
    'src/ui/primitives/toast.tsx',
    'src/ui/primitives/index.ts',
  ];
  for (const file of primitiveFiles) {
    const src = fs.readFileSync(file, 'utf8');
    assert.ok(!emojiRegex.test(src), `Emoji proibido em ${file}`);
    assert.equal(src.match(/#[0-9a-fA-F]{3,8}\b/g), null, `Hex solto em ${file}`);
  }
});
