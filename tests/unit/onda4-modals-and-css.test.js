import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { Dialog, isBackdropClick, syncDialogOpen } from '../../src/ui/primitives/dialog.js';
import { DataManagementModal } from '../../src/ui/modals/DataManagementModal.js';
import { ExamClassificationModal } from '../../src/ui/modals/ExamClassificationModal.js';
import { StructuredImportModal } from '../../src/ui/modals/StructuredImportModal.js';
import { QuestionsImportModal } from '../../src/ui/modals/QuestionsImportModal.js';
import { ExamImportModal } from '../../src/ui/modals/ExamImportModal.js';
import { GuidedOnboardingModal } from '../../src/ui/modals/GuidedOnboardingModal.js';

const noop = () => {};

function countBalancedCssBraces(css) {
  let depth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inComment = false;

  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    const next = css[i + 1];

    if (inComment) {
      if (ch === '*' && next === '/') {
        inComment = false;
        i++;
      }
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && ch === '/' && next === '*') {
      inComment = true;
      i++;
      continue;
    }

    if (ch === '\\' && (inSingleQuote || inDoubleQuote)) {
      i++;
      continue;
    }

    if (ch === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (ch === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }

    if (inSingleQuote || inDoubleQuote) continue;

    if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth < 0) return { valid: false, depth };
    }
  }

  return { valid: depth === 0 && !inComment && !inSingleQuote && !inDoubleQuote, depth };
}

test('Dialog — suporta maxWidth até 4xl, unstyled, ssrOpenAttr, backdrop e syncDialogOpen', () => {
  const closedHtml = render(
    h(
      Dialog,
      {
        id: 'dialog-teste',
        open: false,
        onClose: noop,
        title: 'Título',
        maxWidth: '4xl',
      },
      h('p', null, 'Conteúdo')
    )
  );
  assert.match(closedHtml, /<dialog\b[^>]*id="dialog-teste"/);
  assert.doesNotMatch(closedHtml, /<dialog\b[^>]*\bopen\b/);
  assert.ok(closedHtml.includes('ui-dialog--4xl'));
  assert.ok(closedHtml.includes('ui-dialog__inner'));
  assert.ok(closedHtml.includes('ui-dialog__header'));
  assert.ok(closedHtml.includes('ui-dialog__body'));

  const bareOpenHtml = render(
    h(
      Dialog,
      {
        id: 'dialog-bare',
        open: true,
        unstyled: true,
        showHeader: false,
        onClose: noop,
        'aria-label': 'Bare',
      },
      h('div', { class: 'conteudo-bare' }, 'Fluxo customizado')
    )
  );
  assert.match(bareOpenHtml, /<dialog\b[^>]*\bopen\b/);
  assert.ok(bareOpenHtml.includes('ui-dialog--bare'));
  assert.ok(!bareOpenHtml.includes('ui-dialog__inner'));
  assert.ok(!bareOpenHtml.includes('ui-dialog__header'));
  assert.ok(bareOpenHtml.includes('Fluxo customizado'));

  const customLayoutHtml = render(
    h(
      Dialog,
      {
        open: true,
        showHeader: false,
        onClose: noop,
        innerClassName: 'caixa-interna',
        bodyClassName: 'corpo-interno',
        footerClassName: 'rodape-interno',
        footer: h('button', { type: 'button' }, 'Ok'),
      },
      h('span', null, 'Miolo')
    )
  );
  assert.ok(customLayoutHtml.includes('ui-dialog__inner caixa-interna'));
  assert.ok(customLayoutHtml.includes('ui-dialog__body corpo-interno'));
  assert.ok(customLayoutHtml.includes('ui-dialog__footer rodape-interno'));

  /** @type {any} */
  const targetEl = {
    getBoundingClientRect: () => ({ left: 100, right: 500, top: 100, bottom: 400, width: 400, height: 300 }),
  };
  assert.equal(
    isBackdropClick(/** @type {any} */ ({ target: targetEl, currentTarget: targetEl, clientX: 50, clientY: 50 })),
    true
  );
  assert.equal(
    isBackdropClick(/** @type {any} */ ({ target: targetEl, currentTarget: targetEl, clientX: 250, clientY: 250 })),
    false
  );
  assert.equal(
    isBackdropClick(/** @type {any} */ ({ target: targetEl, currentTarget: targetEl, clientX: 0, clientY: 0 })),
    true
  );
  assert.equal(
    isBackdropClick(/** @type {any} */ ({ target: {}, currentTarget: targetEl, clientX: 50, clientY: 50 })),
    false
  );

  let showModalCalled = 0;
  let closeCalled = 0;
  const fakeDialog = {
    open: false,
    attrs: new Set(),
    showModal() {
      showModalCalled++;
      this.open = true;
    },
    close() {
      closeCalled++;
      this.open = false;
    },
    hasAttribute(name) {
      return this.attrs.has(name);
    },
    setAttribute(name) {
      this.attrs.add(name);
    },
    removeAttribute(name) {
      this.attrs.delete(name);
    },
  };
  /** @type {any} */
  const fakeDoc = {
    getElementById: id => (id === 'd1' ? fakeDialog : null),
  };
  syncDialogOpen(fakeDoc, 'd1', true);
  assert.equal(showModalCalled, 1);
  assert.equal(fakeDialog.open, true);
  syncDialogOpen(fakeDoc, 'd1', false);
  assert.equal(closeCalled, 1);
  assert.equal(fakeDialog.open, false);
});

