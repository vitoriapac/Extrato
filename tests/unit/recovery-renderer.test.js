import test from 'node:test';
import assert from 'node:assert/strict';
import {renderRecoveryPlan,formatRecoveryMinutes} from '../../src/ui/performance/recovery-plan-renderer.js';
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
test('durações exatas não arredondam a transferência para horas decimais',()=>{
  assert.equal(formatRecoveryMinutes(22),'22 min');assert.equal(formatRecoveryMinutes(82),'1 h 22 min');assert.equal(formatRecoveryMinutes(-22),'22 min');assert.equal(formatRecoveryMinutes(0),'0 min');
});
test('prévia prioriza alterações, recolhe preservadas e mantém confirmação acessível',()=>{
  const changes=[{subjectName:'<Destino>',beforeMinutes:90,afterMinutes:112,deltaMinutes:22},{subjectName:'Origem',beforeMinutes:90,afterMinutes:68,deltaMinutes:-22},...Array.from({length:8},(_,i)=>({subjectName:`Preservada ${i}`,beforeMinutes:60,afterMinutes:60,deltaMinutes:0}))];
  const html=renderRecoveryPlan({status:'recoverable',changes,capacity:{current:660,proposed:660},totalMinutes:{current:660,proposed:660},from:{name:'Origem'},to:{name:'<Destino>'},transferMinutes:22,canApply:true,signature:'"',explanation:['1','2','3','4']},escape,escape);
  assert.match(html,/↑ Aumento de 22 min/);assert.match(html,/↓ Redução de 22 min/);assert.match(html,/&lt;Destino>/);assert.match(html,/<summary>Disciplinas preservadas \(8\)/);assert.match(html,/<summary>Mostrar mais/);assert.match(html,/Ver justificativa completa/);assert.match(html,/aria-labelledby="recoveryConfirmTitle"/);
  const confirmation=html.slice(html.indexOf('id="recoveryConfirmDialog"'));assert.doesNotMatch(confirmation,/Preservada 0/);assert.match(confirmation,/Confirmar alterações/);
});
