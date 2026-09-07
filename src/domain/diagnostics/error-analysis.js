import {buildCognitiveProfile} from './cognitive-profile.js';
export const ERROR_CATEGORIES=Object.freeze(['naoSabia','esqueci','interpretacao','calculo','desatencao','chute']);
export const ERROR_ACTIONS=Object.freeze({
  naoSabia:{action:'Revisar a teoria e os conceitos-base',studyType:'study',estimatedMinutes:35,questions:10},
  esqueci:{action:'Fazer uma revisão curta e recuperar de memória',studyType:'review',estimatedMinutes:25,questions:15},
  interpretacao:{action:'Resolver questões comentadas de interpretação',studyType:'questions',estimatedMinutes:40,questions:15},
  calculo:{action:'Treinar exercícios de cálculo passo a passo',studyType:'questions',estimatedMinutes:45,questions:15},
  desatencao:{action:'Resolver questões com conferência obrigatória',studyType:'questions',estimatedMinutes:35,questions:20},
  chute:{action:'Reforçar conceitos antes de voltar às questões',studyType:'study',estimatedMinutes:30,questions:10}
});
export const ERROR_ANALYSIS_VERSION=1;
export function analyzeErrors(records=[],options={}){
  const minimumErrors=Math.max(1,Number(options.minimumErrors)||10),minimumCoverage=Math.max(0,Math.min(100,Number(options.minimumCoverage)||60)),minimumShare=Math.max(0,Math.min(100,Number(options.minimumShare)||30));
  const profile=buildCognitiveProfile(records,ERROR_CATEGORIES),ordered=Object.entries(profile.categories).sort((a,b)=>b[1]-a[1]),top=ordered[0],share=top&&profile.categorizedErrors?Math.round(top[1]/profile.categorizedErrors*100):0;
  const eligible=profile.categorizedErrors>=minimumErrors&&profile.coverage>=minimumCoverage&&top?.[1]>0&&share>=minimumShare;
  const dominant=eligible?{key:top[0],count:top[1],share,recommendation:ERROR_ACTIONS[top[0]]}:null;
  const mode=!dominant?'insufficient':['interpretacao','calculo','desatencao'].includes(dominant.key)?'practice':['esqueci'].includes(dominant.key)?'review':'theory';
  return {...profile,state:profile.totalErrors===0?'empty':eligible?'diagnosed':'insufficient',dominant,recommendedMode:mode,reasons:eligible?[share+'% dos erros categorizados são de '+dominant.key]:['Amostra ou cobertura insuficiente para orientar o estudo'],algorithmVersion:ERROR_ANALYSIS_VERSION};
}
