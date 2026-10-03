import {normalizeAdherenceTarget} from '../../application/adherence/adherence-target.js';

export function renderAdherenceTargetSetting(value){
  const target=normalizeAdherenceTarget(value);
  return `<div class="meta-card">
    <div class="meta-info"><div class="meta-name">Meta de Aderência</div><div class="meta-formula">Crédito compatível ao plano semanal, somente até hoje</div></div>
    <div class="meta-inputs">${target===null?'Meta desativada':`<label>Meta: <input type="number" min="50" max="100" step="1" value="${target}" aria-label="Meta semanal de aderência" data-delegated-blur="updateMeta('aderenciaSemanal', this.value)">%</label>`}</div>
    <button type="button" class="btn ghost small" data-delegated-click="updateMeta('aderenciaSemanal', ${target===null?'80':'null'})">${target===null?'Ativar meta de aderência':'Desativar meta de aderência'}</button>
    <small class="result-goal-status">Meta pessoal opcional, de 50 a 100%. Não altera a Prontidão, a prioridade ou os fechamentos salvos.</small>
  </div>`;
}

export function renderAdherenceTarget(context,{escapeHtml}={}){
  if(!context||!context.enabled)return '';
  const actual=context.actual===null?'Sem crédito comparável':`${Math.round(context.actual)}% de crédito ao plano`;
  const result=context.state==='achieved'?'Meta atingida':context.state==='below_target'?'Meta ainda não atingida':'Registre sessões vinculadas a um plano para acompanhar esta meta.';
  return `<aside class="context-note adherence-target" aria-label="Meta pessoal de aderência"><strong>Meta pessoal de aderência: ${context.target}%</strong><p>${escapeHtml(actual)} · ${escapeHtml(result)}</p><p>Semana atual, somente até hoje. Contexto de execução; não estima ganho de nota nem altera a Prontidão ou a prioridade.</p></aside>`;
}
