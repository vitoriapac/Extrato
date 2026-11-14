import { h } from 'preact';
import { mountPreact } from '../../preact-mount.js';
import { TodaySubtabsNav, type TodaySubtabKey } from '../../components/TodaySubtabsNav.js';

export const TODAY_SUBTABS = ['hoje', 'conquistas'] as const;

export const isTodaySubtab = (value: unknown): value is TodaySubtabKey =>
  (TODAY_SUBTABS as readonly unknown[]).includes(value);

/** "#hoje/conquistas" → "conquistas"; "#hoje" ou qualquer outra coisa → null. */
export function todaySubtabFromHash(hash: string): TodaySubtabKey | null {
  const [base, sub] = String(hash || '')
    .replace('#', '')
    .split(/[/?]/);
  return base === 'hoje' && isTodaySubtab(sub) ? sub : null;
}

export const todaySubtabHash = (key: TodaySubtabKey) => (key === 'hoje' ? '#hoje' : `#hoje/${key}`);

export interface TodaySubtabsOptions {
  document: Document;
  /** Chamado ao mostrar uma subaba (ex.: desenhar as conquistas). */
  onShow?: (key: TodaySubtabKey) => void;
}

/** Abas internas de Hoje: "Plano de hoje" (padrão) e "Conquistas", com a subaba na URL. */
export function initTodaySubtabs({ document: doc, onShow }: TodaySubtabsOptions) {
  const mountNode = doc.getElementById('todaySubtabsMount');
  if (!mountNode)
    return {
      select: (_key: TodaySubtabKey) => {},
      current: () => 'hoje' as const,
      syncFromHash: () => {},
    };
  let active: TodaySubtabKey = 'hoje';

  const renderNav = () =>
    mountPreact(
      h(TodaySubtabsNav, { activeSubtab: active, onSelectSubtab: key => select(key) }),
      mountNode
    );

  function select(key: TodaySubtabKey, { focus = false, updateHash = true } = {}) {
    if (!isTodaySubtab(key)) return;
    active = key;
    doc.querySelectorAll<HTMLElement>('[data-today-subpanel]').forEach(panel => {
      const on = panel.dataset.todaySubpanel === key;
      panel.hidden = !on;
    });
    renderNav();
    if (focus) doc.getElementById(`todayTab-${key}`)?.focus();
    if (updateHash && doc.defaultView?.location.hash.replace(/[/?].*$/, '') === '#hoje')
      doc.defaultView.history.replaceState(null, '', todaySubtabHash(key));
    onShow?.(key);
  }

  renderNav();
  const win = doc.defaultView;
  // Atalho de URL colado ou avisos que apontam para "#hoje/conquistas" abrem a subaba direto.
  const syncFromHash = () => {
    const hash = win?.location.hash || '';
    if (!/^#hoje(\/|\?|$)/.test(hash)) return;
    const next = todaySubtabFromHash(hash) ?? 'hoje';
    if (next !== active) select(next, { updateHash: false });
  };
  win?.addEventListener('hashchange', syncFromHash);
  syncFromHash();

  return { select, current: () => active, syncFromHash };
}
