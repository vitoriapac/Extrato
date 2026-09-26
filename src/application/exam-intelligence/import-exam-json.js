import {createExam} from '../../domain/exam-intelligence/exam.js';
import {createExamQuestion} from '../../domain/exam-intelligence/exam-question.js';

const clean=value=>typeof value==='string'?value.trim():'';
const key=value=>clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g,' ').trim();
const hash=value=>{let n=2166136261;for(const char of value){n^=char.charCodeAt(0);n=Math.imul(n,16777619)}return(n>>>0).toString(36)};
const identity=exam=>[exam.institution,exam.examName,exam.role,exam.board,exam.year].map(key).join('|');
const unique=items=>[...new Set(items)];

export function parseExamImportJson(text){
  if(typeof text!=='string'||!text.trim()||text.length>2*1024*1024)throw new TypeError('Arquivo vazio ou maior que 2 MB.');
  let data;try{data=JSON.parse(text)}catch{throw new TypeError('JSON inválido. Verifique a sintaxe do arquivo.')}
  const raw=data?.exam,rows=data?.questions;
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||!Array.isArray(rows)||!rows.length||rows.length>10000)throw new TypeError('Informe exam e uma lista de 1 a 10.000 questions.');
  const exam={institution:clean(raw.institution),examName:clean(raw.examName)||`${clean(raw.role)} ${raw.year??''}`.trim(),role:clean(raw.role),board:clean(raw.board),year:raw.year,date:raw.date??null,source:'imported',sourceReference:clean(raw.sourceReference)||null,coverage:raw.coverage??'partial',examTags:unique(Array.isArray(raw.examTags)?raw.examTags.map(clean):[]),expectedQuestionCount:raw.expectedQuestionCount??null};
  createExam({...exam,id:'exam-preview'});
  const numbers=new Set();
  const questions=rows.map((row,index)=>{
    if(!row||typeof row!=='object'||Array.isArray(row)||!Number.isInteger(row.number)||row.number<1||numbers.has(row.number))throw new TypeError(`Questão ${index+1}: número inválido ou duplicado.`);
    numbers.add(row.number);
    const subject=clean(row.subject),topic=clean(row.topic),weight=row.weight??null;
    if(!subject||!topic||subject.length>300||topic.length>300||weight!=null&&(!Number.isFinite(weight)||weight<=0))throw new TypeError(`Questão ${row.number}: disciplina, tópico ou peso inválido.`);
    return {number:row.number,subject,topic,weight};
  });
  if(exam.expectedQuestionCount!=null&&exam.expectedQuestionCount<questions.length)throw new TypeError('O total declarado não pode ser menor que as questões do arquivo.');
  return {exam,questions};
}

export function previewExamImport(parsed,{subjects=[],exams=[],examQuestions=[]}={}){
  const examId=`exam-import-${hash(identity(parsed.exam))}`;
  const existing=exams.find(item=>item.id===examId||identity(item)===identity(parsed.exam));
  const rows=parsed.questions.map(question=>{
    const matches=subjects.filter(subject=>!subject.archived&&key(subject.name)===key(question.subject));
    const subject=matches.length===1?matches[0]:null;
    const topics=subject?.topics?.filter(topic=>!topic.archived&&key(topic.name)===key(question.topic))||[];
    const topic=topics.length===1?topics[0]:null;
    const status=!subject?'subject-unresolved':!topic?'topic-unresolved':'mapped';
    return {...question,status,subjectId:subject?.id||null,topicId:topic?.id||null};
  });
  const existingQuestions=examQuestions.filter(question=>question.examId===(existing?.id||examId));
  return {examId:existing?.id||examId,existingExam:existing||null,rows,existingQuestionCount:existingQuestions.length,mappedCount:rows.filter(row=>row.status==='mapped').length,unresolvedCount:rows.filter(row=>row.status!=='mapped').length};
}

