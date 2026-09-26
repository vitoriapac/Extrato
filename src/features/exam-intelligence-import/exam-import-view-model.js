export function collectHistoricalExamImportDecisions(preview,container){
  const decisions={};
  for(const row of preview.rows.filter(item=>item.status!=='mapped')){
    const field=container.querySelector(`[data-exam-decision="${row.number}"]`);
    const action=field?.value;
    if(!action)throw new TypeError(`Questão ${row.number}: escolha associar, criar ou ignorar.`);
    if(action==='associate'){
      const [subjectId,topicId]=(container.querySelector(`[data-exam-associate="${row.number}"]`)?.value||'').split('|');
      decisions[row.number]={action,subjectId,topicId};
    }else if(action==='create'){
      const subjectId=container.querySelector(`[data-exam-create="${row.number}"]`)?.value;
      decisions[row.number]={action,subjectId};
    }else decisions[row.number]={action};
  }
  return decisions;
}
