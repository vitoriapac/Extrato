import { renderIconSvg } from '../primitives/icon.js';
export function createPreferencesController({
  document,
  storage,
  key = 'bb-premium-theme',
}: any = {}) {
  if (!document) throw new TypeError('Controlador de preferências requer documento.');
  const current = () =>
    document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const sync = () => {
    const dark = current() === 'dark',
      icon = document.getElementById('themeToggleIcon'),
      button = document.getElementById('themeToggleBtn');
    // O ícone mostra o tema para o qual o botão leva.
    if (icon) icon.innerHTML = renderIconSvg(dark ? 'sun' : 'moon', { size: 16 });
    if (button)
      button.setAttribute('aria-label', dark ? 'Mudar para modo claro' : 'Mudar para modo escuro');
    return current();
  };
  const set = (theme: string) => {
    const normalized = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', normalized);
    try {
      storage?.setItem(key, normalized);
    } catch (error) {}
    sync();
    return normalized;
  };
  return Object.freeze({
    current,
    set,
    toggle: () => set(current() === 'dark' ? 'light' : 'dark'),
    sync,
  });
}

/** Compact or comfortable spacing, saved per browser (UI preference, not study data). */
export function createDensityController({
  document,
  storage,
  key = 'studytrack.density',
}: any = {}) {
  if (!document) throw new TypeError('Controlador de densidade requer documento.');
  const current = () =>
    document.documentElement.getAttribute('data-density') === 'compact' ? 'compact' : 'comfortable';
  const sync = () => {
    const compact = current() === 'compact',
      button = document.getElementById('densityToggleBtn');
    if (button) {
      button.innerHTML = renderIconSvg(compact ? 'baseline-density-small' : 'baseline-density-medium', { size: 16 });
      button.setAttribute('aria-pressed', String(compact));
      button.setAttribute('aria-label', 'Densidade compacta');
      button.setAttribute('title', compact ? 'Densidade compacta (ativa)' : 'Densidade confortável (ativa)');
    }
    return current();
  };
  const set = (density: string) => {
    const compact = density === 'compact';
    if (compact) document.documentElement.setAttribute('data-density', 'compact');
    else document.documentElement.removeAttribute('data-density');
    try {
      storage?.setItem(key, compact ? 'compact' : 'comfortable');
    } catch (error) {}
    sync();
    return current();
  };
  return Object.freeze({
    current,
    set,
    toggle: () => set(current() === 'compact' ? 'comfortable' : 'compact'),
    sync,
  });
}
