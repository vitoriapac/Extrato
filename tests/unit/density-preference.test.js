import test from 'node:test';
import assert from 'node:assert/strict';
import { createDensityController } from '../../src/ui/controllers/preferences-controller.js';

test('densidade: alterna compacta/confortável, salva a preferência e atualiza o botão', () => {
  const attrs = {};
  const button = { innerHTML: '', attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } };
  const document = {
    documentElement: {
      getAttribute: k => attrs[k] ?? null,
      setAttribute: (k, v) => (attrs[k] = v),
      removeAttribute: k => delete attrs[k],
    },
    getElementById: id => (id === 'densityToggleBtn' ? button : null),
  };
  const saved = {};
  const controller = createDensityController({ document, storage: { setItem: (k, v) => (saved[k] = v) } });
  assert.equal(controller.sync(), 'comfortable');
  assert.equal(button.attrs['aria-pressed'], 'false');
  assert.equal(controller.toggle(), 'compact');
  assert.equal(attrs['data-density'], 'compact');
  assert.equal(saved['studytrack.density'], 'compact');
  assert.equal(button.attrs['aria-pressed'], 'true');
  assert.match(button.innerHTML, /icon-lucide-baseline-density-small/);
  assert.equal(controller.toggle(), 'comfortable');
  assert.equal('data-density' in attrs, false);
  // Storage failures (private mode) never break the toggle.
  const broken = createDensityController({ document, storage: { setItem() { throw new Error('x'); } } });
  assert.equal(broken.toggle(), 'compact');
});
