import {buildProjectionRequirements} from '../../application/projection/build-projection-requirements.js';

const labels={insufficient_data:'Dados insuficientes',on_track:'No caminho',attention:'Atenção',at_risk:'Em risco'};
const confidenceLabels={insufficient:'Insuficiente',low:'Baixa',moderate:'Moderada'};
const phaseLabels={undated:'Sem data',construction:'Construção',consolidation:'Consolidação',final_stretch:'Reta final',final_review:'Revisão final'};
const recoveryLabels={not_needed:'Não necessária',recoverable:'Prévia disponível',limited:'Opções limitadas',unavailable:'Sem proposta segura'};
const pct=value=>value==null?'—':`${Math.round(value)}%`;
const hours=minutes=>`${Math.round((minutes||0)/60*10)/10} h`;

function renderRecoveryPlan(recoveryPlan,escapeHtml,escapeAttr){
  if(!recoveryPlan||recoveryPlan.status==='not_needed')return '';
  const explanation=(recoveryPlan.explanation||[]).map(item=>`<li>${escapeHtml(item)}</li>`).join('');
  if(recoveryPlan.status!=='recoverable')return `<section class="projection-recovery" aria-label="Plano de recuperação"><h4>O que você pode fazer?</h4><p>${recoveryLabels[recoveryPlan.status]||recoveryLabels.unavailable}. ${escapeHtml(recoveryPlan.reason||'Ainda não há base suficiente para uma redistribuição segura.')}</p></section>`;
  const rows=recoveryPlan.changes.map(item=>`<tr><th scope="row">${escapeHtml(item.subjectName)}</th><td>${hours(item.beforeMinutes)}</td><td>${hours(item.afterMinutes)}</td><td>${item.deltaMinutes>0?'+':''}${hours(item.deltaMinutes)} <span class="sr-only">${item.deltaMinutes>0?'aumento':item.deltaMinutes<0?'redução':'sem alteração'}</span></td></tr>`).join('');
  const from=recoveryPlan.from?.name||'Disciplina';
  const to=recoveryPlan.to?.name||'Disciplina';
  const confirmationRows=recoveryPlan.changes.map(item=>`<li>${escapeHtml(item.subjectName)}: ${hours(item.beforeMinutes)} → ${hours(item.afterMinutes)} (${item.deltaMinutes>0?'+':''}${hours(item.deltaMinutes)})</li>`).join('');
  const applyAction=recoveryPlan.canApply?`<button type="button" class="btn primary" data-recovery-confirm-open data-recovery-signature="${escapeAttr(recoveryPlan.signature)}">Aplicar ao planejamento</button><dialog id="recoveryConfirmDialog" class="projection-scenario" aria-labelledby="recoveryConfirmTitle"><form method="dialog"><div class="projection-scenario__heading"><h3 id="recoveryConfirmTitle">Aplicar plano de recuperação?</h3><button type="submit" class="btn ghost small" aria-label="Cancelar aplicação">Cancelar</button></div></form><p>Capacidade semanal ${hours(recoveryPlan.capacity.current)} → ${hours(recoveryPlan.capacity.proposed)}. Carga planejada ${hours(recoveryPlan.totalMinutes.current)} → ${hours(recoveryPlan.totalMinutes.proposed)}.</p><ul>${confirmationRows}</ul><p>Nenhuma sessão concluída será alterada. O plano anterior e o histórico serão preservados.</p><div class="projection-scenario__heading"><button type="button" class="btn ghost" data-recovery-cancel>Voltar</button><button type="button" class="btn primary" data-recovery-apply data-recovery-signature="${escapeAttr(recoveryPlan.signature)}">Confirmar alterações</button></div></dialog>`:'';
  return `<section class="projection-recovery" aria-label="Plano de recuperação"><h4>O que você pode fazer?</h4><p>Há uma proposta de redistribuição sem aumentar sua carga semanal.</p><button type="button" class="btn ghost small" data-recovery-preview-open>Ver plano de recuperação</button><dialog id="recoveryPreviewDialog" class="projection-scenario" aria-labelledby="recoveryPreviewTitle"><form method="dialog"><div class="projection-scenario__heading"><h3 id="recoveryPreviewTitle">Plano de recuperação</h3><button type="submit" class="btn ghost small" aria-label="Fechar prévia de recuperação">Fechar</button></div></form><p>A trajetória está em ${labels[recoveryPlan.basis?.trajectoryStatus]||'atenção'}. A capacidade semanal será preservada em ${hours(recoveryPlan.capacity.current)}.</p><div class="performance-table-scroll" tabindex="0" role="region" aria-label="Comparação do plano atual e da proposta"><table><thead><tr><th scope="col">Disciplina</th><th scope="col">Atual</th><th scope="col">Proposta</th><th scope="col">Variação</th></tr></thead><tbody>${rows}<tr><th scope="row">Total planejado</th><td>${hours(recoveryPlan.totalMinutes.current)}</td><td>${hours(recoveryPlan.totalMinutes.proposed)}</td><td>Sem alteração</td></tr></tbody></table></div><p><strong>${escapeHtml(to)} recebe ${hours(recoveryPlan.transferMinutes)}.</strong> A origem é ${escapeHtml(from)}.</p>${explanation?`<h4>Por que esta mudança?</h4><ul>${explanation}</ul>`:''}<p class="analytics-note">A prévia não alterou o plano nem o histórico.</p>${applyAction}</dialog></section>`;
}

