import type { JSX } from 'preact';
import { Tabs, type TabItem } from '../primitives/tabs.js';

export type TodaySubtabKey = 'hoje' | 'conquistas';

export const TODAY_SUBTAB_DEFS: ReadonlyArray<{ id: TodaySubtabKey; label: string }> = [
  { id: 'hoje', label: 'Plano de hoje' },
  { id: 'conquistas', label: 'Conquistas' },
];

export interface TodaySubtabsNavProps {
  activeSubtab: TodaySubtabKey;
  onSelectSubtab?: (key: TodaySubtabKey) => void;
}

export function TodaySubtabsNav({
  activeSubtab,
  onSelectSubtab,
}: TodaySubtabsNavProps): JSX.Element {
  const items: TabItem[] = TODAY_SUBTAB_DEFS.map(item => ({
    id: item.id,
    label: item.label,
    tabId: `todayTab-${item.id}`,
    className: `today-subtab${activeSubtab === item.id ? ' active' : ''}`,
    buttonProps: {
      'data-today-subtab': item.id,
      'aria-controls': `todaySub-${item.id}`,
    },
  }));

  return (
    <Tabs
      label="Seções de Hoje"
      variant="underline"
      value={activeSubtab}
      onValueChange={key => onSelectSubtab?.(key as TodaySubtabKey)}
      listProps={{ className: 'today-subtabs-list' }}
      items={items}
    />
  );
}
