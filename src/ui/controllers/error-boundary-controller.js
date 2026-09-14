export function createErrorBoundaryController({document,onRetry=()=>{}}={}){
  const container=document?.getElementById('appErrorState'),message=document?.getElementById('appErrorMessage'),retry=document?.getElementById('appErrorRetryBtn');
  const clear=()=>{if(container)container.hidden=true;if(message)message.textContent=''};
  const report=(error,context='aplicação')=>{console.error(`Falha em ${context}`,error);if(message)message.textContent=`Não foi possível atualizar ${context}. Seus dados permanecem salvos.`;if(container)container.hidden=false;return error};
  retry?.addEventListener('click',()=>{clear();onRetry()});
  return Object.freeze({report,clear});
}
