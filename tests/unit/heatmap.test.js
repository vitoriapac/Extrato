import test from 'node:test';
import assert from 'node:assert/strict';
import {heatmapMetricLevel,heatmapMetricValue} from '../../src/domain/analytics/heatmap.js';

test('calcula intensidade independente para cada métrica do heatmap',()=>{
  const summary={seconds:3600,targetSeconds:7200,goalPct:50,questions:55,reviews:2,simulations:1};
  assert.equal(heatmapMetricLevel(summary,'hours'),2);
  assert.equal(heatmapMetricLevel(summary,'questions'),3);
  assert.equal(heatmapMetricLevel(summary,'reviews'),2);
  assert.equal(heatmapMetricLevel(summary,'simulations'),1);
  assert.equal(heatmapMetricValue(summary,'questions'),55);
});

test('mantém dias sem atividade no nível zero',()=>{
  assert.equal(heatmapMetricLevel({},'hours'),0);
  assert.equal(heatmapMetricLevel({},'reviews'),0);
});
