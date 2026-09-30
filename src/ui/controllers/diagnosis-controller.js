export function createDiagnosisController({document,refreshRecommendations,getRecommendations,onStale,openPreview,activateTab,requestFrame}){
  return {register(){
    document.getElementById('diagnosisCenter')?.addEventListener('click',event=>{
      const button=event.target.closest('[data-next-best-preview]');if(!button)return;
      refreshRecommendations();
      const current=getRecommendations().find(item=>(item.recommendationId||item.id)===button.dataset.nextBestPreview);
      if(!current){onStale();return}
      openPreview();activateTab('metas');
      requestFrame(()=>document.getElementById('examStudyPlan')?.scrollIntoView({block:'start'}));
    });
  }};
}
