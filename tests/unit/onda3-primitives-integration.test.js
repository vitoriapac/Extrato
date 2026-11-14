import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { SessionModalSheet } from '../../src/ui/modals/SessionModalSheet.js';
import {
  PerformancePageNav,
  performanceGroupOf,
} from '../../src/ui/performance/PerformancePageNav.js';
import { renderPerformancePage } from '../../src/ui/performance/performance-page.js';
import { PlanningSubtabsNav } from '../../src/ui/components/PlanningSubtabsNav.js';
import { TodayExecutionModeSwitch } from '../../src/ui/tabs/today/TodayExecutionModeSwitch.js';
import { CalendarViewSwitch } from '../../src/ui/tabs/calendar/CalendarViewSwitch.js';
import { SubjectsTab } from '../../src/ui/tabs/subjects/SubjectsTab.js';

const noop = () => {};

function createBaseSessionSheetProps(overrides = {}) {
  return {
    open: true,
    sessionKey: 1,
    restoreFocusOnClose: true,
    activityHint: 'Confirme ou ajuste os detalhes antes de registrar no histórico.',
    durationFormatted: '00:25:00',
    durationMinutesValue: '25',
    durationMinutesPlaceholder: '25',
    subjectOptions: [
      { value: '', label: 'Sem disciplina específica' },
      { value: 's1', label: 'Português' },
    ],
    topicOptions: [
      { value: '', label: 'Sem tópico específico' },
      { value: 't1', label: 'Interpretação de texto' },
    ],
    subjectId: 's1',
    topicId: 't1',
    activityType: 'study',
    resolvedValue: '',
    correctValue: '',
    pagesReadValue: '',
    videoBlocksValue: '',
    difficultyValue: '',
    retentionValue: '',
    focusValue: '',
    energyValue: '',
    optionalOpen: false,
    notesValue: '',
    bookmark: {
      hidden: false,
      open: false,
      clearMarked: false,
      clearBtnHidden: true,
      resourceType: 'pdf',
      label: '',
      currentUnit: '',
      totalUnits: '',
      positionText: '',
    },
    onDurationMinutesChange: noop,
    onSubjectChange: noop,
    onTopicChange: noop,
    onActivityTypeChange: noop,
    onResolvedChange: noop,
    onCorrectChange: noop,
    onPagesReadChange: noop,
    onVideoBlocksChange: noop,
    onDifficultyChange: noop,
    onRetentionChange: noop,
    onFocusChange: noop,
    onEnergyChange: noop,
    onOptionalToggle: noop,
    onNotesChange: noop,
    onBookmarkFieldChange: noop,
    onBookmarkToggle: noop,
    onBookmarkClear: noop,
    onSkip: noop,
    onDismiss: noop,
    onSave: noop,
    ...overrides,
  };
}

test('SessionModalSheet — usa BottomSheet + SelectField e alterna campos por atividade e bookmark', () => {
  const closedHtml = render(h(SessionModalSheet, createBaseSessionSheetProps({ open: false })));
  assert.match(closedHtml, /<dialog\b[^>]*id="sessionModalOverlay"/);
  assert.doesNotMatch(closedHtml, /<dialog\b[^>]*\bopen\b/);
  assert.ok(!closedHtml.includes('ui-bottom-sheet--lg show'));
  assert.ok(closedHtml.includes('aria-labelledby="sessionModalTitle"'));
  assert.ok(closedHtml.includes('aria-describedby="sessionModalActivityHint"'));

  const studyHtml = render(
    h(SessionModalSheet, createBaseSessionSheetProps({ activityType: 'study' }))
  );
  assert.match(studyHtml, /<dialog\b[^>]*\bopen\b/);
  assert.ok(studyHtml.includes('ui-bottom-sheet--lg show'));
  assert.ok(studyHtml.includes('ui-bottom-sheet__handle'));
  assert.ok(studyHtml.includes('ui-bottom-sheet__footer'));
  assert.equal((studyHtml.match(/class="ui-select-field(?:\s|")/g) || []).length, 8);
  assert.ok(studyHtml.includes('id="sessionModalSubject"'));
  assert.ok(studyHtml.includes('id="sessionModalTopic"'));
  assert.ok(studyHtml.includes('id="sessionModalType"'));
  assert.ok(studyHtml.includes('id="sessionModalDifficulty"'));
  assert.ok(studyHtml.includes('id="sessionModalRetention"'));
  assert.ok(studyHtml.includes('id="sessionBookmarkType"'));
  assert.ok(studyHtml.includes('id="sessionModalFocus"'));
  assert.ok(studyHtml.includes('id="sessionModalEnergy"'));
  assert.ok(!studyHtml.includes(' title='));
  assert.match(studyHtml, /<section\b[^>]*data-session-fields="study"(?![^>]*\bhidden\b)/);
  assert.match(studyHtml, /<section\b[^>]*data-session-fields="questions"[^>]*\bhidden\b/);
  assert.match(studyHtml, /<section\b[^>]*data-session-fields="review"[^>]*\bhidden\b/);
  assert.match(studyHtml, /<p\b[^>]*data-session-fields="simulation"[^>]*\bhidden\b/);
  assert.match(studyHtml, /<details\b[^>]*id="sessionBookmarkSection"(?![^>]*\bhidden\b)/);

  const questionsHtml = render(
    h(SessionModalSheet, createBaseSessionSheetProps({ activityType: 'questions' }))
  );
  assert.match(questionsHtml, /<section\b[^>]*data-session-fields="questions"(?![^>]*\bhidden\b)/);
  assert.match(questionsHtml, /<section\b[^>]*data-session-fields="study"[^>]*\bhidden\b/);

  const reviewHtml = render(
    h(SessionModalSheet, createBaseSessionSheetProps({ activityType: 'review' }))
  );
  assert.match(reviewHtml, /<section\b[^>]*data-session-fields="review"(?![^>]*\bhidden\b)/);
  assert.match(reviewHtml, /<section\b[^>]*data-session-fields="study questions"[^>]*\bhidden\b/);

  const simulationHtml = render(
    h(
      SessionModalSheet,
      createBaseSessionSheetProps({
        activityType: 'simulation',
        bookmark: {
          hidden: true,
          open: false,
          clearMarked: true,
          clearBtnHidden: false,
          resourceType: 'pdf',
          label: 'Aula 01',
          currentUnit: '10',
          totalUnits: '50',
          positionText: '',
        },
      })
    )
  );
  assert.match(simulationHtml, /<p\b[^>]*data-session-fields="simulation"(?![^>]*\bhidden\b)/);
  assert.match(simulationHtml, /<details\b[^>]*id="sessionBookmarkSection"[^>]*\bhidden\b/);
  assert.ok(simulationHtml.includes('data-clear="1"'));
  assert.ok(simulationHtml.includes('Será removido ao salvar'));
});

