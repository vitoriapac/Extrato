export function createQuestionController({service,onChange=()=>{}}={}){
  if(!service)throw new Error('question service is required');
  const refresh=()=>onChange(service.list());
  return {create(input){const value=service.create(input);refresh();return value},update(id,changes){const value=service.update(id,changes);refresh();return value},remove(id){const value=service.remove(id);refresh();return value},refresh};
}
