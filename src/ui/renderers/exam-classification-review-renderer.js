import {examsInScope} from '../../domain/exam-intelligence/exam-evidence.js';
import {isTopicInExamScope} from '../../domain/exams/exam-scope.js';

const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
const confidenceLabel=value=>value<.5?'Baixa':value<.75?'Moderada':'Alta';

export function renderExamClassificationReview({exams=[],examQuestions=[],subjects=[],activeExamTags=[],filter='all'}={}){
  const scoped=examsInScope(exams,activeExamTags),examById=new Map(scoped.map(exam=>[exam.id,exam]));
  const classified=examQuestions.filter(question=>examById.has(question.examId)).map(question=>({...question,pending:false}));
  const pending=scoped.flatMap(exam=>(exam.unresolvedQuestions||[]).map(row=>({...row,examId:exam.id,questionNumber:row.number,pending:true})));
  const rows=[...pending,...classified].filter(row=>filter==='all'||filter==='unclassified'&&row.pending||filter==='low'&&!row.pending&&row.classification.confidence<.5||filter==='manual'&&!row.pending&&row.classification.method==='manual'||filter==='imported'&&!row.pending&&row.classification.method==='imported').sort((a,b)=>Number(b.pending)-Number(a.pending)||String(examById.get(a.examId)?.examName).localeCompare(String(examById.get(b.examId)?.examName),'pt-BR')||a.questionNumber-b.questionNumber);
  const topicOptions=subjects.filter(subject=>!subject.archived).flatMap(subject=>(subject.topics||[]).filter(topic=>!topic.archived).map(topic=>({id:topic.id,label:`${subject.name} → ${topic.name}`})));
  const cards=rows.slice(0,100).map(row=>{
    const exam=examById.get(row.examId),current=topicOptions.find(topic=>topic.id===row.topicId);
    const eligible=new Set(subjects.flatMap(subject=>(subject.topics||[]).filter(topic=>isTopicInExamScope(topic,exam.examTags||[])).map(topic=>topic.id)));
    const options=topicOptions.filter(topic=>eligible.has(topic.id)).map(topic=>`<option value="${escape(topic.id)}"${topic.id===row.topicId?' selected':''}>${escape(topic.label)}</option>`).join('');
    const confidence=row.pending?'Sem classificação':confidenceLabel(row.classification.confidence);
    const method=row.pending?'Pendente':row.classification.method==='manual'?'Manual':row.classification.method==='imported'?'Importada':row.classification.method==='catalog'?'Catálogo':'Assistida';
    return `<article class="exam-classification-row" data-review-exam="${escape(row.examId)}" data-review-number="${row.questionNumber}"><strong>Questão ${row.questionNumber} · ${escape(exam.institution)} ${exam.year}</strong><span>${escape(exam.examName)} · ${escape(exam.board)}</span><span>Atual: ${escape(current?.label||`${row.subject||'Sem disciplina'} → ${row.topic||'Sem tópico'}`)} · ${escape(confidence)} · ${escape(method)}</span><label>Tópico<select data-review-topic><option value="">Escolha um tópico</option>${options}</select></label><label>Confiança após revisão<select data-review-confidence><option value="1"${!row.pending&&row.classification.confidence>=.75?' selected':''}>Alta</option><option value="0.7"${!row.pending&&row.classification.confidence>=.5&&row.classification.confidence<.75?' selected':''}>Moderada</option><option value="0.4"${!row.pending&&row.classification.confidence<.5?' selected':''}>Baixa</option></select></label><button class="btn small" type="button" data-review-save>Salvar classificação</button></article>`;
  }).join('');
  return `<div class="exam-classification-toolbar"><label>Mostrar<select id="examClassificationFilter"><option value="all"${filter==='all'?' selected':''}>Todas</option><option value="unclassified"${filter==='unclassified'?' selected':''}>Não classificadas</option><option value="low"${filter==='low'?' selected':''}>Baixa confiança</option><option value="manual"${filter==='manual'?' selected':''}>Criadas manualmente</option><option value="imported"${filter==='imported'?' selected':''}>Importadas</option></select></label><p>${rows.length} questões${rows.length>100?' · primeiras 100 exibidas':''}</p></div><div class="exam-classification-list">${cards||'<p>Nenhuma questão corresponde ao filtro.</p>'}</div>`;
}