// Decisions are explicit per question: existing topic, create under an existing
// subject, or ignore. The function returns a new snapshot and never mutates input.
export function mergeExamImport(parsed,preview,decisions,{subjects=[],exams=[],examQuestions=[]}={}){
  const nextSubjects=structuredClone(subjects),nextExams=structuredClone(exams),nextQuestions=structuredClone(examQuestions);
  const examId=preview.examId,createdAt=new Date().toISOString();
  const existingIndex=nextExams.findIndex(exam=>exam.id===examId);
  const previousExam=existingIndex>=0?nextExams[existingIndex]:null;
  const pending=new Map((previousExam?.unresolvedQuestions||[]).map(row=>[row.number,row]));
  let added=0,updated=0,preserved=0,ignored=0,createdTopics=0;
  for(const row of preview.rows){
    const decision=decisions?.[row.number];
    if(decision?.action==='ignore'){
      ignored++;
      if(!nextQuestions.some(item=>item.examId===examId&&item.questionNumber===row.number))pending.set(row.number,{number:row.number,subject:row.subject,topic:row.topic,weight:row.weight});
      continue;
    }
    let subjectId=row.subjectId,topicId=row.topicId;
    if(decision?.action==='associate'){
      const subject=nextSubjects.find(item=>item.id===decision.subjectId&&!item.archived),topic=subject?.topics?.find(item=>item.id===decision.topicId&&!item.archived);
      if(!topic)throw new TypeError(`Questão ${row.number}: associação inválida.`);
      subjectId=subject.id;topicId=topic.id;
    }else if(decision?.action==='create'){
      const subject=nextSubjects.find(item=>item.id===decision.subjectId&&!item.archived);
      if(!subject)throw new TypeError(`Questão ${row.number}: escolha uma disciplina existente para criar o tópico.`);
      const name=clean(row.topic);
      const existing=subject.topics.find(item=>key(item.name)===key(name));
      if(existing){topicId=existing.id}else{
        topicId=`topic-import-${hash(`${examId}|${subject.id}|${key(name)}`)}`;
        subject.topics.push({id:topicId,name,link:'',status:'Não iniciado',archived:false,archivedAt:null,notes:'',tags:[],difficulty:'Médio',createdAt,firstCompletedAt:null,lastCompletedAt:null,completionCount:0,lastReviewedAt:null,reviewCount:0,examImportance:null,estimatedStudyMinutes:null,prerequisites:[]});createdTopics++;
      }
      subjectId=subject.id;
    }else if(row.status!=='mapped')throw new TypeError(`Questão ${row.number}: resolva o conflito antes de importar.`);
    const index=nextQuestions.findIndex(item=>item.examId===examId&&item.questionNumber===row.number);
    const existingQuestion=index>=0?nextQuestions[index]:null;
    const question=existingQuestion?.classification?.method==='manual'?existingQuestion:createExamQuestion({id:existingQuestion?.id||`exam-question-import-${hash(`${examId}|${row.number}`)}`,examId,subjectId,topicId,questionNumber:row.number,weight:row.weight,source:parsed.exam.sourceReference||'',classification:{method:'imported',confidence:1}});
    if(index>=0){nextQuestions[index]=question;if(question===existingQuestion)preserved++;else updated++}else{nextQuestions.push(question);added++}
    pending.delete(row.number);
  }
  const classifiedNumbers=new Set(nextQuestions.filter(item=>item.examId===examId).map(item=>item.questionNumber));
  for(const number of classifiedNumbers)pending.delete(number);
  const importedQuestionCount=new Set([...classifiedNumbers,...pending.keys()]).size;
  const expectedQuestionCount=parsed.exam.expectedQuestionCount??previousExam?.expectedQuestionCount??null;
  const complete=parsed.exam.coverage==='complete'&&pending.size===0&&(expectedQuestionCount==null||expectedQuestionCount===importedQuestionCount);
  const exam=createExam({...previousExam,...parsed.exam,id:examId,coverage:complete?'complete':parsed.exam.coverage==='complete'?'partial':parsed.exam.coverage,declaredCoverage:parsed.exam.coverage,examTags:parsed.exam.examTags,importedQuestionCount,expectedQuestionCount,unresolvedQuestions:[...pending.values()].sort((a,b)=>a.number-b.number)});
  if(existingIndex>=0)nextExams[existingIndex]=exam;else nextExams.push(exam);
  return {subjects:nextSubjects,exams:nextExams,examQuestions:nextQuestions,summary:{added,updated,preserved,ignored,createdTopics,examId}};
}
