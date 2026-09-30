import {createConsolidatedSignal,signalEntityKey,signalNumber} from '../../domain/diagnostics/consolidated-signal.js';
import {diagnosticLabel} from '../../domain/diagnostics/diagnostic-vocabulary.js';
import {selectPrimarySignal,SIGNAL_PRECEDENCE_VERSION,compareSignalIds} from '../../domain/diagnostics/signal-precedence.js';
import {canStudy} from '../../domain/study-eligibility.js';
import {adaptDiagnosticSignals} from './adapt-diagnostic-signals.js';

const tags=value=>[...new Set((Array.isArray(value)?value:[]).filter(item=>typeof item==='string'))].sort();
const scopeKey=value=>JSON.stringify(tags(value));
const identity=item=>signalEntityKey({subjectId:item.subjectId,topicId:item.topicId||null,granularity:item.granularity||(item.topicId?'topic':'subject')});
const archived=item=>item.archived||item.topicArchived||item.subjectArchived;
const distinct=value=>[...new Set(value.filter(Boolean))];
const stable=(left,right)=>compareSignalIds(left.entityKey,right.entityKey);

// eligibleEntities is the caller's current, verified content scope (including archived flags).
// Unknown legacy subject aggregates cannot be inferred from a topic's membership.
export function buildConsolidatedSignals(input={}){
  const {eligibleEntities=[],activeExamTags=[],inputsAlreadyScoped=false,recommendations=[]}=input;
  const active=tags(activeExamTags),entities=new Map();
  for(const entity of eligibleEntities){
    if(!entity.subjectId||archived(entity)||entity.examTags?.length&&active.length&&!entity.examTags.some(tag=>active.includes(tag)))continue;
    const key=identity(entity);if(!entities.has(key))entities.set(key,entity);
  }
  const inScope=signal=>entities.has(signal.entityKey)&&(signal.activeExamTags==null
    ?active.length===0||signal.granularity==='topic'||inputsAlreadyScoped
    :scopeKey(signal.activeExamTags)===scopeKey(active));
  const normalized=[...adaptDiagnosticSignals(input),...(input.signals||[]).map(createConsolidatedSignal).filter(Boolean)];
  const groups=new Map(),seen=new Set();
  for(const signal of normalized){
    const id=JSON.stringify([signal.entityKey,signal.source,signal.sourceId,signal.kind,signal.period.start,signal.period.end]);
    if(!inScope(signal)||seen.has(id))continue;
    seen.add(id);const group=groups.get(signal.entityKey)||[];group.push(signal);groups.set(signal.entityKey,group);
  }
  const actions=new Map();
  for(const item of recommendations){
    const id=item.recommendationId||item.id,key=identity(item);
    if(!id||!entities.has(key)||archived(item)||!canStudy(item)||item.available===false||item.eligible===false||item.canStudy===false||item.status&&item.status!=='pending'||signalNumber(item.estimatedMinutes)==null||item.estimatedMinutes<=0)continue;
    if(Array.isArray(item.activeExamTags)&&scopeKey(item.activeExamTags)!==scopeKey(active))continue;
    // The producer's order is authoritative; no alternative action or ranking is invented.
    if(!actions.has(key)){
      actions.set(key,id);
      const signal=createConsolidatedSignal({id:String(id),source:'recommendations',sourceId:String(id),subjectId:item.subjectId,topicId:item.topicId,kind:'recommendation-available',active:true,availability:'available',severity:'monitor',activeExamTags:active,evidence:{strength:item.evidence?.evidenceStrength??item.evidenceStrength,sources:['recommendations']}});
      if(signal){const group=groups.get(key)||[];group.push(signal);groups.set(key,group)}
    }
  }
  const rows=[];
  for(const [key,entity] of entities){
    const signals=(groups.get(key)||[]).sort((a,b)=>compareSignalIds(a.source,b.source)||compareSignalIds(a.sourceId,b.sourceId)||compareSignalIds(a.kind,b.kind)||compareSignalIds(b.period.end||'',a.period.end||'')||compareSignalIds(b.period.start||'',a.period.start||''));
    const primary=selectPrimarySignal(signals),supporting=signals.filter(signal=>signal!==primary&&signal.active);
    const priority=(input.priorities||[]).find(item=>identity(item)===key);
    const evidence=primary?.evidence||{strength:null,completeness:null,level:'unassessed',label:'Não avaliada',assessed:false,observationIds:[],sources:[]};
    const state=primary?.kind==='maintenance'?'controlled':primary?.kind==='collect-evidence'?'insufficient':primary?'attention':'unassessed';
    rows.push({entityKey:key,subjectId:entity.subjectId,topicId:entity.topicId||null,granularity:entity.granularity||(entity.topicId?'topic':'subject'),
      name:entity.topicName||entity.name||entity.subjectName||null,subjectName:entity.subjectName||null,activeExamTags:[...active],state,
      severity:primary?.severity||'insufficient',severityLabel:diagnosticLabel('severity',primary?.severity||'insufficient'),
      primarySignal:primary?.kind||null,primarySource:primary?{source:primary.source,id:primary.sourceId,period:primary.period}:null,
      supportingSignals:distinct(supporting.map(signal=>signal.kind)),signals:structuredClone(signals),
      evidenceQuality:evidence.level,evidence:structuredClone(evidence),priority:signalNumber(priority?.score??priority?.priority),
      recommendedActionId:actions.get(key)||null,reasons:distinct([...(primary?.reasons||[]),...supporting.flatMap(signal=>signal.reasons)]),
      sources:signals.map(signal=>({source:signal.source,id:signal.sourceId,kind:signal.kind,period:signal.period})),
      limitation:'Sinais podem compartilhar observações. Suas confianças e volumes não são somados; ausência de alerta não confirma consolidação.'});
  }
  rows.sort((a,b)=>(b.priority??-Infinity)-(a.priority??-Infinity)||stable(a,b));
  const summarize=items=>({total:items.length,attention:items.filter(item=>item.state==='attention').length,critical:items.filter(item=>item.state==='attention'&&item.severity==='critical').length,controlled:items.filter(item=>item.state==='controlled').length,insufficient:items.filter(item=>['insufficient','unassessed'].includes(item.state)).length});
  const topics=rows.filter(item=>item.granularity==='topic'),subjects=rows.filter(item=>item.granularity==='subject');
  return {version:SIGNAL_PRECEDENCE_VERSION,state:rows.length?'available':'insufficient',activeExamTags:[...active],rows,topics,subjects,summary:{topics:summarize(topics),subjects:summarize(subjects)}};
}
