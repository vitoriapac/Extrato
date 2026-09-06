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
  const contributions=Object.fromEntries(Object.entries(factors).map(([key,score])=>[key,Math.round(score*weights[key]/availableWeight)]));
  const completeness=totalWeight?Math.round(availableWeight/totalWeight*100)/100:0;
  return {value,factors,missingFactors,contributions,completeness};
}
