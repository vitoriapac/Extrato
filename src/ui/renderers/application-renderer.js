export function createApplicationRenderer({sections=[],scopes={},globalSections=[],getActiveScope=()=>null,afterRender=()=>{},onError=()=>{}}={}){
  const globals=new Set(globalSections);
  const render=(scope='all')=>{const selected=scope==='all'?null:scopes[scope==='active'?getActiveScope():scope];sections.filter(([name])=>!selected||globals.has(name)||selected.has(name)).forEach(([name,renderer])=>{try{renderer()}catch(error){onError(error,name)}});afterRender();return scope};
  return Object.freeze({render});
}
