import {examsInScope} from '../../domain/exam-intelligence/exam-evidence.js';
import {hasAdequateMastery,isHighImpact,STRATEGY_THRESHOLDS} from '../../domain/strategy/config.js';

export function buildStrategicAchievements({candidates=[],sessions=[],exams=[],activeExamTags=[]}={}){
  const eligible=candidates.filter(item=>item.topicId&&!item.archived);
  const highImpact=new Map(eligible.filter(item=>isHighImpact(item.examImpact)).map(item=>[item.topicId,item]));
  const studied=new Set(sessions.filter(item=>Number(item.durationSeconds)>0&&highImpact.has(item.topicId)).map(item=>item.topicId));
  const bySubject=new Map();
  for(const item of highImpact.values()){
    const rows=bySubject.get(item.subjectId)||[];
    rows.push(item);bySubject.set(item.subjectId,rows);
  }
  const criticalGroups=[...bySubject.values()].filter(rows=>rows.length>=2);
  const mastered=criticalGroups.filter(rows=>rows.every(hasAdequateMastery));
  const best=criticalGroups.sort((a,b)=>b.filter(hasAdequateMastery).length-a.filter(hasAdequateMastery).length)[0]||[];
  const completeExams=examsInScope(exams,activeExamTags).filter(exam=>exam.coverage==='complete').length;
  const missing=best.filter(item=>!hasAdequateMastery(item)).slice(0,3).map(item=>`${item.topicName||item.name||'Tópico'} — ${item.mastery==null?'domínio ainda sem medida':item.mastery<STRATEGY_THRESHOLDS.adequateMastery?`domínio ${Math.round(item.mastery)}/100`:'evidência insuficiente'}`);
  return {
    strategist:{unlocked:studied.size>=10,progress:{current:Math.min(studied.size,10),target:10,unit:'tópicos'},guidance:`Estude ${Math.max(0,10-studied.size)} ${10-studied.size===1?'tópico diferente':'tópicos diferentes'} de alto impacto para concluir.`},
    criticalCoverage:{unlocked:mastered.length>0,progress:best.length?{current:best.filter(hasAdequateMastery).length,target:best.length,unit:'tópicos críticos'}:null,guidance:best.length?'Nesta disciplina, complete o domínio e a evidência dos tópicos pendentes.':'Tenha pelo menos dois tópicos de alto impacto na mesma disciplina.',missing},
    mappedExam:{unlocked:completeExams>=4,progress:{current:Math.min(completeExams,4),target:4,unit:'provas completas'},guidance:`Cadastre ${Math.max(0,4-completeExams)} ${4-completeExams===1?'prova completa':'provas completas'} no concurso ativo.`}
  };
}
