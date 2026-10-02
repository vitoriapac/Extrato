const labels={insufficient_data:'Dados insuficientes',on_track:'No caminho',attention:'Atenção',at_risk:'Em risco'};
const confidenceLabels={insufficient:'Insuficiente',low:'Baixa',moderate:'Moderada'};
const phaseLabels={undated:'Sem data',construction:'Construção',consolidation:'Consolidação',final_stretch:'Reta final',final_review:'Revisão final'};
const pct=value=>value==null?'—':`${Math.round(value)}%`;

function renderTrajectory(model,escapeHtml){
  const points=(model.trajectory.observations||[]).slice(-12);
  if(points.length<2)return '<p class="analytics-note">A trajetória visual aparece após simulados comparáveis em datas diferentes.</p>';
  const width=640,height=190,left=42,right=18,top=16,bottom=30;
  const x=index=>left+index/(Math.max(1,points.length-1)+1)*(width-left-right);
  const y=value=>top+(100-value)/100*(height-top-bottom);
  const historical=points.map((point,index)=>`${x(index).toFixed(1)},${y(point.value).toFixed(1)}`).join(' ');
  const last=points.at(-1),lastX=x(points.length-1),forecast=model.trajectory.forecast30;
  const future=forecast.available?`<line x1="${lastX}" y1="${y(last.value)}" x2="${width-right}" y2="${y(forecast.central)}" class="achievement-trajectory__future"/>` : '';
  return `<div class="achievement-trajectory__scroll"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Histórico de simulados e tendência de 30 dias">
    <title>Trajetória de desempenho</title><desc>Resultados registrados em linha sólida, tendência calculada de 30 dias em linha tracejada e meta em linha horizontal.</desc>
    <line x1="${left}" x2="${width-right}" y1="${y(model.current.targetScore)}" y2="${y(model.current.targetScore)}" class="achievement-trajectory__target"/>
    <polyline points="${historical}" class="achievement-trajectory__observed"/>${future}
    ${points.map((point,index)=>`<circle cx="${x(index).toFixed(1)}" cy="${y(point.value).toFixed(1)}" r="3.5" class="achievement-trajectory__dot"><title>${escapeHtml(point.date)}: ${pct(point.value)}</title></circle>`).join('')}
    <text x="${left}" y="${height-7}">${escapeHtml(points[0].date)}</text><text x="${lastX}" y="${height-7}" text-anchor="middle">${escapeHtml(last.date)}</text>
    ${forecast.available?`<text x="${width-right}" y="${height-7}" text-anchor="end">30 dias</text>`:''}
  </svg></div><div class="achievement-trajectory__legend"><span>━ Histórico registrado</span><span>┄ Tendência de 30 dias</span><span>─ Meta</span></div>
  <p class="analytics-note">O trecho tracejado é uma previsão de 30 dias, não uma nota estimada para a data da prova.</p>`;
}

export function renderAchievementProjection(model,{history=[],escapeHtml}={}){
  if(!model)return '';
  const status=labels[model.status]||labels.insufficient_data;
  const confidence=confidenceLabels[model.confidence.level]||confidenceLabels.insufficient;
  const band=model.projection.calibratedSimulationBand;
  const forecast=model.trajectory.forecast30;
  const entries=[...model.drivers.map(text=>({text,type:'driver'})),...model.risks.map(text=>({text,type:'risk'}))].slice(0,4);
  const latest=history.slice(-3).reverse();
  return `<section class="performance-block achievement-projection" aria-labelledby="achievementProjectionTitle">
    <div class="achievement-projection__heading"><div><span class="section-eyebrow">TRAJETÓRIA</span><h3 id="achievementProjectionTitle">Projeção até a prova</h3></div><span class="achievement-projection__status achievement-projection__status--${model.status}">${status}</span></div>
    <p>${escapeHtml(model.summary)}</p><p class="performance-method-note">Confiança ${confidence.toLowerCase()} · ${model.exam.daysRemaining==null?'Data da prova não definida':`${model.exam.daysRemaining} dia(s) até a prova`} · fase ${phaseLabels[model.exam.phase]||phaseLabels.undated}</p>
    <div class="achievement-projection__metrics"><div><span>Meta de nota</span><strong>${pct(model.current.targetScore)}</strong></div><div><span>Simulados comparáveis</span><strong>${pct(model.current.simulationAccuracy)}</strong></div><div><span>Faixa atual</span><strong>${band?`${pct(band.low)}–${pct(band.high)}`:'—'}</strong></div><div><span>Tendência em 30 dias</span><strong>${forecast.available?pct(forecast.central):'—'}</strong></div></div>
    ${renderTrajectory(model,escapeHtml)}
    <details class="achievement-projection__details"><summary>Entender esta projeção</summary><p>${escapeHtml(model.summary)}</p><ul>${entries.map(item=>`<li class="achievement-projection__${item.type}">${escapeHtml(item.text)}</li>`).join('')||'<li>Registre mais simulados comparáveis para obter uma explicação.</li>'}</ul><p>${model.evidence.observationCount||0} simulados comparáveis · ${model.evidence.sampleSize||0} questões na amostra.</p>${model.confidence.reasons.length?`<p>${escapeHtml(model.confidence.reasons.join(' '))}</p>`:''}<p>Prontidão é um índice de preparação; não representa probabilidade de aprovação.</p></details>
    ${model.recovery?`<details class="achievement-projection__details"><summary>O que seria necessário?</summary><p>${model.recovery.state==='collect_evidence'?'Primeiro, reúna uma base comparável.':`Déficit central medido: ${model.recovery.gap} p.p. · ${model.recovery.weeksRemaining??'—'} semana(s) até a prova.`}</p><ol>${model.recovery.steps.map(step=>`<li>${escapeHtml(step)}</li>`).join('')}</ol><p class="analytics-note">Orientações para revisão do plano, sem previsão de ganho de nota ou alteração automática de horas.</p></details>`:''}
    ${latest.length?`<details class="achievement-projection__details"><summary>Projeções registradas</summary><ul>${latest.map(item=>`<li>${escapeHtml(item.date)} · ${labels[item.status]||labels.insufficient_data} · confiança ${confidenceLabels[item.confidence.level]||confidenceLabels.insufficient}</li>`).join('')}</ul></details>`:''}
  </section>`;
}
