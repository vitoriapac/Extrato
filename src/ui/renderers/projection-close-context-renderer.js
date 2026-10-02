const labels={insufficient_data:'Dados insuficientes',on_track:'No caminho',attention:'Atenção',at_risk:'Em risco'};
export function renderProjectionCloseContext(model,{escapeHtml}={}){
  if(model.state==='unavailable')return '';
  const comparison=model.state==='comparable'
    ?`<p>Registro de ${escapeHtml(model.previousDate)}: <strong>${labels[model.previous]}</strong> → agora: <strong>${labels[model.current]}</strong>.</p>${model.accuracyDelta==null?'':`<p>Precisão central dos simulados: ${model.accuracyDelta>=0?'+':''}${model.accuracyDelta} p.p. desde o registro.</p>`}`
    :`<p>Trajetória atual: <strong>${labels[model.current]}</strong>. Ainda não há uma projeção anterior comparável para esta semana.</p>`;
  return `<section class="projection-close-context" aria-label="Trajetória no fechamento"><h4>Trajetória até a prova</h4>${comparison}${model.reasons.length?`<ul>${model.reasons.map(reason=>`<li>${escapeHtml(reason)}</li>`).join('')}</ul>`:''}<p class="analytics-note">A comparação usa registros congelados do mesmo concurso e método. Não atribui mudanças às decisões desta semana.</p></section>`;
}
