// Planejamento shows one group of sections at a time; the choice lives in the URL as "#planejamento/<sub-aba>".
export const PLANNING_SUBTABS = ['semana', 'prova', 'metas', 'fechamento', 'historico'] as const;
export type PlanningSubtab = (typeof PLANNING_SUBTABS)[number];

export const isPlanningSubtab = (value: unknown): value is PlanningSubtab =>
  (PLANNING_SUBTABS as readonly unknown[]).includes(value);

/** "#planejamento/fechamento" → "fechamento"; anything else → null. */
export function subtabFromHash(hash: string): PlanningSubtab | null {
  const [base, sub] = String(hash || '').replace('#', '').split('/');
  return (base === 'planejamento' || base === 'metas') && isPlanningSubtab(sub) ? sub : null;
}

export function selectPlanningSubtab(
  key: PlanningSubtab,
  { doc = document, focus = false, updateHash = false } = {}
) {
  const tabs = doc.querySelectorAll<HTMLElement>('[data-metas-subtab]');
  if (!tabs.length) return;
  tabs.forEach(tab => {
    const active = tab.dataset.metasSubtab === key;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    if (active && focus) tab.focus();
  });
  doc.querySelectorAll<HTMLElement>('[data-metas-subpanel]').forEach(panel => {
    panel.hidden = panel.dataset.metasSubpanel !== key;
  });
  const select = doc.getElementById('metasSubtabSelect') as HTMLSelectElement | null;
  if (select) select.value = key;
  if (updateHash) doc.defaultView?.history.replaceState(null, '', `#planejamento/${key}`);
}

export function initPlanningSubtabs(doc: Document = document) {
  const list = doc.querySelector<HTMLElement>('.metas-nav [role="tablist"]');
  if (!list) return;
  const choose = (key: string, focus = false) => {
    if (!isPlanningSubtab(key)) return;
    selectPlanningSubtab(key, { doc, focus, updateHash: true });
    // Below the sticky bar, a new sub-tab starts at its top instead of mid-page.
    const panel = doc.getElementById(`metasSub-${key}`);
    if (panel && panel.getBoundingClientRect().top < 0) panel.scrollIntoView({ block: 'start' });
  };
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
  doc
    .getElementById('metasSubtabSelect')
    ?.addEventListener('change', event => choose((event.target as HTMLSelectElement).value));
  const fromHash = () => {
    const key = subtabFromHash(doc.defaultView?.location.hash || '');
    if (key) selectPlanningSubtab(key, { doc });
  };
  fromHash();
  doc.defaultView?.addEventListener('hashchange', fromHash);
}
