import {examsInScope} from '../../domain/exam-intelligence/exam-evidence.js';

export function buildStrategicAchievements({candidates=[],sessions=[],exams=[],activeExamTags=[]}={}){
  const eligible=candidates.filter(item=>item.topicId&&!item.archived);
  const highImpact=new Map(eligible.filter(item=>item.examImpact>=70).map(item=>[item.topicId,item]));
  const studied=new Set(sessions.filter(item=>Number(item.durationSeconds)>0&&highImpact.has(item.topicId)).map(item=>item.topicId));
  const bySubject=new Map();
  for(const item of highImpact.values()){
    const rows=bySubject.get(item.subjectId)||[];
    rows.push(item);bySubject.set(item.subjectId,rows);
  }
  const criticalGroups=[...bySubject.values()].filter(rows=>rows.length>=2);
  const mastered=criticalGroups.filter(rows=>rows.every(item=>item.mastery>=70&&item.evidenceStrength>=.5));
  const best=criticalGroups.sort((a,b)=>b.filter(item=>item.mastery>=70&&item.evidenceStrength>=.5).length-a.filter(item=>item.mastery>=70&&item.evidenceStrength>=.5).length)[0]||[];
  const completeExams=examsInScope(exams,activeExamTags).filter(exam=>exam.coverage==='complete').length;
  return {
    strategist:{unlocked:studied.size>=10,progress:{current:Math.min(studied.size,10),target:10,unit:'tópicos'}},
    criticalCoverage:{unlocked:mastered.length>0,progress:best.length?{current:best.filter(item=>item.mastery>=70&&item.evidenceStrength>=.5).length,target:best.length,unit:'tópicos críticos'}:null},
    mappedExam:{unlocked:completeExams>=4,progress:{current:Math.min(completeExams,4),target:4,unit:'provas completas'}}
  };
}
