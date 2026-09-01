export function buildExecutiveSummary({readiness,daysToExam=null,pace={},topPriority=null,riskCount=0,weeklyGoal={},opportunityCount=0}={}){
  const readinessValue=readiness?.value;
  const general=readinessValue==null
    ?{value:'—',label:'Aguardando dados',detail:'Registre atividades para calcular a prontidão.'}
    :{value:`${readinessValue}/100`,label:`Confiança ${String(readiness.confidenceLabel||'baixa').toLowerCase()}`,detail:`${readiness.availableFactors?.length||0} de 5 fatores disponíveis`};
  const exam=daysToExam===null
    ?{value:'—',label:'Data da prova não definida',detail:'Configure a prova para avaliar o prazo.'}
    :{value:String(Math.max(0,daysToExam)),label:daysToExam===1?'dia até a prova':'dias até a prova',detail:daysToExam<0?'A data informada já passou.':''};
  const paceCard=pace.status==='ok'
    ?{value:String(pace.remaining),label:'tópicos restantes',detail:pace.comparativo==='atrasado'?'Ritmo abaixo do necessário':pace.comparativo==='no-prazo'?'Ritmo compatível com o prazo':'Prazo ainda não comparado'}
    :{value:pace.remaining==null?'—':String(pace.remaining),label:pace.status==='completo'?'Plano concluído':'Ritmo aguardando dados',detail:'Conclua tópicos para formar uma tendência.'};
  const achieved=Number(weeklyGoal.achieved)||0,target=Number(weeklyGoal.target)||0;
  const weekly={value:target?`${Math.round(achieved/target*100)}%`:'—',label:'meta semanal',detail:target?`${achieved} de ${target} tópicos`:'Meta não configurada'};
  return {
    cards:[general,exam,paceCard,weekly],
    primaryAction:topPriority?{title:topPriority.recommendedAction,subject:topPriority.subjectName,topic:topPriority.topicName,duration:topPriority.estimatedMinutes,reason:topPriority.reason||'Prioridade calculada com os dados atuais'}:null,
    riskCount:Math.max(0,Number(riskCount)||0),opportunityCount:Math.max(0,Number(opportunityCount)||0),
    opportunityMessage:opportunityCount>0?`${opportunityCount} oportunidade${opportunityCount===1?'':'s'} com importância de prova configurada.`:'Ainda não há dados suficientes para identificar oportunidades. Configure os pesos da prova e registre questões.'
  };
}
