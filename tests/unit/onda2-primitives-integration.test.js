import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { MobileMoreMenu } from '../../src/ui/components/MobileMoreMenu.js';
import { ImportActionMenu } from '../../src/ui/components/ImportActionMenu.js';
import { ReviewRatingSheet } from '../../src/ui/modals/ReviewRatingSheet.js';
import { SubjectCombobox } from '../../src/ui/components/SubjectCombobox.js';
import { WindowBadge, renderWindowBadge } from '../../src/ui/performance/window-badge.js';
import {
  EvidenceBadge,
  coverageEvidence,
  renderEvidenceBadge,
} from '../../src/ui/performance/evidence-badge.js';
import { CareerBenchmarkCard } from '../../src/ui/components/CareerBenchmarkCard.js';
import { calculateCareerBenchmarkComparison } from '../../src/domain/analytics/career-benchmarks.js';
import { WhatIfSimulatorModal } from '../../src/ui/forecasts/WhatIfSimulatorModal.js';

test('MobileMoreMenu — preserva seletores móveis, itens keepMounted e estado ativo', () => {
  const html = render(
    h(MobileMoreMenu, {
      activeTab: 'disciplinas',
      open: false,
      onOpenChange: () => {},
      onSelectTab: () => {},
    })
  );

  assert.ok(html.includes('id="moreTabButton"'));
  assert.ok(html.includes('id="mobileMoreMenu"'));
  assert.ok(html.includes('data-more-tab="questoes"'));
  assert.ok(html.includes('data-more-tab="disciplinas"'));
  assert.ok(html.includes('data-more-tab="metas"'));
  assert.ok(html.includes('data-more-tab="instrucoes"'));
  assert.ok(html.includes('aria-current="page"'));
  assert.ok(html.includes('more-tab-btn active'));
  assert.ok(html.includes('icon-lucide-dots'));
  assert.ok(html.includes('role="menu"'));
});

test('ImportActionMenu — renderiza menus keepMounted de disciplinas e questões', () => {
  const subjectsHtml = render(h(ImportActionMenu, { menuType: 'subjects' }));
  assert.ok(subjectsHtml.includes('subjects-import-menu'));
  assert.ok(subjectsHtml.includes('id="loadDefaultSubjectsBtn"'));
  assert.ok(subjectsHtml.includes('data-testid="open-exam-import"'));
  assert.ok(subjectsHtml.includes('id="structuredContentImportBtn"'));
  assert.ok(subjectsHtml.includes('id="downloadStructuredCsvBtn"'));
  assert.ok(subjectsHtml.includes('role="menuitem"'));

  const questionsHtml = render(h(ImportActionMenu, { menuType: 'questions' }));
  assert.ok(questionsHtml.includes('questions-import-menu'));
  assert.ok(questionsHtml.includes('id="importQuestionsBtn"'));
  assert.ok(questionsHtml.includes('id="downloadQuestionsCsvBtn"'));
});

test('ReviewRatingSheet — usa BottomSheet acessível com quatro avaliações SM-2', () => {
  const html = render(
    h(ReviewRatingSheet, {
      open: true,
      topicLabel: 'Direito Constitucional — Art. 5º',
      restoreFocusOnClose: true,
      onRate: () => {},
      onCancel: () => {},
    })
  );

  assert.ok(html.includes('id="reviewRatingOverlay"'));
  assert.ok(html.includes('ui-bottom-sheet'));
  assert.ok(html.includes('Direito Constitucional — Art. 5º'));
  assert.ok(html.includes('data-review-rating="again"'));
  assert.ok(html.includes('data-review-rating="hard"'));
  assert.ok(html.includes('data-review-rating="good"'));
  assert.ok(html.includes('data-review-rating="easy"'));
  assert.ok(html.includes('id="reviewRatingCancelBtn"'));
  assert.ok(html.includes('icon-lucide-circle-check'));
  assert.ok(!html.includes(' title='));
});

test('SubjectCombobox — mantém valor vazio como placeholder e expõe data-selected-value', () => {
  const emptyHtml = render(
    h(SubjectCombobox, {
      id: 'timerSubjectSelect',
      label: 'Disciplina da sessão',
      placeholder: 'Sem disciplina específica',
      value: '',
      options: [
        { value: '', label: 'Sem disciplina específica' },
        { value: 's1', label: 'Português' },
      ],
      onChange: () => {},
    })
  );
  assert.ok(emptyHtml.includes('id="timerSubjectSelect"'));
  assert.ok(emptyHtml.includes('role="combobox"'));
  assert.ok(emptyHtml.includes('placeholder="Sem disciplina específica"'));
  assert.match(emptyHtml, /\bdata-selected-value(?:="")?(?=[\s>])/);
  assert.ok(!emptyHtml.includes('value="Sem disciplina específica"'));

  const selectedHtml = render(
    h(SubjectCombobox, {
      id: 'agendaFilterSubject',
      label: 'Filtrar revisões por disciplina',
      placeholder: 'Todas as disciplinas',
      value: 's1',
      disabled: true,
      options: [
        { value: '', label: 'Todas as disciplinas' },
        { value: 's1', label: 'Português' },
      ],
      onChange: () => {},
    })
  );
  assert.ok(selectedHtml.includes('data-selected-value="s1"'));
  assert.ok(selectedHtml.includes('value="Português"'));
  assert.ok(selectedHtml.includes('disabled'));
});

