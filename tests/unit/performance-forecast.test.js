import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPerformanceForecast} from '../../src/domain/forecasts/performance-forecast.js';

test('calcula faixa atual e distância conservadora até a meta',()=>{
  const result=buildPerformanceForecast({currentValue:70,currentConfidence:.5,targetScore:80});
  assert.equal(result.available,true);
  assert.deepEqual(result.currentBand,{central:70,low:61,high:79,confidence:.5,confidenceLabel:'Média'});
  assert.deepEqual(result.gap,{minimum:1,maximum:19,target:80});
});

test('não cria previsão de 30 dias sem amostra e período mínimos',()=>{
  const result=buildPerformanceForecast({currentValue:60,currentConfidence:.4,observations:[{date:'2026-08-20',value:55,sampleSize:20},{date:'2026-08-27',value:60,sampleSize:20}]});
  assert.equal(result.forecast30.available,false);
  assert.match(result.forecast30.reason,/Aguardando/);
});

test('projeta intervalo de 30 dias quando o histórico é suficiente',()=>{
  const result=buildPerformanceForecast({currentValue:68,currentConfidence:.65,targetScore:80,observations:[
    {date:'2026-07-01',value:52,sampleSize:30},{date:'2026-07-08',value:56,sampleSize:30},{date:'2026-07-15',value:60,sampleSize:30},{date:'2026-07-22',value:64,sampleSize:30},{date:'2026-07-29',value:68,sampleSize:30}
  ]});
  assert.equal(result.forecast30.available,true);
  assert.ok(result.forecast30.low<result.forecast30.high);
  assert.ok(result.forecast30.slopePerWeek>0);
  assert.equal(result.evidence.sampleSize,150);
  assert.equal(result.movingAverage,64);
});

test('preserva estado vazio quando a estimativa atual é ausente',()=>{
  const result=buildPerformanceForecast({currentValue:null,observations:[]});
  assert.equal(result.available,false);
  assert.equal(result.currentBand,null);
});
