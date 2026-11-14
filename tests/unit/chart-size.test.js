import test from 'node:test';
import assert from 'node:assert/strict';
import { chartSize, isNarrowViewport } from '../../src/ui/primitives/charts/chart-size.js';

const withWindow = (innerWidth, fn) => {
  globalThis.window = { innerWidth };
  try {
    return fn();
  } finally {
    delete globalThis.window;
  }
};

test('sem janela (Node) e no desktop vale o tamanho de projeto', () => {
  assert.equal(isNarrowViewport(), false);
  assert.deepEqual(chartSize(640, 160), { width: 640, height: 160 });
  withWindow(1440, () => assert.deepEqual(chartSize(640, 160), { width: 640, height: 160 }));
});

test('no celular a largura acompanha o cartão e a altura tem mínimo de 180 px', () => {
  withWindow(375, () => {
    const size = chartSize(640, 160);
    assert.equal(size.width, 311);
    assert.ok(size.height >= 180);
  });
  withWindow(320, () => {
    const size = chartSize(640, 190);
    assert.equal(size.width, 260);
    assert.ok(size.height >= 180);
  });
  // Nunca maior que o tamanho de projeto.
  withWindow(599, () => assert.ok(chartSize(420, 150).width <= 420));
});
