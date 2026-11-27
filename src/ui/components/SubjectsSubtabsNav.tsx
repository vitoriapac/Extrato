import type { JSX } from 'preact';
import { Tabs, type TabItem } from '../primitives/tabs.js';

export type SubjectsSubtabKey = 'materias' | 'verticalizado' | 'leis' | 'jurisprudencia';

export const SUBJECTS_SUBTAB_DEFS: ReadonlyArray<{
  id: SubjectsSubtabKey;
  label: string;
  panelId: string;
}> = [
  { id: 'materias', label: 'Matérias', panelId: 'subjectsPanel-materias' },
  { id: 'verticalizado', label: 'Edital verticalizado', panelId: 'verticalizedSyllabusMount' },
  { id: 'leis', label: 'Lei Seca', panelId: 'lawNotebookCard' },
  { id: 'jurisprudencia', label: 'Jurisprudência', panelId: 'jurisprudenceNotebookCard' },
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
      'aria-controls': item.panelId,
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
