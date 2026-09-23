import test from 'node:test';
import assert from 'node:assert/strict';
import {renderAdaptiveAllocationAdvice,renderExamPhase} from '../../src/ui/renderers/adaptive-planning-renderer.js';

const escapeHtml=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');

test('fase da prova mostra etapa atual, estratégia e prazo restante',()=>{
  const html=renderExamPhase({state:'final_stretch',label:'Reta final',days:18,strategy:'Reforce lacunas prioritárias.'},{escapeHtml});
  assert.match(html,/Fase até a prova/);assert.match(html,/aria-current="step"/);assert.match(html,/18 dias restantes/);assert.match(html,/Reforce lacunas/);
});

test('fase sem data não inventa posição na sequência',()=>{
  const html=renderExamPhase({state:'undated',label:'Prova sem data',strategy:'Defina a data da prova.'},{escapeHtml});
  assert.match(html,/Data da prova não definida/);assert.match(html,/etapas serão posicionadas/);assert.doesNotMatch(html,/aria-current="step"/);
});

test('sugestão mostra origem, destino, capacidade preservada e ação explícita',()=>{
  const html=renderAdaptiveAllocationAdvice({state:'proposal',transferMinutes:30,from:{name:'Informática',beforeMinutes:90,afterMinutes:60},to:{name:'Matemática',beforeMinutes:60,afterMinutes:90},reason:'Baseado na evidência.'},{weeklyPlannedMinutes:150,formatMinutes:n=>`${n} min`,escapeHtml});
  assert.match(html,/Informática/);assert.match(html,/Matemática/);assert.match(html,/90 min → 60 min/);assert.match(html,/Capacidade mantida · 150 min/);assert.match(html,/Aplicar à prévia/);
});

test('sugestão aplicada informa que ainda precisa ser confirmada',()=>{
  const html=renderAdaptiveAllocationAdvice({state:'proposal',applied:true,from:{},to:{}},{escapeHtml});
  assert.match(html,/Aplicado somente à prévia/);assert.doesNotMatch(html,/data-delegated-click/);
});
