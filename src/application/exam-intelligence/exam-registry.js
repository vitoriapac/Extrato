import {createExam} from '../../domain/exam-intelligence/exam.js';
import {createExamQuestion} from '../../domain/exam-intelligence/exam-question.js';

export function createExamRegistry({state,idGenerator}={}){
  if(!state||!Array.isArray(state.exams)||!Array.isArray(state.examQuestions)||typeof idGenerator!=='function')throw new TypeError('Registro de provas requer estado e gerador de IDs.');
  const addExam=input=>{
    const exam=createExam({...input,id:input?.id||idGenerator('exam')});
    if(state.exams.some(item=>item.id===exam.id))throw new RangeError('A prova já está cadastrada.');
    state.exams.push(exam);return exam;
  };
  const addQuestion=input=>{
    const question=createExamQuestion({...input,id:input?.id||idGenerator('exam-question')});
    const subject=state.subjects.find(item=>item.id===question.subjectId);
    if(!state.exams.some(item=>item.id===question.examId)||!subject?.topics?.some(item=>item.id===question.topicId))throw new RangeError('A questão precisa apontar para prova e tópico existentes.');
    if(state.examQuestions.some(item=>item.id===question.id||item.examId===question.examId&&item.questionNumber===question.questionNumber))throw new RangeError('A questão já está cadastrada nesta prova.');
    state.examQuestions.push(question);return question;
  };
  return Object.freeze({addExam,addQuestion});
}
