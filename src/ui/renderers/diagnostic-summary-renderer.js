import {diagnosticSignalLabel} from '../../domain/diagnostics/diagnostic-vocabulary.js';
import {renderDisclosure} from '../components/analytical-presentation.js';

const metrics={mastery:['Domínio','/100'],retention:['Retenção','/100'],accuracy:['Precisão','%'],target:['Meta','%'],impact:['Impacto','/100'],coverage:['Cobertura','%'],questionCount:['Questões',''],urgency:['Urgência da revisão','/100'],presencePercent:['Incidência','%']};
const measurements=signal=>Object.entries(signal?.metrics||{}).filter(([key,value])=>metrics[key]&&(typeof value==='number'||typeof value==='string'&&value.trim()!=='')&&Number.isFinite(Number(value)));
const renderMeasurements=(rows,escapeHtml)=>rows.length?`<dl class="diagnostic-evidence">${rows.map(([key,value])=>`<div><dt>${metrics[key][0]}</dt><dd>${escapeHtml(value)}${metrics[key][1]}</dd></div>`).join('')}</dl>`:'';

export function renderDiagnosticSummary(item,primary,{escapeHtml}){
  const reason=primary?.reasons?.[0];
  const primaryMeasurements=measurements(primary);
  const supporting=(item.signals||[]).filter(signal=>signal!==primary&&signal.active&&signal.kind!=='recommendation-available').filter((signal,index,rows)=>rows.findIndex(other=>other.kind===signal.kind)===index);
  const renderSupporting=rows=>`<ul>${rows.map(signal=>`<li><strong>${escapeHtml(diagnosticSignalLabel(signal.kind))}</strong>${signal.reasons?.[0]?` · ${escapeHtml(signal.reasons[0])}`:''}${renderMeasurements(measurements(signal),escapeHtml)}</li>`).join('')}</ul>`;
  const period=primary?.period?.start&&primary?.period?.end?`${primary.period.start} a ${primary.period.end}`:null;
  return `<p class="diagnostic-primary-reason"><strong>${escapeHtml(diagnosticSignalLabel(item.primarySignal))}</strong>${reason?` · ${escapeHtml(reason)}`:''}</p>
    <p class="diagnostic-quality">Evidência: ${escapeHtml(item.evidence?.label||'Não avaliada')}</p>
    ${renderDisclosure({title:'Ver evidências',className:'diagnostic-detail',bodyClassName:'diagnostic-detail__body',contentHTML:`
      ${primaryMeasurements.length?renderMeasurements(primaryMeasurements,escapeHtml):'<p class="analytics-note">Ainda não há medidas detalhadas para o sinal principal.</p>'}
      ${supporting.length?`<div class="diagnostic-supporting"><strong>Também observado</strong>${renderSupporting(supporting.slice(0,5))}${supporting.length>5?`<details class="diagnostic-detail__more"><summary>Mostrar mais sinais · +${supporting.length-5}</summary>${renderSupporting(supporting.slice(5))}</details>`:''}</div>`:''}
      <details class="diagnostic-detail__method"><summary>Ver metodologia</summary><p>${escapeHtml(item.limitation||'O diagnóstico usa os registros disponíveis no concurso ativo.')}</p>${period?`<p>Período observado: ${escapeHtml(period)}.</p>`:''}</details>
    `})}`;
}
