import {formatStudyMinutes as minutes} from '../format-study-time.js';
const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
// Apresenta o resultado conciliado existente; não distribui crédito novamente.
export function renderExecutionBreakdown(model){
 if(!model?.summary)return '';
 const s=model.summary,p=model.period;
 const rows=model.items||[];
 const render=items=>items.map(item=>'<li>'+escape((model.subjects||[]).find(subject=>subject.subjectId===item.subjectId)?.name||'Atividade conciliada')+': '+minutes(item.creditedMinutes)+' creditados de '+minutes(item.plannedMinutes)+' planejados; '+minutes(item.executedMinutes)+' vinculados.</li>').join('');
 return '<section class="execution-breakdown" aria-label="Composição do tempo estudado"><p><strong>Tempo registrado: '+minutes(s.executedMinutes)+'</strong> · crédito ao plano: '+minutes(s.matchedMinutes)+' · pendente: '+minutes(s.remainingMinutes)+'.</p>'+
 (p?'<p>Período: '+escape(p.start)+' a '+escape(p.evaluatedEnd||p.end)+(p.complete?' · encerrado.':' · até a data avaliada.')+'</p>':'')+
 '<details><summary>Conferir a composição do tempo</summary><ul><li>Crédito compatível ao plano: '+minutes(s.matchedMinutes)+'.</li><li>Estudo sem vínculo ao plano: '+minutes(s.additionalMinutes)+'.</li><li>Excedente de atividades vinculadas: '+minutes(s.excessLinkedMinutes)+'.</li><li>Vínculo incompatível: '+minutes(s.incompatibleMinutes)+'.</li><li>Vínculo com atividade de outro período: '+minutes(s.otherPeriodMinutes)+'.</li></ul><p>Tempo registrado soma essas categorias. Pendências são tempo planejado ainda sem crédito e não entram nessa soma. O crédito é limitado ao previsto por atividade; estudar fora do plano não é perder tempo de estudo.</p>'+
 (rows.length?'<h5>Atividades conciliadas no período</h5><ul>'+render(rows.slice(0,5))+'</ul>'+(rows.length>5?'<details><summary>Mostrar mais</summary><ul>'+render(rows.slice(5))+'</ul></details>':''):'<p>Nenhuma atividade individual conciliável neste período.</p>')+'</details></section>';
}
