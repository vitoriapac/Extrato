import {parseExamImportJson,previewExamImport,mergeExamImport} from '../../application/exam-intelligence/import-exam-json.js';
import {renderExamJsonPreview} from '../../ui/renderers/exam-import-json-renderer.js';
import {createHistoricalExamImportState,clearHistoricalExamImportState} from './exam-import-state.js';
import {collectHistoricalExamImportDecisions} from './exam-import-view-model.js';

export function createHistoricalExamImportController({document,getState,onImported,notify}){
  const fileInput=document.getElementById('examJsonFile');
  const previewContainer=document.getElementById('examJsonPreview');
  const importState=createHistoricalExamImportState();
  if(!fileInput||!previewContainer)return {mount(){},cancel(){}};
  const showState=(kind,label,message)=>{
    const note=document.createElement('aside');
    note.className=`context-note context-note--${kind}`;
    note.setAttribute('role','status');
    const title=document.createElement('strong');title.textContent=label;
    const detail=document.createElement('p');detail.textContent=message;
    note.append(title,detail);
    previewContainer.replaceChildren(note);
  };
  const cancel=()=>{clearHistoricalExamImportState(importState);previewContainer.innerHTML='';fileInput.focus()};
  const onFileChange=async()=>{
    const file=fileInput.files?.[0];if(!file)return;
    clearHistoricalExamImportState(importState);
    previewContainer.setAttribute('aria-busy','true');
    showState('loading','Carregando','Lendo e validando a prova histórica.');
    try{
      if(file.size>2*1024*1024)throw new TypeError('O arquivo excede 2 MB.');
      const parsed=parseExamImportJson(await file.text());
      const state=getState();
      if(!parsed.exam.examTags.length)parsed.exam.examTags=[...(state.examBlueprint.activeExamTags||[])];
      const preview=previewExamImport(parsed,state);
      importState.pending={parsed,preview};
      previewContainer.innerHTML=renderExamJsonPreview(parsed,preview,state.subjects);
    }catch(error){showState('attention','Não foi possível importar',error.message||'Não foi possível ler a prova.')}
    finally{previewContainer.removeAttribute('aria-busy')}
    fileInput.value='';
  };
  const onPreviewClick=event=>{
    if(event.target.id==='examJsonCancel'){cancel();return}
    if(event.target.id!=='examJsonConfirm'||!importState.pending)return;
    try{
      const {parsed,preview}=importState.pending;
      const decisions=collectHistoricalExamImportDecisions(preview,previewContainer);
      const result=mergeExamImport(parsed,preview,decisions,getState());
      onImported(result);
      clearHistoricalExamImportState(importState);
      showState('success','Prova importada',`${result.summary.added} questões novas, ${result.summary.updated} atualizadas, ${result.summary.preserved} revisões preservadas e ${result.summary.ignored} ignoradas.`);
      notify(`Prova importada: ${result.summary.added} questões novas, ${result.summary.updated} atualizadas, ${result.summary.preserved} revisões preservadas, ${result.summary.ignored} ignoradas.`);
    }catch(error){notify(error.message||'A importação falhou. Nenhum dado foi alterado.')}
  };
  return {mount(){fileInput.addEventListener('change',onFileChange);previewContainer.addEventListener('click',onPreviewClick)},cancel};
}
