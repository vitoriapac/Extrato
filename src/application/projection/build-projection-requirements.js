import {PROJECTION_EVIDENCE_POLICY as policy} from '../../domain/forecasts/projection-evidence-policy.js';
// Mirrors the calibrated projection's actual availability gates.
export function buildProjectionRequirements(model) {
  const evidence=model?.evidence||{};
  const requirements=[
    {label:'Data da prova',met:model?.exam?.daysRemaining!=null&&model.exam.daysRemaining>=0,
      guidance:'Configure uma data de prova futura em Metas.'},
    {label:'Meta de nota usada',met:Number.isFinite(model?.current?.targetScore),guidance:'Configure a meta de nota em Metas.'},
    {label:'Simulados comparáveis em datas distintas',met:(evidence.observationCount||0)>=policy.minimumObservations,
      guidance:`Registre mais ${Math.max(0,policy.minimumObservations-(evidence.observationCount||0))} simulado(s) comparável(is) em datas distintas.`},
    {label:'Questões nos simulados comparáveis',met:(evidence.sampleSize||0)>=policy.minimumQuestions,
      guidance:`Acumule mais ${Math.max(0,policy.minimumQuestions-(evidence.sampleSize||0))} questão(ões) nos simulados comparáveis.`},
    {label:'Período observado',met:(evidence.spanDays||0)>=policy.minimumSpanDays,
      guidance:`Observe os resultados por mais ${Math.max(0,policy.minimumSpanDays-(evidence.spanDays||0))} dia(s).`}
  ];
  return {requirements,pending:requirements.filter(item=>!item.met)};
}
