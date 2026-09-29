import {createConsolidatedSignal,signalNumber} from '../../domain/diagnostics/consolidated-signal.js';
import {captureTopicPriorityProfile,classifyTopicPriority} from '../../domain/recommendations/topic-priority-profile.js';
import {buildOpportunityCost} from '../../domain/planning/opportunity-cost.js';

const rows=value=>Array.isArray(value)?value:value?.items||value?.rows||[];
const identity=item=>JSON.stringify([item.subjectId,item.topicId||null]);
const strength=item=>signalNumber(item?.evidenceStrength??item?.evidence?.evidenceStrength);
const scope=(item,context)=>item.activeExamTags??(context.inputsAlreadyScoped?context.activeExamTags:null);

export function adaptDiagnosticSignals(input={}){
  const {priorities=[],activeExamTags=[],inputsAlreadyScoped=false}=input,signals=[];
  const context={activeExamTags,inputsAlreadyScoped},candidates=new Map(priorities.map(item=>[identity(item),item]));
  const add=(item,source,kind,extra={})=>{
    if(item.archived||item.topicArchived||item.subjectArchived)return;
    const candidate=candidates.get(identity(item)),knownStrength=strength(item)??strength(candidate);
    const signal=createConsolidatedSignal({id:item.id||`${source}:${identity(item)}:${kind}`,source,sourceId:item.id,subjectId:item.subjectId,topicId:item.topicId||null,
      granularity:item.granularity,kind,active:true,availability:item.availability||'available',severity:'monitor',
      name:item.topicName||item.name||item.subjectName,activeExamTags:scope(item,context),period:item.period,
      priority:signalNumber(candidate?.score??candidate?.priority),
      evidence:{strength:knownStrength,completeness:signalNumber(item.evidence?.completeness),observationIds:item.observationIds,sources:[source]},
      reasons:[item.reason,item.message,...(item.reasons||[])].filter(Boolean),...extra});
    if(signal)signals.push(signal);
  };
  for(const item of rows(input.gapSignals)){
    // The gap engine's confidence is field completeness, not evidence strength.
    const evidence={strength:strength(item)??strength(candidates.get(identity(item))),completeness:signalNumber(item.confidence),observationIds:item.observationIds,sources:['gap-map']};
    const metrics={mastery:signalNumber(item.mastery),impact:signalNumber(item.examImpact),coverage:signalNumber(item.coverage)};
    if(item.severity==='critical'&&metrics.mastery!=null&&metrics.mastery<50&&metrics.impact>=70)add(item,'gap-map','critical-gap',{severity:'critical',evidence,metrics});
    if(['critical','high'].includes(item.severity)&&metrics.coverage!=null&&metrics.coverage<50&&metrics.impact>=70)add(item,'gap-map','critical-coverage',{severity:'important',evidence,metrics});
  }
  for(const item of rows(input.preparationSignals)){
    if(item.type==='consolidation')add(item,'preparation-signals','consolidation-risk',{severity:'important',evidence:{strength:signalNumber(item.confidence),completeness:null,observationIds:item.observationIds,sources:['questions','retention','mastery']},metrics:{mastery:item.mastery,retention:item.retention,accuracy:item.accuracy,target:item.target,questionCount:item.questionCount}});
    if(item.type==='plateau')add(item,'preparation-signals','plateau',{severity:'important',evidence:{strength:null,completeness:null,observationIds:item.observationIds,sources:['questions','sessions']},metrics:{questionCount:item.questionCount,minutes:item.minutes,target:item.target}});
  }
  for(const item of priorities){
    const confidence=strength(item),classification=classifyTopicPriority(captureTopicPriorityProfile(item));
    if(confidence!=null&&confidence>=.35&&['Crítica','Alta'].includes(classification))add(item,'priority-engine','high-priority',{severity:classification==='Crítica'?'critical':'important'});
    if(confidence==null||confidence<.35)add(item,'priority-engine','collect-evidence',{severity:'insufficient',reasons:['A evidência pessoal ainda é limitada ou não foi avaliada.']});
    else if(classification==='Manutenção')add(item,'priority-engine','maintenance',{severity:'controlled'});
  }
  for(const item of rows(input.reviewSignals)){
    if(signalNumber(item.reviewUrgency)>=70&&signalNumber(item.examImpact)>=70)add(item,'review-signals','priority-review',{severity:'important',metrics:{urgency:item.reviewUrgency,impact:item.examImpact}});
  }
  for(const item of rows(input.examIntelligence)){
    if(signalNumber(item.presencePercent)>=70)add(item,'exam-intelligence','high-incidence',{evidence:{strength:null,level:item.confidenceLabel??item.confidence,completeness:null,observationIds:item.examIds,sources:['historical-exams']},metrics:{presencePercent:item.presencePercent,analyzedExamCount:item.analyzedExamCount}});
  }
  for(const item of rows(input.opportunityCosts)){
    if(item.applied)continue;
    const cost=buildOpportunityCost(item.state?item:{state:'proposal',transferMinutes:item.minutes,weeklyBudgetMinutes:item.budget,from:item.from,to:item.to});
    if(!cost)continue;
    for(const role of ['from','to'])add({...cost[role],topicId:null,granularity:'subject',id:`${item.id||'redistribution'}:${role}`,activeExamTags:item.activeExamTags},'opportunity-cost',role==='from'?'redistribution-source':'redistribution-target',{
      metrics:{role,minutes:cost.minutes,budget:cost.budget,beforeMinutes:cost[role].beforeMinutes,afterMinutes:cost[role].afterMinutes},reasons:[cost.limitation]});
  }
  return signals;
}
