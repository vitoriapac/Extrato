export const APP_MODES=Object.freeze({REAL:'real',DEMO:'demo'});

export function readAppMode(storage){
  try{return storage?.getItem('bb-premium-mode')===APP_MODES.DEMO?APP_MODES.DEMO:APP_MODES.REAL}catch(error){return APP_MODES.REAL}
}
export function enterDemoMode(storage){
  storage?.setItem('bb-premium-mode',APP_MODES.DEMO);
  return APP_MODES.DEMO;
}
export function exitDemoMode(storage,demoKey='bb-premium-study-demo'){
  storage?.removeItem(demoKey);storage?.setItem('bb-premium-mode',APP_MODES.REAL);
  return APP_MODES.REAL;
}
export function resetDemoMode(storage,demoKey='bb-premium-study-demo'){
  storage?.removeItem(demoKey);storage?.setItem('bb-premium-mode',APP_MODES.DEMO);
  return APP_MODES.DEMO;
}
