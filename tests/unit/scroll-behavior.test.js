import test from 'node:test';
import assert from 'node:assert/strict';
import { scrollBehavior } from '../../src/ui/accessibility.js';

test('rolagem é instantânea quando o sistema pede menos movimento', t => {
  const original = globalThis.matchMedia;
  t.after(() => {
    globalThis.matchMedia = original;
  });

  globalThis.matchMedia = /** @type {any} */ (() => ({ matches: true }));
  assert.equal(scrollBehavior(), 'auto');

  globalThis.matchMedia = /** @type {any} */ (() => ({ matches: false }));
  assert.equal(scrollBehavior(), 'smooth');

  globalThis.matchMedia = undefined;
  assert.equal(scrollBehavior(), 'smooth');
});