test('WindowBadge e EvidenceBadge — preservam strings HTML e adotam Tooltip acessível em Preact', () => {
  assert.match(renderWindowBadge('period', 'Últimos 30 dias'), /data-window="period"[^>]*title=/);
  assert.match(renderEvidenceBadge('low', 'Poucas questões'), /data-evidence="low"[^>]*title=/);
  assert.equal(coverageEvidence(0, 2), 'insufficient');

  const winHtml = render(h(WindowBadge, { kind: 'history', title: 'Todo o histórico registrado' }));
  assert.ok(winHtml.includes('ui-tooltip'));
  assert.ok(winHtml.includes('performance-window'));
  assert.ok(!winHtml.includes(' title='));

  const evHtml = render(h(EvidenceBadge, { state: 'small', title: 'Amostra reduzida' }));
  assert.ok(evHtml.includes('ui-tooltip'));
  assert.ok(evHtml.includes('performance-evidence'));
  assert.ok(!evHtml.includes(' title='));
});

test('CareerBenchmarkCard e WhatIfSimulatorModal — usam SelectField e Tooltips acessíveis sem title nativo', () => {
  const comparison = calculateCareerBenchmarkComparison(
    {
      studiedHours: 22,
      resolvedQuestions: 180,
      accuracyPercent: 78,
      theoryMinutes: 300,
      questionsMinutes: 400,
      reviewMinutes: 200,
    },
    'bancaria-administrativa'
  );
  const benchHtml = render(
    h(CareerBenchmarkCard, { comparison, selectedCareerId: 'bancaria-administrativa' })
  );
  assert.ok(benchHtml.includes('ui-select-field--inline'));
  assert.ok(benchHtml.includes('ui-select-field__control'));
  assert.ok(benchHtml.includes('ui-tooltip'));
  assert.ok(!benchHtml.includes(' title='));

  const modalHtml = render(
    h(WhatIfSimulatorModal, {
      open: true,
      onClose: () => {},
      currentMetrics: {
        readinessScore: 60,
        coverageScore: 50,
        masteryScore: 55,
        weeklyStudyMinutes: 600,
      },
    })
  );
  assert.equal((modalHtml.match(/class="ui-tooltip"/g) || []).length, 4);
  assert.ok(modalHtml.includes('Como a Prontidão Geral é calculada'));
  assert.ok(modalHtml.includes('Como a Carga Semanal é calculada'));
  assert.ok(modalHtml.includes('Como a Cobertura do Edital é calculada'));
  assert.ok(modalHtml.includes('Como o Prazo para a Meta é estimado'));
  assert.ok(!modalHtml.includes(' title='));
});

test('Governança Onda 2 — zero emojis, zero hex solto, zero innerHTML e remoção de initSearchableSelects', () => {
  const emojiRegex = /\p{Extended_Pictographic}/u;
  const tooltipHtmlOnlyComponents = [
    'src/ui/components/MobileMoreMenu.tsx',
    'src/ui/components/ImportActionMenu.tsx',
    'src/ui/components/SubjectCombobox.tsx',
    'src/ui/performance/window-badge.tsx',
    'src/ui/performance/evidence-badge.tsx',
    'src/ui/modals/ReviewRatingSheet.tsx',
  ];
  for (const file of tooltipHtmlOnlyComponents) {
    const src = fs.readFileSync(file, 'utf8');
    assert.ok(!emojiRegex.test(src), `Emoji proibido em ${file}`);
    assert.equal(src.match(/#[0-9a-fA-F]{3,8}\b/g), null, `Hex solto em ${file}`);
    assert.ok(!/innerHTML/.test(src), `innerHTML proibido em ${file}`);
    assert.ok(!/\bstyle=/.test(src), `Style inline proibido em ${file}`);
    if (file === 'src/ui/performance/window-badge.tsx') {
      const jsxSrc = src.slice(src.indexOf('export function WindowBadge'));
      assert.ok(!/\btitle=/.test(jsxSrc), `Atributo title= proibido em JSX de ${file}`);
    } else if (file === 'src/ui/performance/evidence-badge.tsx') {
      const jsxSrc = src.slice(src.indexOf('export function EvidenceBadge'));
      assert.ok(!/\btitle=/.test(jsxSrc), `Atributo title= proibido em JSX de ${file}`);
    } else if (file === 'src/ui/modals/ReviewRatingSheet.tsx') {
      const withoutSheetTitle = src.replace(/\btitle=\{titleText\}|\btitle="[^"]*"/, '');
      assert.ok(!/\btitle=/.test(withoutSheetTitle), `Atributo title= proibido em ${file}`);
    } else {
      assert.ok(!/\btitle=/.test(src), `Atributo title= proibido em ${file}`);
    }
  }

  for (const file of [
    'src/ui/components/CareerBenchmarkCard.tsx',
    'src/ui/forecasts/WhatIfSimulatorModal.tsx',
  ]) {
    const src = fs.readFileSync(file, 'utf8');
    assert.ok(!emojiRegex.test(src), `Emoji proibido em ${file}`);
    assert.equal(src.match(/#[0-9a-fA-F]{3,8}\b/g), null, `Hex solto em ${file}`);
    assert.ok(!/innerHTML/.test(src), `innerHTML proibido em ${file}`);
    const checkSrc =
      file === 'src/ui/forecasts/WhatIfSimulatorModal.tsx'
        ? src.replace(
            '<Dialog\n      open={open}\n      onClose={onClose}\n      title="Simulador de Cenários — E se?"',
            ''
          )
        : src;
    assert.ok(!/\btitle=/.test(checkSrc), `Atributo title= proibido em ${file}`);
  }

  assert.ok(!fs.existsSync('src/ui/performance/evidence-badge.ts'));
  assert.ok(!fs.readFileSync('src/ui/lazy-details.ts', 'utf8').includes('initSearchableSelects'));
  assert.ok(
    !fs
      .readFileSync('src/bootstrap/ui/wire-analytics-and-shell-ui.ts', 'utf8')
      .includes('initSearchableSelects')
  );
  assert.ok(!fs.readFileSync('styles/app.css', 'utf8').includes('.select-search'));
});
