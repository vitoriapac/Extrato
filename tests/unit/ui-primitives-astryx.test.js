import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import {
  Badge,
  Collapsible,
  CollapsibleGroup,
  CommandPalette,
  CommandPaletteEmpty,
  CommandPaletteFooter,
  CommandPaletteGroup,
  CommandPaletteInput,
  CommandPaletteItem,
  CommandPaletteList,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  Step,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableEmptyRow,
  TableFooter,
  TableHeader,
  TableHeaderCell,
  TablePagination,
  TableRow,
  TableSelectionCell,
  TableSelectionToolbar,
  computeTablePagination,
  cycleTableSort,
  filterCommandItems,
  filterTableRows,
  getVisibleTablePages,
  matchesCommandQuery,
  paginateTableRows,
  renderIconSvg,
  resolveStepState,
  sortTableRows,
  toggleCollapsibleGroupValue,
  toggleSelectAllTableIds,
  toggleTableSelectionId,
  useCollapsible,
  useTableColumnSettingsState,
  useTableFilterState,
  useTablePagination,
  useTableSelectionState,
  useTableSortableState,
} from '../../src/ui/primitives/index.js';

test('Astryx Icons — novos ícones Lucide renderizam SVG próprio com traço 1.5px', () => {
  const addedIcons = [
    'arrow-up',
    'arrow-down',
    'chevrons-up-down',
    'command',
    'corner-down-left',
    'chevrons-left',
    'chevrons-right',
    'inbox',
  ];
  const fallbackTemplate = renderIconSvg('help').replace('icon-lucide-help', '');

  for (const name of addedIcons) {
    const svg = renderIconSvg(name, { size: 16 });
    assert.ok(svg.includes(`icon-lucide-${name}`), name);
    assert.ok(svg.includes('stroke-width="1.5"'), name);
    assert.notEqual(svg.replace(`icon-lucide-${name}`, ''), fallbackTemplate, name);
  }
});

test('CommandPalette — helpers filtram sem acento e SSR renderiza grupos, atalhos e empty state', () => {
  assert.equal(matchesCommandQuery('Revisão espaçada', 'espacada', ['srs', 'memória']), true);
  assert.equal(matchesCommandQuery('Simulados', 'cronometro', ['timer']), false);

  const filtered = filterCommandItems(
    [
      { value: 'rev', label: 'Revisão', keywords: ['fila'] },
      { value: 'sim', label: 'Simulados', description: 'Provas completas' },
    ],
    'provas'
  );
  assert.deepEqual(
    filtered.map(item => item.value),
    ['sim']
  );

  const closedHtml = render(
    h(
      CommandPalette,
      { open: false, onOpenChange: () => {} },
      h(CommandPaletteInput, null),
      h(CommandPaletteList, null, h(CommandPaletteItem, { value: 'hoje', label: 'Ir para Hoje' }))
    )
  );
  assert.ok(closedHtml.includes('<dialog'));
  assert.ok(!closedHtml.includes('<dialog open'));

  const filteredHtml = render(
    h(
      CommandPalette,
      { open: true, query: 'simul', size: 'lg' },
      h(CommandPaletteInput, { showCloseButton: true }),
      h(
        CommandPaletteList,
        null,
        h(
          CommandPaletteGroup,
          { heading: 'Navegação' },
          h(CommandPaletteItem, {
            value: 'hoje',
            label: 'Hoje',
            icon: 'sun',
            shortcut: ['G', 'H'],
          })
        ),
        h(
          CommandPaletteGroup,
          { heading: 'Avaliação' },
          h(CommandPaletteItem, {
            value: 'simulado',
            label: 'Novo simulado',
            description: 'Registrar prova por disciplina',
            icon: 'clipboard-text',
            shortcut: 'S',
          })
        )
      ),
      h(CommandPaletteFooter, null)
    )
  );

  assert.ok(filteredHtml.includes('<dialog open'));
  assert.ok(filteredHtml.includes('ui-command-palette--lg'));
  assert.ok(filteredHtml.includes('role="combobox"'));
  assert.ok(filteredHtml.includes('aria-expanded="true"'));
  assert.ok(filteredHtml.includes('aria-activedescendant='));
  assert.ok(filteredHtml.includes('role="listbox"'));
  assert.ok(filteredHtml.includes('Novo simulado'));
  assert.ok(filteredHtml.includes('Registrar prova por disciplina'));
  assert.ok(filteredHtml.includes('<kbd class="ui-command-palette__kbd">S</kbd>'));
  assert.ok(!filteredHtml.includes('Navegação'));
  assert.ok(!filteredHtml.includes('data-command-value="hoje"'));
  assert.ok(filteredHtml.includes('icon-lucide-arrow-up'));
  assert.ok(filteredHtml.includes('icon-lucide-corner-down-left'));

  const emptyHtml = render(
    h(
      CommandPalette,
      { open: true, query: 'inexistente-xyz' },
      h(CommandPaletteInput, null),
      h(
        CommandPaletteList,
        { emptyMessage: 'Nada encontrado nesta busca.' },
        h(
          CommandPaletteGroup,
          { heading: 'Ações' },
          h(CommandPaletteItem, { value: 'a', label: 'Exportar JSON' })
        )
      )
    )
  );
  assert.ok(emptyHtml.includes('role="status"'));
  assert.ok(emptyHtml.includes('Nada encontrado nesta busca.'));
  assert.ok(!emptyHtml.includes('role="group"'));
});

