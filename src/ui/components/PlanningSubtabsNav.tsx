import type { JSX } from 'preact';
import { Tabs, type TabItem } from '../primitives/tabs.js';

export type PlanningSubtabKey = 'semana' | 'prova' | 'metas' | 'fechamento' | 'historico';

export const PLANNING_SUBTAB_DEFS: ReadonlyArray<{
  id: PlanningSubtabKey;
  label: string;
}> = [
  { id: 'semana', label: 'Plano da semana' },
  { id: 'prova', label: 'Prova e ritmo' },
  { id: 'metas', label: 'Metas por disciplina' },
  { id: 'fechamento', label: 'Fechamento semanal' },
  { id: 'historico', label: 'Histórico' },
];

export interface PlanningSubtabsNavProps {
  activeSubtab: PlanningSubtabKey;
  onSelectSubtab?: (key: PlanningSubtabKey) => void;
}

export function PlanningSubtabsNav({
  activeSubtab,
  onSelectSubtab,
}: PlanningSubtabsNavProps): JSX.Element {
  const items: TabItem[] = PLANNING_SUBTAB_DEFS.map(item => ({
    id: item.id,
    label: item.label,
    tabId: `metasTab-${item.id}`,
    className: `metas-subtab${activeSubtab === item.id ? ' active' : ''}`,
    buttonProps: {
      'data-metas-subtab': item.id,
      'aria-controls': `metasSub-${item.id}`,
    },
  }));

  return (
    <Tabs
      label="Seções do Planejamento"
      variant="underline"
      value={activeSubtab}
      onValueChange={nextKey => onSelectSubtab?.(nextKey as PlanningSubtabKey)}
      listProps={{ className: 'metas-subtabs-list' }}
      items={items}
    />
  );
}
