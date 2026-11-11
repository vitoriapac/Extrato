import { h } from 'preact';
import { mountPreact } from './preact-mount.js';
import { PlanningSubtabsNav } from './components/PlanningSubtabsNav.js';

// Planejamento agrupa as seções em blocos recolhíveis; o atalho aberto fica na URL como "#planejamento/<sub-aba>".
export const PLANNING_SUBTABS = ['semana', 'prova', 'metas', 'fechamento', 'historico'] as const;
export type PlanningSubtab = (typeof PLANNING_SUBTABS)[number];

export const isPlanningSubtab = (value: unknown): value is PlanningSubtab =>
  (PLANNING_SUBTABS as readonly unknown[]).includes(value);

const mountedNavSync = new WeakMap<Document, (key: PlanningSubtab) => void>();

/** "#planejamento/fechamento" → "fechamento"; anything else → null. */
export function subtabFromHash(hash: string): PlanningSubtab | null {
  const [base, sub] = String(hash || '')
    .replace('#', '')
    .split('/');
  return (base === 'planejamento' || base === 'metas') && isPlanningSubtab(sub) ? sub : null;
}

export function selectPlanningSubtab(
  key: PlanningSubtab,
  { doc = document, focus = false, updateHash = false } = {}
) {
  const syncNav = mountedNavSync.get(doc);
  if (syncNav) {
    syncNav(key);
    if (focus) doc.getElementById(`metasTab-${key}`)?.focus();
  } else {
    const tabs = doc.querySelectorAll<HTMLElement>('[data-metas-subtab]');
    if (!tabs.length) return;
    tabs.forEach(tab => {
      const active = tab.dataset.metasSubtab === key;
      const isAriaTab = tab.getAttribute('role') === 'tab';
      if (active) {
        if (isAriaTab) tab.removeAttribute('aria-current');
        else tab.setAttribute('aria-current', 'true');
        tab.setAttribute('aria-selected', 'true');
        tab.classList.add('active');
      } else {
        tab.removeAttribute('aria-current');
        tab.setAttribute('aria-selected', 'false');
        tab.classList.remove('active');
      }
      tab.tabIndex = active ? 0 : -1;
      if (active && focus) tab.focus();
    });
  }
  doc.querySelectorAll<HTMLElement>('[data-metas-subpanel]').forEach(panel => {
    // Sub-abas exclusivas: apenas o bloco ativo fica aberto/visível, eliminando a sobrecarga do Tabcordion.
    const active = panel.dataset.metasSubpanel === key;
    if ('open' in panel) {
      (panel as HTMLDetailsElement).open = active;
    }
    if (active) {
      panel.removeAttribute('hidden');
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });
  const select = doc.getElementById('metasSubtabSelect') as HTMLSelectElement | null;
  if (select) select.value = key;
  if (updateHash) doc.defaultView?.history.replaceState(null, '', `#planejamento/${key}`);
}

export function initPlanningSubtabs(doc: Document = document) {
  const mountNode =
    typeof globalThis.document !== 'undefined' &&
    doc === globalThis.document &&
    typeof doc.createElement === 'function'
      ? doc.getElementById('metasSubtabsMount')
      : null;

  const list = doc.querySelector<HTMLElement>('.metas-nav .overview-nav-links');
  if (!list && !mountNode) return;

  const choose = (key: string, focus = false) => {
    if (!isPlanningSubtab(key)) return;
    selectPlanningSubtab(key, { doc, focus, updateHash: true });
    // Below the sticky bar, a new sub-tab starts at its top instead of mid-page.
    const panel = doc.getElementById(`metasSub-${key}`);
    if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (mountNode) {
    const renderNav = (activeKey: PlanningSubtab) => {
      mountPreact(
        h(PlanningSubtabsNav, {
          activeSubtab: activeKey,
          onSelectSubtab: nextKey => choose(nextKey, false),
        }),
        mountNode
      );
    };
    mountedNavSync.set(doc, renderNav);
    const initialFromHash = subtabFromHash(doc.defaultView?.location.hash || '');
    renderNav(initialFromHash || 'semana');
  } else if (list) {
    list.addEventListener('click', event => {
      const tab = (event.target as Element).closest<HTMLElement>('[data-metas-subtab]');
      if (tab) choose(tab.dataset.metasSubtab!);
    });
    list.addEventListener('keydown', event => {
      const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
      const current = (event.target as Element).closest<HTMLElement>('[data-metas-subtab]');
      if (!current || !keys.includes(event.key)) return;
      event.preventDefault();
      const index = PLANNING_SUBTABS.indexOf(current.dataset.metasSubtab as PlanningSubtab);
      const last = PLANNING_SUBTABS.length - 1;
      const next =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? last
            : (index + (event.key === 'ArrowRight' ? 1 : -1) + PLANNING_SUBTABS.length) %
              PLANNING_SUBTABS.length;
      choose(PLANNING_SUBTABS[next], true);
    });
  }
  doc
    .getElementById('metasSubtabSelect')
    ?.addEventListener('change', event => choose((event.target as HTMLSelectElement).value));
  doc.getElementById('metasCollapseOthersBtn')?.addEventListener('click', () => {
    const currentTab = doc.querySelector<HTMLElement>(
      '[data-metas-subtab][aria-selected="true"], [data-metas-subtab][aria-current="true"]'
    );
    const activeKey = currentTab?.dataset.metasSubtab || 'semana';
    doc.querySelectorAll<HTMLElement>('[data-metas-subpanel]').forEach(panel => {
      (panel as HTMLDetailsElement).open = panel.dataset.metasSubpanel === activeKey;
    });
    const activePanel = doc.getElementById(`metasSub-${activeKey}`);
    if (activePanel) activePanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  doc.querySelectorAll<HTMLDetailsElement>('[data-metas-subpanel]').forEach(panel => {
    panel.addEventListener('toggle', () => {
      const key = panel.dataset.metasSubpanel;
      if (!key || !isPlanningSubtab(key)) return;
      if (panel.open) {
        selectPlanningSubtab(key, { doc, updateHash: true });
      } else if (panel.classList.contains('active')) {
        panel.open = true;
      }
    });
  });
  const fromHash = () => {
    const key = subtabFromHash(doc.defaultView?.location.hash || '');
    if (key) selectPlanningSubtab(key, { doc });
  };
  fromHash();
  doc.defaultView?.addEventListener('hashchange', fromHash);
}
