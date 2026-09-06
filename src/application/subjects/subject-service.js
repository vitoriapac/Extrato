export const DEFAULT_SUBJECT_NAMES=Object.freeze(['Português','Matemática','Matemática Financeira','Conhecimentos Bancários','Atualidades do Mercado Financeiro','Informática','Vendas e Negociação']);
const cleanName=value=>String(value||'').trim()||'Disciplina sem nome';
export function createSubjectService({repository,clock,idGenerator,onEvent=()=>{}}={}){
  if(!repository||!clock||typeof idGenerator!=='function')throw new TypeError('Serviço de disciplinas requer dependências.');
  const newSubject=name=>({id:idGenerator('subject'),name:cleanName(name),collapsed:false,archived:false,archivedAt:null,createdAt:clock.nowISO(),topics:[]});
  const newTopic=input=>({id:idGenerator('topic'),name:'',link:'',status:'Não iniciado',archived:false,archivedAt:null,notes:'',tags:[],difficulty:'Médio',createdAt:clock.nowISO(),firstCompletedAt:null,lastCompletedAt:null,completionCount:0,lastReviewedAt:null,reviewCount:0,examImportance:null,estimatedStudyMinutes:null,prerequisites:[],...input});
  return Object.freeze({
    create:name=>repository.add(newSubject(name)),rename:(id,name)=>repository.update(id,{name:cleanName(name)}),toggle:id=>{const item=repository.findById(id);return item?repository.update(id,{collapsed:!item.collapsed}):null},
    addDefaults:(names=DEFAULT_SUBJECT_NAMES)=>names.filter(name=>!repository.all().some(item=>item.name===name)).map(name=>repository.add(newSubject(name))),
    archive:id=>{const item=repository.update(id,{archived:true,archivedAt:clock.nowISO()});if(item)onEvent('subject_archived',id,null,{name:item.name});return item},restore:id=>{const item=repository.update(id,{archived:false,archivedAt:null});if(item)onEvent('subject_restored',id,null,{name:item.name});return item},remove:id=>repository.remove(id),
    addTopic:(subjectId,input={})=>repository.addTopic(subjectId,newTopic(input)),updateTopic:(subjectId,topicId,changes)=>repository.updateTopic(subjectId,topicId,changes),archiveTopic:(subjectId,topicId)=>{const item=repository.updateTopic(subjectId,topicId,{archived:true,archivedAt:clock.nowISO()});if(item)onEvent('topic_archived',subjectId,topicId,{name:item.name});return item},restoreTopic:(subjectId,topicId)=>{const item=repository.updateTopic(subjectId,topicId,{archived:false,archivedAt:null});if(item)onEvent('topic_restored',subjectId,topicId,{name:item.name});return item},removeTopic:(subjectId,topicId)=>repository.removeTopic(subjectId,topicId),findTopic:repository.findTopic
  });
}
