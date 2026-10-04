import {adherenceStatus} from './adherence-status.js';

const finite=value=>typeof value==='number'&&Number.isFinite(value);
const direction=value=>Math.abs(value)<1e-9?'stable':value>0?'up':'down';
export function buildAdherenceChangeExplanation({current,previous,mode='equal_elapsed',evaluatedDays=null}={}){
  const insufficient=(mainDriver='insufficient_data')=>({version:1,state:'insufficient_data',mainDriver,direction:'insufficient_data',changes:null,
    message:mainDriver==='coverage'?'A classificação histórica não permite comparar as prioridades com segurança.':'Ainda não há dois períodos com evidência suficiente para explicar a mudança.'});
  if(!current?.summary||!previous?.summary)return insufficient();
  const coverageChanged=current.priority?.classifiedCoverage!==previous.priority?.classifiedCoverage;
  if([current,previous].some(model=>adherenceStatus(model).status==='insufficient_data'))return insufficient(coverageChanged?'coverage':'insufficient_data');
  const changes={time:current.summary.temporalAdherence-previous.summary.temporalAdherence,
    priority:current.priority.adherence-previous.priority.adherence,
    executedMinutes:current.summary.executedMinutes-previous.summary.executedMinutes,
    plannedMinutes:current.summary.plannedMinutes-previous.summary.plannedMinutes,
    additionalMinutes:current.summary.additionalMinutes-previous.summary.additionalMinutes,
    classifiedCoverage:current.priority.classifiedCoverage-previous.priority.classifiedCoverage};
  if(!Object.values(changes).every(finite))return insufficient();
  const timeDirection=direction(changes.time),priorityDirection=direction(changes.priority);
  const mainDriver=timeDirection!=='stable'&&priorityDirection!=='stable'?'both':timeDirection!=='stable'?'time':priorityDirection!=='stable'?'priority':direction(changes.additionalMinutes)!=='stable'?'additional_study':coverageChanged?'coverage':'stable';
  const messages={both:'O crédito temporal e a execução das prioridades mudaram. São medidas distintas; suas variações não devem ser somadas.',time:'A mudança está no crédito temporal; a execução das prioridades permaneceu estável.',priority:'A mudança está na execução das prioridades; o crédito temporal permaneceu estável.',additional_study:'O estudo adicional mudou, enquanto o crédito temporal e a execução prioritária permaneceram estáveis.',coverage:'A classificação histórica mudou, enquanto as duas medidas de aderência permaneceram estáveis.',stable:'As duas medidas de aderência permaneceram estáveis.'};
  return {version:1,state:'comparable',mode,evaluatedDays,mainDriver,
    direction:timeDirection===priorityDirection?timeDirection:timeDirection==='stable'?priorityDirection:priorityDirection==='stable'?timeDirection:'mixed',
    timeDirection,priorityDirection,changes,message:messages[mainDriver],
    denominatorChanged:changes.plannedMinutes!==0||current.priority.plannedMinutes!==previous.priority.plannedMinutes,
    capacityChanged:current.planningContext?.capacity?.state==='recorded'&&previous.planningContext?.capacity?.state==='recorded'&&current.planningContext.capacity.availableMinutes!==previous.planningContext.capacity.availableMinutes};
}
