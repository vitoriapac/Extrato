export function createHistoricalExamImportState(){
  return {pending:null};
}

export function clearHistoricalExamImportState(importState){
  importState.pending=null;
}