function renderRecoveryScenarioComparison(recovery,currentScenario,simulatedScenario,escapeHtml){
  if(!recovery)return '';
  const currentPlanPanel=scenario=>`<div><h4>Plano atual</h4><p>Trajetória: ${labels[scenario?.status]||labels.insufficient_data}</p><p>Capacidade semanal: ${hours(scenario?.weeklyCapacityMinutes??0)}</p><p>Carga planejada: ${hours(scenario?.planFit?.plannedMinutes??0)}</p><p>${scenario?.planFit?.shortfallMinutes>0?`Faltam ${hours(scenario.planFit.shortfallMinutes)} para acomodar a carga.`:`A carga cabe; sobram ${hours(scenario?.planFit?.remainingMinutes??0)}.`}</p></div>`;
  const recoveryPlanPanel=(scenario,item)=>{
    if(!item)return `<div><h4>Plano de recuperação</h4><p>Prévia indisponível.</p></div>`;
    const transfer=item.status==='recoverable'?`${escapeHtml(item.from?.name||'Origem')} → ${escapeHtml(item.to?.name||'Destino')} · ${hours(item.transferMinutes)}`:escapeHtml(item.reason||recoveryLabels[item.status]||'Sem transferência segura.');
    return `<div><h4>Plano de recuperação</h4><p>${recoveryLabels[item.status]||recoveryLabels.unavailable}</p><p>${transfer}</p><p>Capacidade ${hours(item.capacity?.current??scenario?.weeklyCapacityMinutes??0)} → ${hours(item.capacity?.proposed??item.capacity?.current??scenario?.weeklyCapacityMinutes??0)} · carga ${hours(item.totalMinutes?.current??0)} → ${hours(item.totalMinutes?.proposed??item.totalMinutes?.current??0)}</p></div>`;
  };
  const alternative=(title,item)=>`<div><h4>${title}</h4><p>${recoveryLabels[item?.status]||recoveryLabels.unavailable}</p><p>${item?.status==='recoverable'?`${escapeHtml(item.from?.name||'Origem')} → ${escapeHtml(item.to?.name||'Destino')} · ${hours(item.transferMinutes)}`:escapeHtml(item?.reason||'Sem transferência segura.')}</p></div>`;
  return `<section class="projection-recovery-comparison"><h4>Plano atual vs. plano de recuperação</h4><p>A simulação não prevê melhora de nota pela mudança de carga. Ela compara o encaixe e a redistribuição permitida pelas regras atuais.</p><div class="projection-scenario__comparison">${currentPlanPanel(currentScenario)}${recoveryPlanPanel(currentScenario,recovery.current)}</div><h4>Como meta e prazo alteram a proposta</h4><div class="projection-scenario__comparison">${alternative('Condições atuais',recovery.current)}${alternative('Condições simuladas',recovery.simulated)}</div></section>`;
}