test('DataManagementModal e ExamClassificationModal — preservam IDs, Lucide Icons e acessibilidade', () => {
  const closedData = render(h(DataManagementModal, { open: false, onClose: noop }));
  assert.match(closedData, /<dialog\b[^>]*id="dataManagementOverlay"/);
  assert.doesNotMatch(closedData, /<dialog\b[^>]*\bopen\b/);
  assert.ok(!closedData.includes('data-management-dialog show'));

  const openData = render(h(DataManagementModal, { open: true, onClose: noop }));
  assert.match(openData, /<dialog\b[^>]*\bopen\b/);
  assert.ok(openData.includes('ui-dialog--2xl'));
  assert.ok(openData.includes('data-management-dialog show'));
  assert.ok(openData.includes('aria-labelledby="dataManagementTitle"'));
  for (const requiredId of [
    'dataManagementTitle',
    'closeDataManagementBtn',
    'backupExportStatus',
    'reportPeriodSelect',
    'reportPeriodStart',
    'reportPeriodEnd',
    'exportReportBtn',
    'exportBackupBtn',
    'exportAutomaticBackupBtn',
    'importBackupBtn',
    'openRemoteSyncBtn',
    'importBackupFile',
    'dangerZoneTitle',
    'clearAllDataBtn',
  ]) {
    assert.ok(openData.includes(`id="${requiredId}"`), `Faltando #${requiredId}`);
  }
  for (const iconName of [
    'x',
    'file-type-pdf',
    'file-export',
    'download',
    'file-import',
    'cloud',
    'trash',
  ]) {
    assert.ok(openData.includes(`icon-lucide-${iconName}`), `Faltando ícone ${iconName}`);
  }
  assert.ok(!openData.includes(' title='));

  const openClassif = render(h(ExamClassificationModal, { open: true, onClose: noop }));
  assert.ok(openClassif.includes('id="examClassificationOverlay"'));
  assert.ok(openClassif.includes('ui-dialog--2xl show'));
  assert.ok(openClassif.includes('id="examClassificationTitle"'));
  assert.ok(openClassif.includes('aria-describedby='));
  assert.ok(openClassif.includes('id="examClassificationContent"'));
  assert.ok(openClassif.includes('id="examClassificationClose"'));
});

