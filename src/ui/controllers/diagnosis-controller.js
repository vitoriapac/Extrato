export function createDiagnosisController({document,refreshRecommendations,getRecommendations,onStale,openPreview,activateTab,requestFrame}){
  return {register(){
    document.addEventListener('click',event=>{
      const dismiss=event.target.closest('[data-ignore-outside-suggestion]');
      if(dismiss){const card=dismiss.closest('.study-recommendation,.next-best-action');card.hidden=true;const heading=document.querySelector('#planoHojeContent h3')||card.parentElement;if(heading){heading.tabIndex=-1;heading.focus()}return}
      const button=event.target.closest('[data-next-best-preview]');if(!button)return;
      refreshRecommendations();
      const current=getRecommendations().find(item=>(item.recommendationId||item.id)===button.dataset.nextBestPreview);
      if(!current){onStale();return}
      openPreview();activateTab('metas');
      requestFrame(()=>document.getElementById('examStudyPlan')?.scrollIntoView({block:'start'}));
    });
  }};
}
