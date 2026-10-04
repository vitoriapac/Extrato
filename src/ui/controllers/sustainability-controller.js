import {buildCapacityReviewPreview} from '../../application/planning-sustainability/build-capacity-review-preview.js';

export function createSustainabilityController({getModel,getCapacity,showPreview,navigate,formatMinutes}={}){
  return {review(){
    const preview=buildCapacityReviewPreview(getModel(),getCapacity());
    if(preview.state!=='ready'){showPreview(preview.message||'Ainda não há evidência comparável para esta revisão.');return preview;}
    const text=`Prévia de revisão de capacidade\n\nDisponibilidade atual: ${formatMinutes(preview.currentMinutes)} por semana.\nExecução observada em ${preview.comparableWeeks} semanas: ${formatMinutes(preview.observedRange.lowMinutes)} a ${formatMinutes(preview.observedRange.highMinutes)}.\n\nSe a disponibilidade fosse ${formatMinutes(preview.hypotheticalMinutes)}, a diferença seria ${formatMinutes(preview.differenceMinutes)}. Nenhum bloco foi redistribuído.\n\n${preview.message}\n\nAbrir a configuração não altera seus dados.`;
    showPreview(text,()=>navigate(),{confirmLabel:'Abrir disponibilidade'});return preview;
  }};
}