test('StructuredImportModal, QuestionsImportModal, ExamImportModal e GuidedOnboardingModal — preservam contratos declarativos', () => {
  const structHiddenConfirm = render(
    h(StructuredImportModal, { open: true, canConfirm: false, onClose: noop })
  );
  assert.ok(structHiddenConfirm.includes('id="structuredImportOverlay"'));
  assert.ok(structHiddenConfirm.includes('id="structuredImportContent"'));
  assert.ok(structHiddenConfirm.includes('id="structuredImportCancelBtn"'));
  assert.match(
    structHiddenConfirm,
    /<button\b[^>]*(?:id="structuredImportConfirmBtn"[^>]*\bhidden\b|\bhidden\b[^>]*id="structuredImportConfirmBtn")/
  );

  const structVisibleConfirm = render(
    h(StructuredImportModal, { open: true, canConfirm: true, onClose: noop })
  );
  assert.match(structVisibleConfirm, /<button\b[^>]*id="structuredImportConfirmBtn"(?![^>]*\bhidden\b)/);

  const questionsHidden = render(
    h(QuestionsImportModal, { open: true, canConfirm: false, onClose: noop })
  );
  assert.ok(questionsHidden.includes('id="questionsImportOverlay"'));
  assert.ok(questionsHidden.includes('id="questionsImportContent"'));
  assert.ok(questionsHidden.includes('id="questionsImportCancelBtn"'));
  assert.match(
    questionsHidden,
    /<button\b[^>]*(?:id="questionsImportConfirmBtn"[^>]*\bhidden\b|\bhidden\b[^>]*id="questionsImportConfirmBtn")/
  );

  const examClosed = render(h(ExamImportModal, { open: false, onClose: noop }));
  assert.doesNotMatch(examClosed, /<dialog\b[^>]*\bopen\b/);

  const examOpen = render(
    h(ExamImportModal, {
      open: true,
      backHidden: false,
      nextLabel: 'Concluir importação',
      nextDisabled: true,
      onClose: noop,
    })
  );
  assert.ok(examOpen.includes('id="examImportOverlay"'));
  assert.ok(examOpen.includes('ui-dialog--3xl show'));
  assert.ok(examOpen.includes('ui-dialog__inner exam-import-box'));
  assert.ok(examOpen.includes('ui-dialog__body exam-import-body'));
  assert.ok(examOpen.includes('aria-labelledby="examImportTitle"'));
  assert.ok(examOpen.includes('id="examImportTitle"'));
  assert.ok(examOpen.includes('id="examImportContent"'));
  assert.ok(examOpen.includes('id="examImportCancelBtn"'));
  assert.match(examOpen, /<button\b[^>]*id="examImportBackBtn"(?![^>]*\bhidden\b)/);
  assert.ok(examOpen.includes('id="examImportNextBtn"'));
  assert.ok(examOpen.includes('data-testid="confirm-exam-import"'));
  assert.ok(examOpen.includes('Concluir importação'));
  assert.match(
    examOpen,
    /<button\b[^>]*(?:id="examImportNextBtn"[^>]*\bdisabled\b|\bdisabled\b[^>]*id="examImportNextBtn")/
  );

  const onboardingClosed = render(h(GuidedOnboardingModal, { open: false, onClose: noop }));
  assert.ok(onboardingClosed.includes('id="guidedOnboardingOverlay"'));
  assert.doesNotMatch(onboardingClosed, /<dialog\b[^>]*\bopen\b/);
  assert.ok(!onboardingClosed.includes('onboarding-overlay show'));

  const onboardingOpen = render(h(GuidedOnboardingModal, { open: true, onClose: noop }));
  assert.match(onboardingOpen, /<dialog\b[^>]*\bopen\b/);
  assert.ok(onboardingOpen.includes('ui-dialog--bare onboarding-overlay show'));
  assert.ok(onboardingOpen.includes('aria-labelledby="guidedOnboardingTitle"'));
  assert.ok(onboardingOpen.includes('aria-describedby="guidedOnboardingSubtitle"'));
  assert.ok(onboardingOpen.includes('id="guidedOnboardingClose"'));
  assert.ok(onboardingOpen.includes('icon-lucide-x'));
  assert.ok(onboardingOpen.includes('id="guidedOnboardingProgress"'));
  assert.ok(onboardingOpen.includes('id="guidedOnboardingContent"'));
  assert.ok(onboardingOpen.includes('id="guidedOnboardingHelp"'));
  assert.ok(onboardingOpen.includes('id="guidedOnboardingActions"'));
});

