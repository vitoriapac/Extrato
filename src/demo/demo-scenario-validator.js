const tags=new Set(['COMUM','BB','CAIXA']);
const integer=value=>Number.isInteger(value)&&value>=0;

export function validateDemoScenario(scenario){
  const errors=[];
  if(scenario?.meta?.format!=='studytrack-demo-blueprint'||scenario.meta.version!==2)errors.push('Formato ou versão do cenário inválidos.');
  if(typeof scenario?.meta?.seed!=='string'||!scenario.meta.seed.trim())errors.push('Seed inválida.');
  if(!integer(scenario?.meta?.historyDays)||scenario.meta.historyDays<1)errors.push('Janela histórica inválida.');
  if(!Array.isArray(scenario?.subjects))errors.push('Disciplinas ausentes.');
  const subjects=Array.isArray(scenario?.subjects)?scenario.subjects:[];
  const ids=new Set();
  for(const subject of subjects){
    if(!subject?.id||ids.has(subject.id))errors.push(`ID de disciplina inválido ou duplicado: ${subject?.id||'vazio'}.`);
    ids.add(subject?.id);
    if(!subject?.name||!Array.isArray(subject.topics)||!subject.topics.length)errors.push(`Disciplina incompleta: ${subject?.id||'vazio'}.`);
    for(const topic of Array.isArray(subject?.topics)?subject.topics:[]){
      if(!topic?.id||ids.has(topic.id))errors.push(`ID de tópico inválido ou duplicado: ${topic?.id||'vazio'}.`);
      ids.add(topic?.id);
      if(!topic?.name||!Array.isArray(topic.examTags)||!topic.examTags.length||topic.examTags.some(tag=>!tags.has(tag)))errors.push(`Tópico com nome ou escopo inválido: ${topic?.id||'vazio'}.`);
    }
  }
  const target=scenario?.targets||{};
  if(subjects.length!==target.subjects)errors.push('Total de disciplinas diferente da meta.');
  if(subjects.reduce((sum,subject)=>sum+(Array.isArray(subject?.topics)?subject.topics.length:0),0)!==target.topics)errors.push('Total de tópicos diferente da meta.');
  if(!integer(target.studySessions)||target.studySessions<1||!integer(target.studyQuestions)||target.studyQuestions<1)errors.push('Metas de estudo inválidas.');
  const phases=Array.isArray(scenario?.profile?.phases)?scenario.profile.phases:[];
  let next=1;
  for(const phase of phases){
    if(!Array.isArray(phase?.days)||phase.days[0]!==next||!integer(phase.days[1])||phase.days[1]<next||!Number.isFinite(phase.weeklyHours)||phase.weeklyHours<=0)errors.push(`Fase inválida: ${phase?.name||'sem nome'}.`);
    next=(phase?.days?.[1]||0)+1;
  }
  if(next!==scenario?.meta?.historyDays+1)errors.push('As fases não cobrem a janela histórica.');
  const durations=scenario?.sessions?.durationsMinutes;
  if(!Array.isArray(durations)||!durations.length||durations.some(value=>!integer(value)||value===0))errors.push('Durações de sessão inválidas.');
  const types=scenario?.sessions?.types;
  if(!Array.isArray(types)||!types.includes('questions')||types.some(type=>!['study','questions','review'].includes(type)))errors.push('Tipos de sessão inválidos.');
  const categories=scenario?.questions?.errorCategories;
  if(!Array.isArray(categories)||new Set(categories).size!==6||categories.some(value=>typeof value!=='string'))errors.push('Categorias de erro inválidas.');
  const accuracy=scenario?.questions?.monthlyAccuracyPct;
  if(!Array.isArray(accuracy)||!accuracy.length||accuracy.some(value=>!Number.isFinite(value)||value<0||value>100))errors.push('Trajetória de acertos inválida.');
  return {valid:errors.length===0,errors};
}

export function assertDemoScenario(scenario){const result=validateDemoScenario(scenario);if(!result.valid)throw new TypeError(`Cenário da demonstração inválido: ${result.errors.join(' ')}`);return scenario}
