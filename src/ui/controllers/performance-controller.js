import {updatePerformanceViewState} from '../../application/performance/performance-view-state.js';

export function createPerformanceController({document,getViewState,setViewState,render,activateTab}){
  const update=patch=>setViewState(updatePerformanceViewState(getViewState(),patch));
  return {register(){
    document.addEventListener('click',event=>{
      const jump=event.target.closest('[data-performance-jump]');if(!jump)return;
      update({section:jump.dataset.performanceJump});
      if(jump.dataset.performanceSubjectId)update({subjectId:jump.dataset.performanceSubjectId});
      if(jump.dataset.performanceTopicId)update({topicId:jump.dataset.performanceTopicId});
      activateTab('desempenho');
    });
    document.getElementById('performancePage')?.addEventListener('click',event=>{
      const section=event.target.closest('[data-performance-section]');
      if(section){update({section:section.dataset.performanceSection});render();return}
      const compared=event.target.closest('[data-performance-compare-subject]');
      if(compared){update({subjectId:compared.dataset.performanceCompareSubject});render();return}
      const stable=event.target.closest('[data-stability-subject]');
      if(stable){update({subjectId:stable.dataset.stabilitySubject});render();return}
      const topic=event.target.closest('[data-performance-topic]');
      if(topic){update({topicId:topic.dataset.performanceTopic});render();return}
      if(event.target.closest('[data-performance-close-topic]')){document.getElementById('performanceTopicDialog')?.close();return}
      const open=event.target.closest('[data-performance-open]');
      if(open){document.getElementById('performanceTopicDialog')?.close();activateTab(open.dataset.performanceOpen)}
    });
    document.getElementById('performancePage')?.addEventListener('change',event=>{
      const field=event.target;
      if(field.matches('[data-performance-period]'))update({period:field.value});
      else if(field.matches('[data-performance-compare]'))update({comparePrevious:field.checked});
      else if(field.matches('[data-performance-subject]'))update({subjectId:field.value});
      else if(field.matches('[data-performance-subject-sort]'))update({subjectSort:field.value});
      else return;
      render();
    });
  }};
}