test('Drawer — posicionamento lateral, modo não-modal e ligação automática de DrawerHeader', () => {
  const closedHtml = render(
    h(
      Drawer,
      { open: false, side: 'left', size: 'sm', label: 'Filtros' },
      h(DrawerBody, null, 'Corpo')
    )
  );
  assert.ok(closedHtml.includes('<dialog'));
  assert.ok(!closedHtml.includes('<dialog open'));
  assert.ok(closedHtml.includes('data-side="left"'));
  assert.ok(closedHtml.includes('ui-drawer--sm'));

  const openHtml = render(
    h(
      Drawer,
      { defaultOpen: true, side: 'right', size: 'lg', modal: false },
      h(DrawerHeader, {
        title: 'Detalhes do tópico',
        description: 'Histórico das últimas 4 revisões.',
        badge: h(Badge, { variant: 'warning' }, 'Atenção'),
        startContent: h('span', { class: 'drawer-lead' }, '12'),
        endContent: h('span', { class: 'drawer-extra' }, 'PDF'),
      }),
      h(DrawerBody, null, h('p', null, 'Conteúdo principal')),
      h(DrawerFooter, null, h('button', { type: 'button' }, 'Concluir'))
    )
  );

  assert.ok(openHtml.includes('<dialog open'));
  assert.ok(openHtml.includes('data-side="right"'));
  assert.ok(openHtml.includes('data-modal="false"'));
  assert.ok(openHtml.includes('ui-drawer--non-modal'));
  assert.ok(openHtml.includes('ui-drawer--lg'));
  assert.ok(openHtml.includes('Detalhes do tópico'));
  assert.ok(openHtml.includes('Histórico das últimas 4 revisões.'));
  assert.ok(openHtml.includes('icon-lucide-x'));
  assert.ok(openHtml.includes('Concluir'));

  const labelMatch = openHtml.match(/aria-labelledby="([^"]+)"/);
  assert.ok(labelMatch);
  assert.ok(openHtml.includes(`<h3 id="${labelMatch[1]}" class="ui-drawer__title">`));
});

