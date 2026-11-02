// Collapsible page sections whose open/closed state is a per-browser UI preference, not study data.
const STORAGE_KEY = 'studytrack.sectionsOpen';

type SectionStore = Pick<Storage, 'getItem' | 'setItem'> | null;

const read = (storage: SectionStore): Record<string, boolean> => {
  try {
    const parsed = JSON.parse(storage?.getItem(STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const write = (storage: SectionStore, value: Record<string, boolean>) => {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Private mode or full storage: the section still works, it just is not remembered.
  }
};

/** Opens the remembered section that contains (or is) the target, so anchors never land in a closed one. */
export function openSectionFor(target: Element | null | undefined) {
  const section = target?.closest?.('details[data-remember]') as HTMLDetailsElement | null;
  if (section && !section.open) section.open = true;
}

/**
 * Restores every `details[data-remember]` from storage; without a saved choice it follows
 * `data-default-open` ("wide": open from 901 px, closed on phones). Toggling saves the choice.
 */
export function initRememberedSections({
  root = document,
  storage = (() => {
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  })(),
  wide = typeof window !== 'undefined' && Boolean(window.matchMedia?.('(min-width: 901px)').matches),
}: { root?: ParentNode; storage?: SectionStore; wide?: boolean } = {}) {
  const saved = read(storage);
  root.querySelectorAll<HTMLDetailsElement>('details[data-remember]').forEach(section => {
    const key = section.dataset.remember!;
    section.open = key in saved ? Boolean(saved[key]) : section.dataset.defaultOpen === 'wide' ? wide : section.dataset.defaultOpen === 'open';
    section.addEventListener('toggle', () => write(storage, { ...read(storage), [key]: section.open }));
  });
  root.addEventListener?.('click', (event: Event) => {
    const link = (event.target as Element | null)?.closest?.('a[href^="#"]');
    const id = link?.getAttribute('href')?.slice(1);
    if (id) openSectionFor(document.getElementById(id));
  });
}
