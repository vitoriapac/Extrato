export const APP_MODES = Object.freeze({ REAL: 'real', DEMO: 'demo' });

type ModeStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null | undefined;

export function readAppMode(storage: ModeStorage) {
  try {
    return storage?.getItem('bb-premium-mode') === APP_MODES.DEMO ? APP_MODES.DEMO : APP_MODES.REAL;
  } catch (error) {
    return APP_MODES.REAL;
  }
}
export function enterDemoMode(storage: ModeStorage) {
  storage?.setItem('bb-premium-mode', APP_MODES.DEMO);
  return APP_MODES.DEMO;
}
export function exitDemoMode(storage: ModeStorage, demoKey = 'bb-premium-study-demo') {
  storage?.removeItem(demoKey);
  storage?.setItem('bb-premium-mode', APP_MODES.REAL);
  return APP_MODES.REAL;
}
export function resetDemoMode(storage: ModeStorage, demoKey = 'bb-premium-study-demo') {
  storage?.removeItem(demoKey);
  storage?.setItem('bb-premium-mode', APP_MODES.DEMO);
  return APP_MODES.DEMO;
}