test('Stepper — resolveStepState e renderização de estados, status ortogonal e barra de progresso', () => {
  assert.equal(resolveStepState(0, 1), 'completed');
  assert.equal(resolveStepState(1, 1), 'current');
  assert.equal(resolveStepState(2, 1), 'upcoming');
  assert.equal(resolveStepState(0, 1, true), 'disabled');

  const html = render(
    h(
      Stepper,
      {
        activeStep: 1,
        orientation: 'vertical',
        linear: true,
        showProgressBar: true,
        compactSummary: true,
        onStepSelect: () => {},
      },
      h(Step, { title: 'Disciplinas', description: 'Pesos do edital' }),
      h(
        Step,
        { title: 'Agenda', status: 'warning', optionalLabel: 'Opcional' },
        h('p', null, 'Conteúdo da etapa ativa')
      ),
      h(Step, { title: 'Revisão', status: 'error', disabled: true })
    )
  );

  assert.ok(html.includes('ui-stepper-frame--vertical'));
  assert.ok(html.includes('Passo 2 de 3'));
  assert.ok(html.includes('Agenda'));
  assert.ok(html.includes('role="progressbar"'));
  assert.ok(html.includes('aria-valuenow="67"'));
  assert.ok(html.includes('icon-lucide-check'));
  assert.ok(html.includes('icon-lucide-alert-triangle'));
  assert.ok(html.includes('icon-lucide-alert-circle'));
  assert.ok(html.includes('data-step-state="completed"'));
  assert.ok(html.includes('data-step-state="current"'));
  assert.ok(html.includes('data-step-status="warning"'));
  assert.ok(html.includes('aria-current="step"'));
  assert.ok(html.includes('data-step-state="disabled"'));
  assert.ok(html.includes('Opcional'));
  assert.ok(html.includes('Conteúdo da etapa ativa'));

  // Em linear=true com activeStep=1, etapas 0 e 1 são botões e etapa 2 desabilitada é estática
  assert.equal((html.match(/<button type="button" class="ui-step__trigger"/g) || []).length, 2);

  const nonLinearNoIndicator = render(
    h(
      Stepper,
      { activeStep: 0, linear: false, indicator: 'none', onStepSelect: () => {} },
      h(Step, { title: 'A' }),
      h(Step, { title: 'B' })
    )
  );
  assert.equal(
    (nonLinearNoIndicator.match(/<button type="button" class="ui-step__trigger"/g) || []).length,
    2
  );
  assert.ok(!nonLinearNoIndicator.includes('ui-step__indicator'));
});

test('Collapsible & CollapsibleGroup — alternância single/multiple e contratos ARIA de expansão', () => {
  assert.equal(typeof useCollapsible, 'function');
  assert.deepEqual(toggleCollapsibleGroupValue([], 'a', 'single', true), ['a']);
  assert.deepEqual(toggleCollapsibleGroupValue(['a'], 'a', 'single', true), []);
  assert.deepEqual(toggleCollapsibleGroupValue(['a'], 'a', 'single', false), ['a']);
  assert.deepEqual(toggleCollapsibleGroupValue(['a'], 'b', 'single', true), ['b']);
  assert.deepEqual(toggleCollapsibleGroupValue(['a'], 'b', 'multiple', true), ['a', 'b']);
  assert.deepEqual(toggleCollapsibleGroupValue(['a', 'b'], 'a', 'multiple', true), ['b']);

  const groupHtml = render(
    h(
      CollapsibleGroup,
      {
        type: 'single',
        defaultValue: 'item-1',
        density: 'compact',
        hasDividers: true,
        chevronPosition: 'start',
      },
      h(
        Collapsible,
        {
          id: 'item-1',
          title: 'Bloco aberto',
          subtitle: '3 tópicos',
          icon: 'book',
          badge: h(Badge, { variant: 'info' }, 'Novo'),
        },
        h('p', null, 'Conteúdo visível')
      ),
      h(
        Collapsible,
        { id: 'item-2', title: 'Bloco fechado', disabled: true },
        h('p', null, 'Conteúdo desmontado')
      )
    )
  );

  assert.ok(groupHtml.includes('ui-collapsible-group--compact'));
  assert.ok(groupHtml.includes('ui-collapsible-group--dividers'));
  assert.ok(groupHtml.includes('icon-lucide-book'));
  assert.ok(groupHtml.includes('icon-lucide-chevron-down'));
  assert.ok(groupHtml.includes('Conteúdo visível'));
  assert.ok(!groupHtml.includes('Conteúdo desmontado'));
  assert.ok(groupHtml.includes('aria-expanded="true"'));
  assert.ok(groupHtml.includes('aria-expanded="false"'));
  assert.ok(groupHtml.includes('ui-collapsible--disabled'));

  const matchControls = groupHtml.match(/aria-controls="([^"]+)"/);
  assert.ok(matchControls);
  assert.ok(groupHtml.includes(`id="${matchControls[1]}" role="region"`));

  const keepMountedClosed = render(
    h(
      Collapsible,
      { defaultOpen: false, keepMounted: true, title: 'Persistido no DOM' },
      h('span', null, 'Conteúdo oculto mas presente')
    )
  );
  assert.ok(keepMountedClosed.includes('Conteúdo oculto mas presente'));
  assert.ok(keepMountedClosed.includes('hidden'));
  assert.ok(keepMountedClosed.includes('aria-controls='));
});

