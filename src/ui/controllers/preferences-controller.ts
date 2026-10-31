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
