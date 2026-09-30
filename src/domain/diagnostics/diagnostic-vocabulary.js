// Presentation adapters only: persisted identifiers and analytical thresholds stay intact.
export const DIAGNOSTIC_VOCABULARY=Object.freeze({
  severity:Object.freeze({critical:'Crítico',important:'Importante',monitor:'Monitorar',controlled:'Sob controle',insufficient:'Dados insuficientes'}),
  evidence:Object.freeze({low:'Baixa',moderate:'Moderada',high:'Alta',unassessed:'Não avaliada'}),
  trend:Object.freeze({improving:'Melhorando',stable:'Estável',worsening:'Piorando',insufficient:'Dados insuficientes'}),
  outcome:Object.freeze({improved:'Melhora observada',stable:'Estável',worsened:'Piora observada',insufficient:'Evidência insuficiente',pending:'Em acompanhamento'})
});
export const DIAGNOSTIC_SIGNAL_LABELS=Object.freeze({
  'consolidation-risk':'Consolidação em risco','critical-gap':'Lacuna prioritária',plateau:'Possível platô',
  'priority-review':'Revisão prioritária','critical-coverage':'Cobertura insuficiente','high-priority':'Prioridade alta',
  'collect-evidence':'Coletar mais evidências',maintenance:'Manutenção','high-incidence':'Alta incidência',
  'recommendation-available':'Recomendação disponível','redistribution-source':'Redistribuição proposta','redistribution-target':'Redistribuição proposta'
});
export const diagnosticSignalLabel=kind=>DIAGNOSTIC_SIGNAL_LABELS[kind]||'Sinal complementar';
const key=value=>String(value??'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const resolve=(value,aliases,fallback)=>aliases[key(value)]||fallback;
export function normalizeSeverity(value){return resolve(value,{critical:'critical',critico:'critical',critica:'critical',high:'important',important:'important',importante:'important',medium:'monitor',moderate:'monitor',monitor:'monitor',monitorar:'monitor',low:'monitor',controlled:'controlled','sob controle':'controlled'},'insufficient')}
export function normalizeEvidenceLevel(value){return resolve(value,{high:'high',alta:'high',moderate:'moderate',medium:'moderate',moderada:'moderate',media:'moderate',low:'low',baixa:'low',insufficient:'low',insuficiente:'low','evidencia limitada':'low'},'unassessed')}
export function normalizeTrend(value){return resolve(value,{strong_up:'improving',up:'improving',improving:'improving',melhorando:'improving',strong_down:'worsening',down:'worsening',worsening:'worsening',piorando:'worsening',neutral:'stable',stable:'stable',estavel:'stable'},'insufficient')}
export function normalizeOutcome(value){return resolve(value,{positive:'improved',improved:'improved','melhora observada':'improved',neutral:'stable',stable:'stable',estavel:'stable',negative:'worsened',worsened:'worsened','piora observada':'worsened',pending:'pending','em acompanhamento':'pending'},'insufficient')}
export function diagnosticLabel(category,value){return DIAGNOSTIC_VOCABULARY[category]?.[value]||'Dados insuficientes'}
