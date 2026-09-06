import {confidenceLabel} from './evidence.js';

const unit=value=>Math.max(0,Math.min(1,Number(value)||0));

// Input completeness is distinct from observational evidence and uncertainty.
export function describeScoreEvidence({completeness=0,evidenceStrength=null}={}){
  const coverage=unit(completeness),strength=evidenceStrength==null?null:unit(evidenceStrength);
  return {completeness:coverage,completenessLabel:confidenceLabel(coverage),
    evidenceStrength:strength,evidenceLabel:strength===null?'Não avaliada':confidenceLabel(strength),
    uncertainty:'heuristic',detail:'Estimativa por regras; não representa probabilidade de aprovação.'};
}

export function calculateFactorScore(input={},weights={}){
  const factors={},missingFactors=[];
  let weighted=0,availableWeight=0;
  const totalWeight=Object.values(weights).reduce((sum,value)=>sum+value,0);
  for(const [key,weight] of Object.entries(weights)){
    const value=input[key];
    if(value==null||value===''||!Number.isFinite(Number(value))){missingFactors.push(key);continue;}
    factors[key]=Math.max(0,Math.min(100,Number(value)));
    weighted+=factors[key]*weight;availableWeight+=weight;
  }
  const value=availableWeight?Math.round(weighted/availableWeight):null;
  const exactContributions=Object.entries(factors).map(([key,score])=>({key,exact:score*weights[key]/availableWeight}));
  const contributionValues=exactContributions.map(item=>Math.floor(item.exact));
  let remainder=(value??0)-contributionValues.reduce((sum,item)=>sum+item,0);
  exactContributions.map((item,index)=>({index,fraction:item.exact-Math.floor(item.exact)}))
    .sort((a,b)=>b.fraction-a.fraction||a.index-b.index)
    .forEach(item=>{if(remainder>0){contributionValues[item.index]++;remainder--}});
  const contributions=Object.fromEntries(exactContributions.map((item,index)=>[item.key,contributionValues[index]]));
  const completeness=totalWeight?Math.round(availableWeight/totalWeight*100)/100:0;
  return {value,factors,missingFactors,contributions,completeness};
}

export function createScoreResult({value=null,state=null,evidence=null,confidence=null,factors={},reasons=[],algorithmVersion=1,...details}={}){
  const numeric=value==null||!Number.isFinite(Number(value))?null:Math.max(0,Math.min(100,Math.round(Number(value))));
  const scoreEvidence=evidence||describeScoreEvidence({completeness:0,evidenceStrength:confidence});
  return {value:numeric,state:state||(numeric===null?'empty':'estimated'),evidence:scoreEvidence,
    confidence:confidence==null?scoreEvidence.evidenceStrength:Math.max(0,Math.min(1,Number(confidence)||0)),
    factors,reasons:[...new Set((reasons||[]).filter(Boolean))],algorithmVersion:Math.max(1,Math.floor(Number(algorithmVersion)||1)),...details};
}