function renderTrajectory(model,escapeHtml){
  const points=(model.trajectory.observations||[]).slice(-12);
  if(points.length<2)return '<p class="analytics-note">A trajetória visual aparece após simulados comparáveis em datas diferentes.</p>';
  const width=640,height=190,left=42,right=18,top=16,bottom=30;
  const x=index=>left+index/(Math.max(1,points.length-1)+1)*(width-left-right);
  const y=value=>top+(100-value)/100*(height-top-bottom);
  const historical=points.map((point,index)=>`${x(index).toFixed(1)},${y(point.value).toFixed(1)}`).join(' ');
  const last=points.at(-1),lastX=x(points.length-1),forecast=model.trajectory.forecast30;
  const future=forecast.available?`<line x1="${lastX}" y1="${y(last.value)}" x2="${width-right}" y2="${y(forecast.central)}" class="achievement-trajectory__future" tabindex="0" aria-label="Tendência de 30 dias: ${pct(forecast.central)}. Não representa nota prevista na prova."><title>Tendência de 30 dias: ${pct(forecast.central)}. Não representa nota prevista na prova.</title></line>` : '';
  const values=points.map(point=>`<tr><th scope="row"><time datetime="${escapeHtml(point.date)}">${escapeHtml(point.date)}</time></th><td>${pct(point.value)}</td><td>${pct(model.current.targetScore)}</td></tr>`).join('');
  return `<div class="achievement-trajectory__scroll" tabindex="0" role="region" aria-label="Gráfico da trajetória de simulados"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Histórico de simulados e tendência de 30 dias">
    <title>Trajetória de desempenho</title><desc>Resultados registrados em linha sólida, tendência calculada de 30 dias em linha tracejada e meta em linha horizontal. Valores disponíveis abaixo.</desc>
    <line x1="${left}" x2="${width-right}" y1="${y(model.current.targetScore)}" y2="${y(model.current.targetScore)}" class="achievement-trajectory__target"/>
    <polyline points="${historical}" class="achievement-trajectory__observed"/>${future}
    ${points.map((point,index)=>`<circle cx="${x(index).toFixed(1)}" cy="${y(point.value).toFixed(1)}" r="3.5" class="achievement-trajectory__dot" tabindex="0" aria-label="${escapeHtml(point.date)}: simulado ${pct(point.value)}, meta ${pct(model.current.targetScore)}"><title>${escapeHtml(point.date)}: simulado ${pct(point.value)}, meta ${pct(model.current.targetScore)}</title></circle>`).join('')}
    <text x="${left}" y="${height-7}">${escapeHtml(points[0].date)}</text><text x="${lastX}" y="${height-7}" text-anchor="middle">${escapeHtml(last.date)}</text>
    ${forecast.available?`<text x="${width-right}" y="${height-7}" text-anchor="end">30 dias</text>`:''}
  </svg></div><div class="achievement-trajectory__legend"><span>━ Histórico registrado</span><span>┄ Tendência de 30 dias</span><span>─ Meta</span></div>
  <p class="analytics-note">O trecho tracejado é uma previsão de 30 dias, não uma nota estimada para a data da prova.</p>
  <details class="achievement-projection__details"><summary>Ver valores do gráfico</summary><div class="performance-table-scroll" tabindex="0"><table><thead><tr><th scope="col">Data</th><th scope="col">Simulado</th><th scope="col">Meta</th></tr></thead><tbody>${values}</tbody></table></div></details>`;
}