test('PerformancePageNav e renderPerformancePage — usa Tabs em dois níveis sem aria-current inválido', () => {
  assert.equal(performanceGroupOf('overview'), 'overview');
  assert.equal(performanceGroupOf('diagnosis'), 'diagnosis');
  assert.equal(performanceGroupOf('simulations'), 'proofs');
  assert.equal(performanceGroupOf('history'), null);

  const overviewNav = render(h(PerformancePageNav, { activeSection: 'overview' }));
  assert.equal((overviewNav.match(/role="tablist"/g) || []).length, 1);
  assert.ok(overviewNav.includes('aria-label="Análises de desempenho"'));
  assert.ok(overviewNav.includes('id="performanceTab-overview"'));
  assert.ok(overviewNav.includes('aria-selected="true"'));
  assert.ok(overviewNav.includes('aria-controls="performanceSectionContent"'));
  assert.ok(!overviewNav.includes('ui-tabs__list--contained'));

  const proofsNav = render(h(PerformancePageNav, { activeSection: 'simulations' }));
  assert.equal((proofsNav.match(/role="tablist"/g) || []).length, 2);
  assert.ok(proofsNav.includes('ui-tabs__list--contained'));
  assert.ok(proofsNav.includes('id="performanceGroupTab-proofs"'));
  assert.ok(proofsNav.includes('aria-controls="performanceSubnav-proofs"'));
  assert.ok(proofsNav.includes('id="performanceSubnav-proofs"'));
  assert.ok(proofsNav.includes('aria-label="Seções de Questões e provas"'));
  assert.ok(proofsNav.includes('id="performanceTab-simulations"'));
  assert.ok(!proofsNav.includes('aria-current='));

  const fullPageHtml = renderPerformancePage({
    viewState: { section: 'diagnosis', period: '30', comparePrevious: false },
    range: { label: 'Últimos 30 dias', previous: null },
    escapeHtml: v => String(v ?? ''),
    escapeAttr: v => String(v ?? ''),
  });
  assert.ok(fullPageHtml.includes('data-performance-nav="true"'));
  assert.ok(
    fullPageHtml.includes(
      '<div id="performanceSectionContent" role="tabpanel" aria-labelledby="performanceTab-diagnosis">'
    )
  );
});

test('PlanningSubtabsNav — renderiza Tabs sublinhadas acessíveis com aria-controls e aria-selected', () => {
  const html = render(h(PlanningSubtabsNav, { activeSubtab: 'prova' }));
  assert.ok(html.includes('role="tablist"'));
  assert.ok(html.includes('aria-label="Seções do Planejamento"'));
  assert.ok(html.includes('id="metasTab-prova"'));
  assert.ok(html.includes('class="ui-tabs__tab metas-subtab active"'));
  assert.ok(html.includes('aria-controls="metasSub-prova"'));
  assert.equal((html.match(/aria-selected="true"/g) || []).length, 1);
  assert.equal((html.match(/aria-selected="false"/g) || []).length, 4);
  assert.ok(!html.includes('aria-current='));
});

