import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderSectionHeader,renderEmptyState,renderMetricCard} from '../../src/ui/components/presentation.js';
import {renderDisclosure} from '../../src/ui/components/analytical-presentation.js';
import {renderDiagnosticSummary} from '../../src/ui/renderers/diagnostic-summary-renderer.js';

test('explicação compartilhada começa fechada e evidência do diagnóstico permanece visível',()=>{
  const detail=renderDisclosure({title:'Entenda <resultado>',contentHTML:'<p>Dados fornecidos</p>'});
  assert.match(detail,/Entenda &lt;resultado&gt;/);
  assert.doesNotMatch(detail,/<details[^>]* open/);
  const primary={metrics:{retention:54},reasons:['Retenção baixa']};
  const html=renderDiagnosticSummary({primarySignal:'consolidation-risk',evidence:{label:'Baixa'},signals:[]},primary,{escapeHtml:String});
  assert.ok(html.indexOf('Evidência: Baixa')<html.indexOf('<details'));
  assert.match(html,/class="diagnostic-detail__body"/);
  assert.match(html,/54\/100/);
});

test('componentes compartilhados escapam conteúdo e mantêm hierarquia semântica',()=>{
  const heading=renderSectionHeader({title:'<Prova>',description:'A & B',level:4,eyebrow:'Análise'});
  assert.match(heading,/<h4 class="module-heading__title">&lt;Prova&gt;<\/h4>/);
  assert.match(heading,/A &amp; B/);
  assert.doesNotMatch(heading,/<Prova>/);
  const empty=renderEmptyState({title:'Sem questões',message:'Registre <10> questões'});
  assert.match(empty,/role="status"/);
  assert.match(empty,/Registre &lt;10&gt; questões/);
  assert.match(renderMetricCard({label:'Precisão',value:'76%',detail:'30 questões'}),/class="performance-kpi ui-metric"/);
});

test('tokens de superfícies e variantes de card existem para os dois temas',()=>{
  const tokens=readFileSync(new URL('../../styles/tokens.css',import.meta.url),'utf8');
  const css=readFileSync(new URL('../../styles/app.css',import.meta.url),'utf8');
  for(const name of ['surface-page','surface-card','surface-subtle','surface-highlight','surface-primary','text-on-primary','border-default','border-emphasis','accent-primary','accent-warning','space-12','space-16'])assert.match(tokens,new RegExp(`--${name}:`));
  for(const variant of ['default','insight','attention','primary'])assert.match(css,new RegExp(`\\.card--${variant}\\{`));
  assert.match(tokens,/\[data-theme="dark"\]/);
});