test('Governança Onda 4 — cascade @layer único no app.css, zero CSS duplicado/morto e mounts no index.html', () => {
  const appCss = fs.readFileSync('styles/app.css', 'utf8');
  const tailwindInput = fs.readFileSync('styles/tailwind.input.css', 'utf8');
  const compiledTailwind = fs.readFileSync('styles/tailwind.css', 'utf8');

  assert.match(appCss, /^@layer theme, legacy, components, utilities;/);
  const layerLegacyMatches = appCss.match(/@layer\s+legacy\s*\{/g) || [];
  assert.equal(layerLegacyMatches.length, 1, 'styles/app.css deve ter exatamente um @layer legacy');

  const legacyIdx = appCss.indexOf('@layer legacy {');
  const keyframesMatches = [...appCss.matchAll(/@keyframes\b/g)];
  assert.ok(keyframesMatches.length >= 10);
  for (const match of keyframesMatches) {
    assert.ok(
      match.index < legacyIdx,
      `Todos os @keyframes do app.css devem ficar no topo fora de @layer legacy (idx ${match.index})`
    );
  }

  const braces = countBalancedCssBraces(appCss);
  assert.equal(braces.valid, true, `Chaves desbalanceadas em styles/app.css (depth=${braces.depth})`);

  assert.ok(appCss.includes('.card--default'));
  assert.ok(appCss.includes('[hidden]{display:none!important}'));
  assert.doesNotMatch(appCss, /\.ui-/);
  assert.doesNotMatch(appCss, /\.modal-overlay\b/);
  assert.doesNotMatch(appCss, /\.modal-box\b/);
  assert.doesNotMatch(appCss, /\.mobile-more-menu\b/);
  assert.doesNotMatch(appCss, /\.calendar-view-(switch|btn)\b/);

  for (const requiredClass of [
    '.ui-dialog {',
    '.ui-dialog--2xl {',
    '.ui-dialog--3xl {',
    '.ui-dialog--4xl {',
    '.ui-dialog--bare {',
    '.ui-dialog--bare.onboarding-overlay[open]',
    '.metas-nav .ui-tabs {',
    '#sessionModalOverlay .session-modal-fields .ui-select-field__label {',
    '.subjects-import-menu .ui-menu__panel',
    '.performance-nav-stack .ui-tabs__tab {',
  ]) {
    assert.ok(tailwindInput.includes(requiredClass), `Faltando ${requiredClass} em tailwind.input.css`);
  }

  assert.match(
    compiledTailwind,
    /@layer theme[\s\S]*@layer legacy[\s\S]*@layer components[\s\S]*@layer utilities/
  );
  assert.ok(compiledTailwind.includes('.ui-dialog'));

  const indexHtml = fs.readFileSync('index.html', 'utf8');
  for (const mountId of [
    'dataManagementMount',
    'examClassificationMount',
    'structuredImportMount',
    'questionsImportMount',
    'remoteSyncMount',
    'guidedOnboardingMount',
    'confirmModalMount',
    'examImportMount',
  ]) {
    assert.ok(indexHtml.includes(`id="${mountId}"`), `Mount #${mountId} ausente no index.html`);
  }
  for (const legacyOverlayId of [
    'dataManagementOverlay',
    'examClassificationOverlay',
    'structuredImportOverlay',
    'questionsImportOverlay',
    'guidedOnboardingOverlay',
    'examImportOverlay',
    'remoteSyncOverlay',
    'modalOverlay',
  ]) {
    assert.ok(
      !indexHtml.includes(`id="${legacyOverlayId}"`),
      `Overlay legado #${legacyOverlayId} não deve existir estaticamente no index.html`
    );
  }

  const emojiRegex = /\p{Extended_Pictographic}/u;
  const onda4Files = [
    'src/ui/primitives/dialog.tsx',
    'src/ui/modals/DataManagementModal.tsx',
    'src/ui/modals/ExamClassificationModal.tsx',
    'src/ui/modals/StructuredImportModal.tsx',
    'src/ui/modals/QuestionsImportModal.tsx',
    'src/ui/modals/ExamImportModal.tsx',
    'src/ui/modals/GuidedOnboardingModal.tsx',
  ];
  for (const file of onda4Files) {
    const src = fs.readFileSync(file, 'utf8');
    assert.ok(!emojiRegex.test(src), `Emoji proibido em ${file}`);
    assert.equal(src.match(/#[0-9a-fA-F]{3,8}\b/g), null, `Hex solto em ${file}`);
    assert.ok(
      !/innerHTML|dangerouslySetInnerHTML/.test(src),
      `HTML imperativo proibido em ${file}`
    );
    assert.ok(!/\bstyle=/.test(src), `Style inline proibido em ${file}`);
  }
});
