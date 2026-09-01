export async function bootstrapApplication({context,start,onError=()=>{}}={}){
  if(!context) throw new TypeError('O bootstrap requer o contexto da aplicação.');
  if(typeof start!=='function') throw new TypeError('O bootstrap requer uma função de inicialização.');
  try{
    await start(context);
    return {ok:true,context};
  }catch(error){
    onError(error,context);
    return {ok:false,error,context};
  }
}
