export function renderReadinessChangeExplanation(model,{formatDate,escapeHtml}){
  const comparable=model.state==='comparable';
  const heading=comparable?'Por que a Prontidão mudou?':'Por que não há comparação da Prontidão?';
  const period=model.previous&&model.current?`<p>${escapeHtml(formatDate(model.previous.date))}: ${model.previous.score}/100 → ${escapeHtml(formatDate(model.current.date))}: ${model.current.score}/100.</p>`:'';
  const factors=model.factors.length?`<ul class="readiness-change-factors">${model.factors.map(item=>`<li><span>${item.direction==='up'?'↑':'↓'} ${escapeHtml(item.label)}</span><strong>${item.before} → ${item.after}/100</strong></li>`).join('')}</ul>`:'<p>Os fatores disponíveis permaneceram estáveis.</p>';
  return `<details class="readiness-change-explanation"><summary>${heading}${comparable?` · ${model.delta>0?'+':''}${model.delta} pontos`:''}</summary>${period}${comparable?`${factors}<p class="analytics-note">Os valores mostram a direção observada de cada fator. Não atribuímos pontos individuais quando o arredondamento do índice impede uma decomposição exata.</p>`:`<p class="analytics-note">${escapeHtml(model.reason)}</p>`}</details>`;
}
