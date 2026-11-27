import type { JSX } from 'preact';
import { Tabs, type TabItem } from '../primitives/tabs.js';

export type SubjectsSubtabKey = 'materias' | 'verticalizado' | 'leis' | 'jurisprudencia';

export const SUBJECTS_SUBTAB_DEFS: ReadonlyArray<{
  id: SubjectsSubtabKey;
  label: string;
}> = [
  { id: 'materias', label: 'Matérias' },
  { id: 'verticalizado', label: 'Edital verticalizado' },
  { id: 'leis', label: 'Lei Seca' },
  { id: 'jurisprudencia', label: 'Jurisprudência' },
];

export interface SubjectsSubtabsNavProps {
  activeSubtab: SubjectsSubtabKey;
  onSelectSubtab?: (key: SubjectsSubtabKey) => void;
}

export function SubjectsSubtabsNav({
  activeSubtab,
  onSelectSubtab,
}: SubjectsSubtabsNavProps): JSX.Element {
  const items: TabItem[] = SUBJECTS_SUBTAB_DEFS.map(item => ({
    id: item.id,
    label: item.label,
    tabId: `subjectsTab-${item.id}`,
    className: `subjects-subtab${activeSubtab === item.id ? ' active' : ''}`,
    buttonProps: {
      'data-subjects-subtab': item.id,
    },
  }));

  return (
    <Tabs
      label="Seções de Disciplinas"
      variant="underline"
      value={activeSubtab}
      onValueChange={nextKey => onSelectSubtab?.(nextKey as SubjectsSubtabKey)}
      listProps={{ className: 'subjects-subtabs-list' }}
      items={items}
    />
  );
}