function renderRequirements(model,escapeHtml){
  const {requirements,pending}=buildProjectionRequirements(model);
  return `<div class="achievement-projection__requirements" role="status"><strong>Projeção ainda indisponível</strong><p>Precisamos de mais evidências comparáveis.</p><ul>${requirements.map(item=>`<li>${item.met?'✓':'○'} ${escapeHtml(item.label)}</li>`).join('')}</ul>${pending.length?`<p>${escapeHtml(pending[0].guidance)}</p>`:''}<button type="button" class="btn ghost small" ${pending[0]?.label==='Data da prova'?'data-performance-open="metas"':'data-performance-section="simulations"'}>${pending[0]?.label==='Data da prova'?'Configurar prova':'Registrar simulado'}</button></div>`;
}

function renderHistory(history,escapeHtml){
  if(!history.length)return '';
  const ordered=[...history].reverse(),rows=items=>items.map(item=>`<li><time datetime="${escapeHtml(item.date)}">${escapeHtml(item.date)}</time> · ${labels[item.status]||labels.insufficient_data} · confiança ${confidenceLabels[item.confidence?.level]||confidenceLabels.insufficient}</li>`).join('');
  const transitions=[...history].map(item=>labels[item.status]||labels.insufficient_data).filter((label,index,list)=>index===0||label!==list[index-1]);
  return `<details class="achievement-projection__details"><summary>Histórico da trajetória</summary>${transitions.length>1?`<p>Estados registrados: ${escapeHtml(transitions.join(' → '))}. A sequência não indica causalidade.</p>`:''}<ul>${rows(ordered.slice(0,5))}</ul>${ordered.length>5?`<details class="achievement-projection__details"><summary>Mostrar mais</summary><ul>${rows(ordered.slice(5))}</ul></details>`:''}</details>`;
}

export function renderProjectionScenarioResult(result,{escapeHtml}={}){
  if(result?.state!=='ready')return `<p role="alert">${escapeHtml(result?.reason||'Não foi possível calcular este cenário.')}</p>`;
  const fit=value=>value==null?'Sem plano semanal para comparar':value.shortfallMinutes>0?`Faltam ${hours(value.shortfallMinutes)} para a carga atual`:`A carga atual cabe; sobram ${hours(value.remainingMinutes)}`;
  const column=(title,value)=>`<div><h4>${title}</h4><dl><dt>Trajetória</dt><dd>${labels[value.status]||labels.insufficient_data}</dd><dt>Meta</dt><dd>${pct(value.targetScore)}</dd><dt>Prazo</dt><dd>${value.daysRemaining} dia(s)</dd><dt>Capacidade semanal</dt><dd>${hours(value.weeklyCapacityMinutes)}</dd><dt>Plano</dt><dd>${fit(value.planFit)}</dd></dl></div>`;
  return `<section aria-label="Resultado da simulação"><strong>Resultado simulado</strong><div class="projection-scenario__comparison">${column('Atual',result.current)}${column('Simulação',result.simulated)}</div><p class="analytics-note">${escapeHtml(result.note)} Nenhum dado real foi alterado.</p>${renderRecoveryScenarioComparison(result.recovery,result.current,result.simulated,escapeHtml)}</section>`;
}