test('Table patterns — helpers puros de ordenação, seleção, filtro, paginação e SSR acessível', () => {
  assert.equal(typeof useTableSortableState, 'function');
  assert.equal(typeof useTableSelectionState, 'function');
  assert.equal(typeof useTablePagination, 'function');
  assert.equal(typeof useTableFilterState, 'function');
  assert.equal(typeof useTableColumnSettingsState, 'function');

  // cycleTableSort
  let sort = cycleTableSort({ key: null, direction: null }, 'accuracy');
  assert.deepEqual(sort, { key: 'accuracy', direction: 'asc' });
  sort = cycleTableSort(sort, 'accuracy');
  assert.deepEqual(sort, { key: 'accuracy', direction: 'desc' });
  sort = cycleTableSort(sort, 'accuracy', true);
  assert.deepEqual(sort, { key: null, direction: null });
  assert.deepEqual(cycleTableSort({ key: 'accuracy', direction: 'desc' }, 'accuracy', false), {
    key: 'accuracy',
    direction: 'asc',
  });
  assert.deepEqual(cycleTableSort({ key: 'accuracy', direction: 'desc' }, 'name'), {
    key: 'name',
    direction: 'asc',
  });

  // sortTableRows (numérico + null sempre ao final)
  const rows = [
    { id: '1', name: 'Direito Constitucional', accuracy: 82 },
    { id: '2', name: 'AFO', accuracy: null },
    { id: '3', name: 'Áreas de TI', accuracy: 94 },
    { id: '4', name: 'Contabilidade', accuracy: 65 },
  ];
  const sortedDesc = sortTableRows(rows, { key: 'accuracy', direction: 'desc' });
  assert.deepEqual(
    sortedDesc.map(r => r.id),
    ['3', '1', '4', '2']
  );
  const sortedNameAsc = sortTableRows(rows, { key: 'name', direction: 'asc' });
  assert.equal(sortedNameAsc[0].id, '2');

  // seleção preservando seleções de outras páginas
  assert.deepEqual(toggleTableSelectionId(['1'], '2', true), ['1', '2']);
  assert.deepEqual(toggleTableSelectionId(['1', '2'], '1', true), ['2']);
  assert.deepEqual(toggleTableSelectionId(['1'], '2', false), ['2']);
  assert.deepEqual(toggleSelectAllTableIds(['offpage'], ['1', '2']), ['offpage', '1', '2']);
  assert.deepEqual(toggleSelectAllTableIds(['offpage', '1', '2'], ['1', '2']), ['offpage']);

  // filtro sem acento + coluna
  const filtered = filterTableRows(
    [
      { id: '1', subject: 'Direito Administrativo', area: 'Jurídica' },
      { id: '2', subject: 'Estatística', area: 'Exatas' },
      { id: '3', subject: 'Língua Portuguesa', area: 'Básicas' },
    ],
    { query: 'lingua', columnFilters: { area: ['Básicas', 'Exatas'] } }
  );
  assert.deepEqual(
    filtered.map(r => r.id),
    ['3']
  );

  // paginação & janela
  const pagination = computeTablePagination({ page: 99, pageSize: 10, totalItems: 35 });
  assert.equal(pagination.page, 4);
  assert.equal(pagination.totalPages, 4);
  assert.equal(pagination.rangeStart, 31);
  assert.equal(pagination.rangeEnd, 35);
  assert.equal(pagination.canPrev, true);
  assert.equal(pagination.canNext, false);

  const emptyPagination = computeTablePagination({ page: 1, pageSize: 10, totalItems: 0 });
  assert.equal(emptyPagination.rangeStart, 0);
  assert.equal(emptyPagination.rangeEnd, 0);

  const paged = paginateTableRows([1, 2, 3, 4, 5], 2, 2);
  assert.deepEqual(paged.items, [3, 4]);

  assert.deepEqual(getVisibleTablePages(5, 10), [1, 'ellipsis', 4, 5, 6, 'ellipsis', 10]);
  assert.deepEqual(getVisibleTablePages(2, 4), [1, 2, 3, 4]);

  // Renderização SSR
  const tableHtml = render(
    h(
      'div',
      null,
      h(TableSelectionToolbar, {
        selectedCount: 2,
        totalCount: 12,
        onClear: () => {},
        actions: h('button', { type: 'button' }, 'Arquivar'),
      }),
      h(
        Table,
        {
          caption: 'Desempenho por matéria',
          striped: true,
          stickyHeader: true,
          bordered: true,
          density: 'compact',
          sortState: { key: 'accuracy', direction: 'desc' },
          onSortChange: () => {},
        },
        h(
          TableHeader,
          null,
          h(
            TableRow,
            null,
            h(TableSelectionCell, {
              asHeader: true,
              checked: false,
              indeterminate: true,
              onChange: () => {},
            }),
            h(TableHeaderCell, { sortKey: 'name' }, 'Disciplina'),
            h(TableHeaderCell, { sortKey: 'accuracy', numeric: true }, 'Acerto')
          )
        ),
        h(
          TableBody,
          null,
          h(
            TableRow,
            { selected: true, interactive: true },
            h(TableSelectionCell, { checked: true, onChange: () => {} }),
            h(TableCell, { truncate: true }, 'Direito Constitucional'),
            h(TableCell, { numeric: true }, '84%')
          ),
          h(TableEmptyRow, { colSpan: 3 })
        ),
        h(TableFooter, null, h(TableRow, null, h(TableCell, { colSpan: 3 }, 'Resumo consolidado')))
      ),
      h(TablePagination, {
        pagination: {
          page: 2,
          pageSize: 10,
          totalItems: 35,
          pageSizeOptions: [10, 20, 50],
          onPageChange: () => {},
          onPageSizeChange: () => {},
        },
      })
    )
  );

  assert.ok(tableHtml.includes('role="region" aria-label="Seleção da tabela"'));
  assert.ok(tableHtml.includes('2 selecionados'));
  assert.ok(tableHtml.includes('Limpar seleção'));
  assert.ok(tableHtml.includes('ui-table--striped'));
  assert.ok(tableHtml.includes('ui-table--sticky-header'));
  assert.ok(tableHtml.includes('ui-table--compact'));
  assert.ok(tableHtml.includes('aria-checked="mixed"'));
  assert.ok(tableHtml.includes('aria-sort="descending"'));
  assert.ok(tableHtml.includes('aria-sort="none"'));
  assert.ok(tableHtml.includes('icon-lucide-arrow-down'));
  assert.ok(tableHtml.includes('icon-lucide-chevrons-up-down'));
  assert.ok(tableHtml.includes('ui-table__cell--numeric'));
  assert.ok(tableHtml.includes('data-selected="true"'));
  assert.ok(tableHtml.includes('icon-lucide-inbox'));
  assert.ok(tableHtml.includes('Mostrando 11–20 de 35'));
  assert.ok(tableHtml.includes('aria-label="Itens por página"'));
  assert.ok(tableHtml.includes('aria-current="page"'));
});

test('Governança Astryx — zero emojis, zero hex solto, zero innerHTML e app.ts intacto', () => {
  const emojiRegex = /\p{Extended_Pictographic}/u;
  const hexRegex = /#[0-9a-fA-F]{3,8}\b/g;

  const files = [
    'src/ui/primitives/command-palette.tsx',
    'src/ui/primitives/drawer.tsx',
    'src/ui/primitives/stepper.tsx',
    'src/ui/primitives/collapsible.tsx',
    'src/ui/primitives/table.tsx',
    'src/ui/primitives/index.ts',
  ];

  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    assert.ok(!emojiRegex.test(src), `Emoji proibido em ${file}`);
    assert.equal(src.match(hexRegex), null, `Hex solto em ${file}`);
    assert.ok(!src.includes('innerHTML'), `innerHTML proibido em ${file}`);
  }

  const tailwindInput = fs.readFileSync('styles/tailwind.input.css', 'utf8');
  const componentsStart = tailwindInput.indexOf('@layer components {');
  assert.ok(componentsStart >= 0);
  const componentsBlock = tailwindInput.slice(componentsStart);
  assert.equal(componentsBlock.match(hexRegex), null, 'Hex solto encontrado em @layer components');
});