test('SegmentedControl em Hoje, Agenda e Disciplinas — renderiza role="group", aria-pressed e filtros por concurso', () => {
  const todayHtml = render(h(TodayExecutionModeSwitch, { value: 'sequence', onChange: noop }));
  assert.ok(todayHtml.includes('role="group"'));
  assert.ok(todayHtml.includes('aria-label="Modo de execução"'));
  assert.ok(todayHtml.includes('ui-segmented--sm'));
  assert.ok(todayHtml.includes('id="executionAgendaBtn"'));
  assert.ok(todayHtml.includes('id="executionSequenceBtn"'));
  assert.equal((todayHtml.match(/aria-pressed="true"/g) || []).length, 1);

  const calHtml = render(h(CalendarViewSwitch, { value: 'agenda', onChange: noop }));
  assert.ok(calHtml.includes('role="group"'));
  assert.ok(calHtml.includes('aria-label="Visualização das tarefas"'));
  assert.ok(calHtml.includes('data-calendar-view="month"'));
  assert.ok(calHtml.includes('data-calendar-view="agenda"'));
  assert.equal((calHtml.match(/aria-pressed="true"/g) || []).length, 1);

  const subjectsHtml = render(
    h(SubjectsTab, {
      subjects: [
        {
          id: 's1',
          name: 'Conhecimentos Bancários',
          collapsed: false,
          archived: false,
          topics: [
            {
              id: 't1',
              name: 'Sistema Financeiro Nacional',
              status: 'Em andamento',
              difficulty: 'Médio',
              tags: [],
              examTags: ['bb-escriturario'],
              archived: false,
            },
          ],
        },
      ],
      archivedSubjects: [],
      subjectExamFilter: 'bb',
      subjectProgressFn: () => 50,
      subjectTopicFilters: new Map(),
      subjectTopicLimits: new Map(),
      openNotesIds: new Set(),
      statusOptions: ['Não iniciado', 'Em andamento', 'Concluído'],
      statusClasses: {
        'Não iniciado': 'st-nao',
        'Em andamento': 'st-andamento',
        Concluído: 'st-concluido',
      },
      difficultyOptions: ['Fácil', 'Médio', 'Difícil'],
      difficultyClasses: {
        Fácil: 'diff-facil',
        Médio: 'diff-medio',
        Difícil: 'diff-dificil',
      },
      topicMatchesExamFn: () => true,
      matchesSearchFn: () => true,
      pluralizeFn: (c, s, p) => (c === 1 ? `1 ${s}` : `${c} ${p || `${s}s`}`),
    })
  );
  assert.ok(subjectsHtml.includes('aria-label="Filtrar conteúdo por concurso"'));
  assert.ok(subjectsHtml.includes('ui-segmented ui-segmented--sm exam-scope-filter'));
  assert.ok(subjectsHtml.includes('data-exam-filter="bb"'));
  assert.match(
    subjectsHtml,
    /aria-pressed="true"[^>]*data-exam-filter="bb"|data-exam-filter="bb"[^>]*aria-pressed="true"/
  );
});

test('Governança Onda 3 — zero emojis, zero hex solto, zero innerHTML/style e mounts declarativos no HTML', () => {
  const emojiRegex = /\p{Extended_Pictographic}/u;
  const onda3Components = [
    'src/ui/modals/SessionModalSheet.tsx',
    'src/ui/performance/PerformancePageNav.tsx',
    'src/ui/components/PlanningSubtabsNav.tsx',
    'src/ui/tabs/today/TodayExecutionModeSwitch.tsx',
    'src/ui/tabs/calendar/CalendarViewSwitch.tsx',
    'src/ui/tabs/subjects/SubjectsTab.tsx',
  ];

  for (const file of onda3Components) {
    const src = fs.readFileSync(file, 'utf8');
    assert.ok(!emojiRegex.test(src), `Emoji proibido em ${file}`);
    assert.equal(src.match(/#[0-9a-fA-F]{3,8}\b/g), null, `Hex solto em ${file}`);
    assert.ok(
      !/innerHTML|dangerouslySetInnerHTML/.test(src),
      `HTML imperativo proibido em ${file}`
    );
    assert.ok(!/\bstyle=/.test(src), `Style inline proibido em ${file}`);
    const checkTitleSrc =
      file === 'src/ui/modals/SessionModalSheet.tsx'
        ? src.replace('title="Confirmar depósito de estudo"', '')
        : src;
    assert.ok(!/\btitle=/.test(checkTitleSrc), `Atributo title= proibido em ${file}`);
  }

  const indexHtml = fs.readFileSync('index.html', 'utf8');
  assert.ok(indexHtml.includes('id="sessionModalMount"'));
  assert.ok(!indexHtml.includes('id="sessionModalOverlay"'));
  assert.ok(indexHtml.includes('id="todayExecutionModeMount"'));
  assert.ok(!indexHtml.includes('id="executionAgendaBtn"'));
  assert.ok(indexHtml.includes('id="calendarViewSwitchMount"'));
  assert.ok(indexHtml.includes('id="metasSubtabsMount"'));
  assert.ok(!indexHtml.includes('id="metasTab-semana"'));
});