export function renderAchievementProjection(model,{history=[],escapeHtml,escapeAttr=escapeHtml,weeklyCapacityMinutes=0,recoveryPlan=null}={}){
  if(!model)return '';
  const status=labels[model.status]||labels.insufficient_data;
  const confidence=confidenceLabels[model.confidence.level]||confidenceLabels.insufficient;
  const band=model.projection.calibratedSimulationBand;
  const forecast=model.trajectory.forecast30;
  const entries=[...model.drivers.map(text=>({text,type:'driver'})),...model.risks.map(text=>({text,type:'risk'}))].slice(0,4);
  const context=model.exam.daysRemaining==null?'Data da prova não definida':`${model.exam.daysRemaining} dia(s) até a prova`;
  return `<section class="performance-block achievement-projection" aria-labelledby="achievementProjectionTitle">
    <div class="achievement-projection__heading"><div><span class="section-eyebrow">TRAJETÓRIA</span><h3 id="achievementProjectionTitle">Projeção até a prova</h3></div><span class="achievement-projection__status achievement-projection__status--${model.status}">${status}</span></div>
    <p>${escapeHtml(model.summary)}</p><p class="performance-method-note">Confiança ${confidence.toLowerCase()} · ${context} · fase ${phaseLabels[model.exam.phase]||phaseLabels.undated}</p>
    <div class="achievement-projection__metrics"><div><span>Meta de nota</span><strong>${pct(model.current.targetScore)}</strong></div><div><span>Simulados comparáveis</span><strong>${pct(model.current.simulationAccuracy)}</strong></div><div><span>Faixa atual</span><strong>${band?`${pct(band.low)}–${pct(band.high)}`:'—'}</strong></div><div><span>Tendência em 30 dias</span><strong>${forecast.available?pct(forecast.central):'—'}</strong></div></div>
    ${model.status==='insufficient_data'?renderRequirements(model,escapeHtml):renderTrajectory(model,escapeHtml)}
    <div class="achievement-projection__story"><div><strong>Resultado</strong><p>${status}</p></div><div><strong>Evidência</strong><p>${escapeHtml(model.risks[0]||model.drivers[0]||model.confidence.reasons[0]||model.summary)}</p></div><div><strong>Contexto</strong><p>${context}</p></div><div><strong>Ação</strong><p>${escapeHtml(model.recovery?.steps?.[0]||'Continue registrando simulados comparáveis.')}</p></div></div>
    <details class="achievement-projection__details"><summary>Entender esta projeção</summary><p>${escapeHtml(model.summary)}</p><ul>${entries.map(item=>`<li class="achievement-projection__${item.type}">${escapeHtml(item.text)}</li>`).join('')||'<li>Registre mais simulados comparáveis para obter uma explicação.</li>'}</ul><p>${model.evidence.observationCount||0} simulados comparáveis · ${model.evidence.sampleSize||0} questões na amostra.</p>${model.confidence.reasons.length?`<p>${escapeHtml(model.confidence.reasons.join(' '))}</p>`:''}<p>Prontidão é um índice de preparação; não representa probabilidade de aprovação.</p></details>
    ${model.recovery?`<details class="achievement-projection__details"><summary>O que seria necessário?</summary><p>${model.recovery.state==='collect_evidence'?'Primeiro, reúna uma base comparável.':`Déficit central medido: ${model.recovery.gap} p.p. · ${model.recovery.weeksRemaining??'—'} semana(s) até a prova.`}</p><ol>${model.recovery.steps.map(step=>`<li>${escapeHtml(step)}</li>`).join('')}</ol><p class="analytics-note">Orientações para revisão do plano, sem previsão de ganho de nota ou alteração automática de horas.</p></details>`:''}
    ${['attention','at_risk'].includes(model.status)?renderRecoveryPlan(recoveryPlan,escapeHtml,escapeAttr):''}
    ${renderHistory(history,escapeHtml)}
    <button type="button" class="btn ghost small" data-projection-scenario-open>Simular cenário</button>
    <dialog id="projectionScenarioDialog" class="projection-scenario" aria-labelledby="projectionScenarioTitle"><form method="dialog"><div class="projection-scenario__heading"><h3 id="projectionScenarioTitle">Simular cenário</h3><button type="submit" class="btn ghost small" aria-label="Fechar simulação">Fechar</button></div></form><p>Explore como meta, prazo e capacidade mudam a leitura e o encaixe do plano atual. Esta simulação não salva dados.</p>
      <form data-projection-scenario-form><label>Capacidade semanal (horas)<input type="number" name="capacityHours" min="0" max="168" step="0.5" required value="${Math.round(weeklyCapacityMinutes/60*10)/10}"></label><label>Data da prova<input type="date" name="examDate" required value="${model.exam.date||''}"></label><label>Meta de nota (%)<input type="number" name="targetScore" min="1" max="100" step="1" required value="${model.current.targetScore}"></label><button type="submit" class="btn primary">Executar simulação</button></form><div id="projectionScenarioResult" aria-live="polite"></div></dialog>
  </section>`;
}
