import test from 'node:test';
import assert from 'node:assert/strict';
import { createMasterRenderer } from '../../src/bootstrap/master-renderer.js';

test('createMasterRenderer — render padrão com escopo all e ciclo de profundidade', () => {
  const calls = [];
  const startCalls = [];
  const finishCalls = [];

  const renderer = createMasterRenderer({
    applicationRenderer: {
      render: scope => {
        calls.push(scope);
        return { rendered: scope };
      },
    },
    getActiveTabName: () => 'hoje',
    onRenderStart: () => startCalls.push(true),
    onRenderFinish: () => finishCalls.push(true),
  });

  assert.equal(renderer.isRendering(), false);
  assert.equal(renderer.getDepth(), 0);

  const result = renderer.render();

  assert.deepEqual(calls, ['all']);
  assert.deepEqual(result, { rendered: 'all' });
  assert.equal(startCalls.length, 1);
  assert.equal(finishCalls.length, 1);
  assert.equal(renderer.isRendering(), false);
  assert.equal(renderer.getDepth(), 0);
});

test('createMasterRenderer — renderDepth em chamadas aninhadas', () => {
  let innerDepth = 0;
  let outerDepth = 0;
  let renderer;

  renderer = createMasterRenderer({
    applicationRenderer: {
      render: scope => {
        if (scope === 'outer') {
          outerDepth = renderer.getDepth();
          renderer.render('inner');
        } else if (scope === 'inner') {
          innerDepth = renderer.getDepth();
        }
      },
    },
    getActiveTabName: () => 'dashboard',
  });

  renderer.render('outer');

  assert.equal(outerDepth, 1);
  assert.equal(innerDepth, 2);
  assert.equal(renderer.getDepth(), 0);
  assert.equal(renderer.isRendering(), false);
});

test('createMasterRenderer — executa renderStudyTrack32Insights em escopos aplicáveis', () => {
  let insightsCount = 0;
  let activeTab = 'hoje';

  const renderer = createMasterRenderer({
    applicationRenderer: {
      render: () => {},
    },
    getActiveTabName: () => activeTab,
    renderStudyTrack32Insights: () => {
      insightsCount++;
    },
  });

  // 1. scope = 'all' -> deve chamar
  renderer.render('all');
  assert.equal(insightsCount, 1);

  // 2. scope = 'dashboard' -> deve chamar
  renderer.render('dashboard');
  assert.equal(insightsCount, 2);

  // 3. scope = 'metas' -> deve chamar
  renderer.render('metas');
  assert.equal(insightsCount, 3);

  // 4. scope = 'active' com activeTab = 'hoje' -> NÃO deve chamar
  renderer.render('active');
  assert.equal(insightsCount, 3);

  // 5. scope = 'active' com activeTab = 'dashboard' -> deve chamar
  activeTab = 'dashboard';
  renderer.render('active');
  assert.equal(insightsCount, 4);
});

test('createMasterRenderer — captura exceção em insights e reporta ao errorBoundary', () => {
  const reportedErrors = [];
  const renderer = createMasterRenderer({
    applicationRenderer: {
      render: () => {},
    },
    getActiveTabName: () => 'dashboard',
    renderStudyTrack32Insights: () => {
      throw new Error('Falha simulada em insights');
    },
    errorBoundary: {
      report: (err, name) => {
        reportedErrors.push({ err, name });
      },
    },
  });

  renderer.render('all');

  assert.equal(reportedErrors.length, 1);
  assert.equal(reportedErrors[0].name, 'análises estratégicas');
  assert.equal(reportedErrors[0].err.message, 'Falha simulada em insights');
});

test('createMasterRenderer — persistAndRender renderiza active e chama scheduleSave', () => {
  const renderedScopes = [];
  let saveScheduled = false;

  const renderer = createMasterRenderer({
    applicationRenderer: {
      render: scope => renderedScopes.push(scope),
    },
    getActiveTabName: () => 'disciplinas',
    scheduleSave: () => {
      saveScheduled = true;
    },
  });

  renderer.persistAndRender();

  assert.deepEqual(renderedScopes, ['active']);
  assert.equal(saveScheduled, true);
});

test('createMasterRenderer — renderAll delega para render com escopo all', () => {
  const renderedScopes = [];

  const renderer = createMasterRenderer({
    applicationRenderer: {
      render: scope => renderedScopes.push(scope),
    },
    getActiveTabName: () => 'dashboard',
  });

  renderer.renderAll();

  assert.deepEqual(renderedScopes, ['all']);
});
