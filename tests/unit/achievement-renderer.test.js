import test from 'node:test';
import assert from 'node:assert/strict';
import {renderAchievementGroups} from '../../src/ui/renderers/achievement-renderer.js';
import {buildAchievementViewModel} from '../../src/application/achievements/build-achievement-view-model.js';

const escapeHtml=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');

test('renderer apresenta desbloqueadas e próximas em grupos distintos',()=>{
  const html=renderAchievementGroups(buildAchievementViewModel([{icon:'✓',name:'Concluída',desc:'Primeira sessão',unlocked:true},{icon:'◷',name:'Cem horas',desc:'100 horas',unlocked:false}]),{escapeHtml});
  assert.match(html,/Desbloqueadas <span>1<\/span>/);assert.match(html,/Próximas conquistas <span>1<\/span>/);assert.match(html,/aria-label="Concluída: desbloqueada"/);assert.match(html,/aria-label="Cem horas: bloqueada"/);
});

test('renderer escapa texto do catálogo',()=>{
  const html=renderAchievementGroups(buildAchievementViewModel([{icon:'<',name:'<img src=x>',desc:'A & B'}]),{escapeHtml});
  assert.match(html,/&lt;img src=x&gt;/);assert.match(html,/A &amp; B/);assert.doesNotMatch(html,/<img src=x>/);
});
