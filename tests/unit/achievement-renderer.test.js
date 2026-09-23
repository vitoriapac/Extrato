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

test('renderer mostra progresso somente em conquistas bloqueadas com meta mensurável',()=>{
  const html=renderAchievementGroups(buildAchievementViewModel([
    {icon:'✍️',name:'Cem questões',desc:'Resolver 100 questões',unlocked:false,progress:{current:74,target:100,unit:'questões'}},
    {icon:'◷',name:'Dez horas',desc:'Registrar 10 horas',unlocked:true,progress:{current:10,target:10,unit:'horas'}},
    {icon:'✓',name:'Primeira sessão',desc:'Estudar uma vez',unlocked:false}
  ]),{escapeHtml});
  assert.match(html,/74 \/ 100 questões/);
  assert.match(html,/role="progressbar" aria-label="Progresso de Cem questões"/);
  assert.doesNotMatch(html,/Progresso de Dez horas/);
  assert.doesNotMatch(html,/Progresso de Primeira sessão/);
});
